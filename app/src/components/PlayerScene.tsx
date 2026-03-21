import { Billboard } from "@react-three/drei";
import { animated as a, useSpring } from "@react-spring/three";
import { useEffect, useMemo, useRef, useState } from "react";
import { Color, FrontSide, Texture, TextureLoader } from "three";
import { ActivePlayerPanel } from "./ActivePlayerPanel";
import { Field } from "../scene/Field";
import { FieldPerspectiveCamera } from "../scene/FieldCamera";
import { SceneScrim } from "../scene/SceneScrim";
import type { TeamTransitionState } from "../store/teamStore";
import { useTeamStore } from "../store/teamStore";
import type { Player } from "../types";
import type { PlayerSlot } from "../utils/buildFormationSlots";
import Shadow from "./Shadow";

const PLAYER_RADIUS = 6;
const PLAYER_RING_WIDTH = 0.6;
const PLAYER_SURFACE_OFFSET = 0.03;
const PLAYER_CENTER_RADIUS = PLAYER_RADIUS - PLAYER_RING_WIDTH;
const PLAYER_RING_INNER_LINE_WIDTH_NORM = 0.018;
const PLAYER_RING_INNER_LINE_SOFTNESS_NORM = 0.006;
const PLAYER_PROFILE_Z_OFFSET = 0.01;
const HOVER_SCALE = 1.5;
const DRAG_THRESHOLD_PX = 6;

type PlayerSpringStyle = { y: any; opacity: any };

type PlayerTokenProps = {
  slot: PlayerSlot;
  springStyle: PlayerSpringStyle;
  player: Player;
  hoverEnabled: boolean;
};

type PlayerSceneProps = {
  slots: PlayerSlot[];
  players: Player[];
  playerSprings: PlayerSpringStyle[];
  transitionState: TeamTransitionState;
};

function PlayerToken({
  slot,
  springStyle,
  player,
  hoverEnabled,
}: PlayerTokenProps) {
  const setActivePlayerId = useTeamStore((s) => s.setActivePlayerId);
  const activePlayerId = useTeamStore((s) => s.activePlayerId);
  // Group origin = bottom of disc (pivot for hover scale). Mesh is offset +Y by PLAYER_RADIUS so the circle still sits on the field.
  const baseY = PLAYER_SURFACE_OFFSET;
  const [isHovered, setIsHovered] = useState(false);
  const team = useTeamStore((s) => s.team);
  const isActive = activePlayerId === player.id;
  const scaledUp = isHovered || isActive;
  const profilePictureUrl = (player.profilePictureUrl ?? player.profilePicture)
    ?.trim()
    ?.replace(/^\.\//, "");
  const hasProfileTexture = Boolean(profilePictureUrl);
  const profileTextureSrc = hasProfileTexture
    ? `${import.meta.env.BASE_URL}img/players/${team.code}/${profilePictureUrl}`
    : null;
  const [profileTexture, setProfileTexture] = useState<Texture | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!profileTextureSrc) {
      setProfileTexture(null);
      return () => {
        cancelled = true;
      };
    }

    // Clear previous team's portrait immediately to prevent a stale-frame flash.
    setProfileTexture(null);

    const loader = new TextureLoader();
    loader.load(
      profileTextureSrc,
      (loadedTexture) => {
        if (cancelled) return;
        setProfileTexture(loadedTexture);
      },
      undefined,
      () => {
        if (cancelled) return;
        setProfileTexture(null);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [profileTextureSrc]);

  const hoverSpring = useSpring({
    scale: scaledUp ? HOVER_SCALE : 1,
    config: { tension: 320, friction: 24 },
  });
  const shadowOpacity = springStyle.opacity.to((value: number) => value * 0.25);
  const shadowTravelZ = springStyle.opacity.to((value: number) => {
    const t = Math.min(1, (1 - value) * 3);
    return -5 - t * 1.6;
  });
  const ringShaderUniforms = useMemo(
    () => ({
      uInnerColor: { value: new Color(team.playerRingColorDark) },
      uOuterColor: { value: new Color(team.playerRingColor) },
      uInnerRadiusNorm: { value: PLAYER_CENTER_RADIUS / PLAYER_RADIUS },
      uInnerLineWidthNorm: { value: PLAYER_RING_INNER_LINE_WIDTH_NORM },
      uInnerLineSoftnessNorm: { value: PLAYER_RING_INNER_LINE_SOFTNESS_NORM },
      uOpacity: { value: 1 },
    }),
    [],
  );

  useEffect(() => {
    if (!hoverEnabled) setIsHovered(false);
  }, [hoverEnabled]);

  return (
    <group position={[slot.x, baseY, slot.z]}>
      <a.group position-z={shadowTravelZ}>
        <a.group scale={hoverSpring.scale}>
          <Shadow opacity={shadowOpacity} position={[0, 0.16, 0]} />
        </a.group>
      </a.group>
      <Billboard follow>
        <a.group position-y={springStyle.y}>
          {/* Scale from bottom-center: circleGeometry is XY-centered; offset mesh +Y so y=-R sits at this group's origin */}
          <a.group scale={hoverSpring.scale}>
            <group
              position={[0, PLAYER_RADIUS, 0]}
              onPointerOver={(e) => {
                // Prevent farther intersected players from also receiving hover events.
                e.stopPropagation();
                if (!hoverEnabled) return;
                setIsHovered(true);
              }}
              onPointerMove={(e) => {
                // Keep hover occlusion active while pointer moves across this player.
                e.stopPropagation();
              }}
              onPointerOut={() => setIsHovered(false)}
              onClick={(e) => {
                e.stopPropagation();
                setActivePlayerId(player.id);
              }}
            >
              <mesh renderOrder={isActive ? 1101 : 0}>
                <ringGeometry
                  args={[PLAYER_CENTER_RADIUS, PLAYER_RADIUS, 32]}
                />
                <a.shaderMaterial
                  uniforms={ringShaderUniforms}
                  vertexShader={`
                    varying vec2 vUv;

                    void main() {
                      vUv = uv;
                      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                  `}
                  fragmentShader={`
                    uniform vec3 uInnerColor;
                    uniform vec3 uOuterColor;
                    uniform float uInnerRadiusNorm;
                    uniform float uInnerLineWidthNorm;
                    uniform float uInnerLineSoftnessNorm;
                    uniform float uOpacity;
                    varying vec2 vUv;

                    vec3 linearToSrgb(vec3 color) {
                      return pow(color, vec3(1.0 / 2.2));
                    }

                    void main() {
                      vec2 centerUv = vec2(0.5, 0.5);
                      float dist = distance(vUv, centerUv);
                      float innerDist = 0.5 * uInnerRadiusNorm;
                      float bandEnd = innerDist + uInnerLineWidthNorm;
                      float lineMask = 1.0 - smoothstep(innerDist, bandEnd + uInnerLineSoftnessNorm, dist);
                      vec3 ringColorLinear = mix(uOuterColor, uInnerColor, lineMask);
                      vec3 ringColorSrgb = linearToSrgb(ringColorLinear);
                      gl_FragColor = vec4(ringColorSrgb, uOpacity);
                    }
                  `}
                  transparent
                  toneMapped={false}
                  uniforms-uOpacity-value={springStyle.opacity}
                  depthTest={!isActive}
                  depthWrite={!isActive}
                  side={FrontSide}
                />
              </mesh>
              {/* Slightly inset center to create a subtle ring overhang effect. */}
              <mesh renderOrder={isActive ? 1102 : 1}>
                <circleGeometry args={[PLAYER_CENTER_RADIUS, 20]} />
                <a.meshBasicMaterial
                  color={team.playerBgColor}
                  transparent
                  opacity={springStyle.opacity}
                  depthTest={!isActive}
                  depthWrite={!isActive}
                  polygonOffset
                  polygonOffsetFactor={1}
                  polygonOffsetUnits={1}
                  side={FrontSide}
                />
              </mesh>
              {hasProfileTexture && profileTexture ? (
                <mesh
                  position={[0, 0, PLAYER_PROFILE_Z_OFFSET]}
                  renderOrder={isActive ? 1103 : 2}
                >
                  <circleGeometry args={[PLAYER_CENTER_RADIUS, 20]} />
                  <a.meshBasicMaterial
                    color="#ffffff"
                    map={profileTexture as any}
                    transparent
                    opacity={springStyle.opacity}
                    depthTest={!isActive}
                    depthWrite={false}
                    polygonOffset
                    polygonOffsetFactor={-1}
                    polygonOffsetUnits={-1}
                    side={FrontSide}
                  />
                </mesh>
              ) : null}
            </group>
          </a.group>
        </a.group>
      </Billboard>
    </group>
  );
}

export function PlayerScene({
  slots,
  players,
  playerSprings,
  transitionState,
}: PlayerSceneProps) {
  const activePlayerId = useTeamStore((s) => s.activePlayerId);
  const teamCode = useTeamStore((s) => s.team.code);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const activePlayerX = useMemo(() => {
    if (!activePlayerId) return null;
    const idx = players.findIndex((p) => p.id === activePlayerId);
    if (idx < 0) return null;
    const slot = slots[idx];
    return slot ? slot.x : null;
  }, [activePlayerId, players, slots]);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      setIsDragging(false);
    };
    const handlePointerMove = (e: PointerEvent) => {
      const start = dragStartRef.current;
      if (!start || isDraggingRef.current) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
        setIsDragging(true);
      }
    };
    const handlePointerUp = () => {
      dragStartRef.current = null;
      setIsDragging(false);
    };
    const handlePointerCancel = () => {
      dragStartRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener("pointerdown", handlePointerDown, {
      passive: true,
    });
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerCancel, {
      passive: true,
    });

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, []);

  const hoverEnabled = !isDragging;

  return (
    <>
      <FieldPerspectiveCamera targetX={activePlayerX} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[18, 32, 12]} intensity={1.15} />
      <SceneScrim />
      <Field>
        {transitionState === "exited"
          ? null
          : playerSprings.map((springStyle, index) => {
              const slot = slots[index];
              const player = players[index];
              if (!slot || !player) return null;

              return (
                <PlayerToken
                  key={`${teamCode}-${player.id}`}
                  slot={slot}
                  springStyle={springStyle}
                  player={player}
                  hoverEnabled={hoverEnabled}
                />
              );
            })}
        <ActivePlayerPanel slots={slots} />
      </Field>
    </>
  );
}
