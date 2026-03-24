import { Billboard, Html } from "@react-three/drei";
import * as THREE from "three";
import { animated as a, useSpring } from "@react-spring/three";
import { useEffect, useMemo, useRef, useState } from "react";
import { Color, FrontSide, Texture, TextureLoader } from "three";
import { Field } from "../scene/Field";
import { FieldPerspectiveCamera } from "../scene/FieldCamera";
import { SceneScrim } from "../scene/SceneScrim";
import type { TeamTransitionState } from "../store/teamStore";
import { useTeamStore } from "../store/teamStore";
import type { Player } from "../types";
import type { PlayerSlot } from "../utils/buildFormationSlots";
import Shadow from "./Shadow";
import { brighten, darken } from "../utils/color";
import GoalNet from "../scene/GoalNet";
import {
  FIELD_WORLD_INNER_DEPTH,
  FIELD_WORLD_INNER_WIDTH,
} from "../scene/constants";

const PLAYER_RADIUS = 6;
const PLAYER_RING_WIDTH = 0.6;
const PLAYER_SURFACE_OFFSET = 0.03;
const PLAYER_CENTER_RADIUS = PLAYER_RADIUS - PLAYER_RING_WIDTH;
const PLAYER_RING_SEGMENTS = 48;
const PLAYER_CENTER_SEGMENTS = 48;
const PLAYER_RING_INNER_LINE_WIDTH_NORM = 0.018;
const PLAYER_RING_INNER_LINE_SOFTNESS_NORM = 0.006;
const PLAYER_RING_OUTER_LINE_WIDTH_NORM = 0.012;
const PLAYER_RING_OUTER_LINE_SOFTNESS_NORM = 0.003;
const PLAYER_RING_OUTER_LINE_FADE_TOP_Y_NORM = 1.0;
const PLAYER_RING_OUTER_LINE_FADE_BOTTOM_Y_NORM = 0.5;

const PLAYER_RING_OUTER_DARK_LINE_WIDTH_NORM = 0.012;
const PLAYER_RING_OUTER_DARK_LINE_SOFTNESS_NORM = 0.003;
const PLAYER_RING_OUTER_DARK_LINE_FADE_TOP_Y_NORM = 1.0;
const PLAYER_RING_OUTER_DARK_LINE_FADE_BOTTOM_Y_NORM = 0.3;
const PLAYER_PROFILE_Z_OFFSET = 0.01;
const HOVER_SCALE = 1.33;
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
  const listHoveredPlayerId = useTeamStore((s) => s.listHoveredPlayerId);
  // Group origin = bottom of disc (pivot for hover scale). Mesh is offset +Y by PLAYER_RADIUS so the circle still sits on the field.
  const baseY = PLAYER_SURFACE_OFFSET;
  const [isHovered, setIsHovered] = useState(false);
  const team = useTeamStore((s) => s.team);
  const isActive = activePlayerId === player.id;
  const listHoverMatch = listHoveredPlayerId === player.id;
  const scaledUp = isHovered || isActive || listHoverMatch;
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
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.center.set(0.5, 0.5);
        // loadedTexture.rotation = Math.PI / 2;
        loadedTexture.anisotropy = 8;
        loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
        loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
        loadedTexture.generateMipmaps = false;
        loadedTexture.minFilter = THREE.LinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.needsUpdate = true;
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
      uInnerColor: { value: new Color(darken(team.playerRingColor, 0.3)) },
      uOuterColor: { value: new Color(team.playerRingColor) },
      uInnerRadiusNorm: { value: PLAYER_CENTER_RADIUS / PLAYER_RADIUS },
      uInnerLineWidthNorm: { value: PLAYER_RING_INNER_LINE_WIDTH_NORM },
      uInnerLineSoftnessNorm: { value: PLAYER_RING_INNER_LINE_SOFTNESS_NORM },
      uOuterLineColor: {
        value: new Color(brighten(team.playerRingColor, 0.4)),
      },
      uOuterLineWidthNorm: { value: PLAYER_RING_OUTER_LINE_WIDTH_NORM },
      uOuterLineSoftnessNorm: { value: PLAYER_RING_OUTER_LINE_SOFTNESS_NORM },
      uOuterLineFadeTopYNorm: { value: PLAYER_RING_OUTER_LINE_FADE_TOP_Y_NORM },
      uOuterLineFadeBottomYNorm: {
        value: PLAYER_RING_OUTER_LINE_FADE_BOTTOM_Y_NORM,
      },
      uOuterDarkLineColor: {
        value: new Color(darken(team.playerRingColor, 0.2)),
      },
      uOuterDarkLineWidthNorm: {
        value: PLAYER_RING_OUTER_DARK_LINE_WIDTH_NORM,
      },
      uOuterDarkLineSoftnessNorm: {
        value: PLAYER_RING_OUTER_DARK_LINE_SOFTNESS_NORM,
      },
      uOuterDarkLineFadeTopYNorm: {
        value: PLAYER_RING_OUTER_DARK_LINE_FADE_TOP_Y_NORM,
      },
      uOuterDarkLineFadeBottomYNorm: {
        value: PLAYER_RING_OUTER_DARK_LINE_FADE_BOTTOM_Y_NORM,
      },
      uOpacity: { value: 1 },
    }),
    [team],
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
                  args={[
                    PLAYER_CENTER_RADIUS,
                    PLAYER_RADIUS,
                    PLAYER_RING_SEGMENTS,
                  ]}
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
                    uniform vec3 uOuterLineColor;
                    uniform float uOuterLineWidthNorm;
                    uniform float uOuterLineSoftnessNorm;
                    uniform float uOuterLineFadeTopYNorm;
                    uniform float uOuterLineFadeBottomYNorm;
                    uniform vec3 uOuterDarkLineColor;
                    uniform float uOuterDarkLineWidthNorm;
                    uniform float uOuterDarkLineSoftnessNorm;
                    uniform float uOuterDarkLineFadeTopYNorm;
                    uniform float uOuterDarkLineFadeBottomYNorm;
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
                      float outerDist = 0.5;
                      float outerBandStart = outerDist - uOuterLineWidthNorm;
                      float outerMaskStart = smoothstep(
                        outerBandStart - uOuterLineSoftnessNorm,
                        outerBandStart + uOuterLineSoftnessNorm,
                        dist
                      );
                      float outerMaskEnd = smoothstep(
                        outerDist - uOuterLineSoftnessNorm,
                        outerDist + uOuterLineSoftnessNorm,
                        dist
                      );
                      float outerLineMask = outerMaskStart - outerMaskEnd;
                      float outerFadeDenom = max(0.0001, uOuterLineFadeTopYNorm - uOuterLineFadeBottomYNorm);
                      float outerLineAlphaByY = clamp(
                        (vUv.y - uOuterLineFadeBottomYNorm) / outerFadeDenom,
                        0.0,
                        1.0
                      );
                      ringColorLinear = mix(
                        ringColorLinear,
                        uOuterLineColor,
                        outerLineMask * outerLineAlphaByY
                      );
                      float outerDarkBandStart = outerDist - uOuterDarkLineWidthNorm;
                      float outerDarkMaskStart = smoothstep(
                        outerDarkBandStart - uOuterDarkLineSoftnessNorm,
                        outerDarkBandStart + uOuterDarkLineSoftnessNorm,
                        dist
                      );
                      float outerDarkMaskEnd = smoothstep(
                        outerDist - uOuterDarkLineSoftnessNorm,
                        outerDist + uOuterDarkLineSoftnessNorm,
                        dist
                      );
                      float outerDarkLineMask = outerDarkMaskStart - outerDarkMaskEnd;
                      float outerDarkFadeDenom = max(0.0001, uOuterDarkLineFadeTopYNorm - uOuterDarkLineFadeBottomYNorm);
                      float outerDarkLineAlphaByY = clamp(
                        (uOuterDarkLineFadeTopYNorm - vUv.y) / outerDarkFadeDenom,
                        0.0,
                        1.0
                      );
                      ringColorLinear = mix(
                        ringColorLinear,
                        uOuterDarkLineColor,
                        outerDarkLineMask * outerDarkLineAlphaByY
                      );
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
                <circleGeometry
                  args={[PLAYER_CENTER_RADIUS, PLAYER_CENTER_SEGMENTS]}
                />
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
                  <circleGeometry
                    args={[PLAYER_CENTER_RADIUS, PLAYER_CENTER_SEGMENTS]}
                  />
                  <a.meshBasicMaterial
                    color="#ffffff"
                    map={profileTexture as any}
                    toneMapped={false}
                    transparent
                    alphaTest={0.04}
                    opacity={springStyle.opacity}
                    depthTest={!isActive}
                    depthWrite={!isActive}
                    polygonOffset
                    polygonOffsetFactor={-2}
                    polygonOffsetUnits={-4}
                    side={FrontSide}
                  />
                </mesh>
              ) : null}
              <Html
                center
                position={[0, PLAYER_RADIUS + 2, 0]}
                style={{
                  backgroundColor: team.uiBgColor,
                  color: team.uiTextColor,
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: 24,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  pointerEvents: "none",
                  userSelect: "none",
                  opacity: (isHovered || listHoverMatch) && !isActive ? 1 : 0,
                  outline: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0, 0, 0,0.2)',
                  visibility:
                    (isHovered || listHoverMatch) && !isActive
                      ? "visible"
                      : "hidden",
                  transition: "opacity 0.2s ease, visibility 0.2s ease",
                }}
              >
                <span style={{ color: team.uiTextHighlightColor, fontWeight: 700, opacity: 0.9 }}>
                  {player.number}
                </span>
                <span style={{ color: team.uiTextColor }}>{player.name}</span>
              </Html>
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
  const setListHoveredPlayerId = useTeamStore(
    (s) => s.setListHoveredPlayerId,
  );
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
    if (isDragging) setListHoveredPlayerId(null);
  }, [isDragging, setListHoveredPlayerId]);

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
        <GoalNet
          fieldWidth={FIELD_WORLD_INNER_WIDTH + 12}
          fieldHeight={FIELD_WORLD_INNER_DEPTH}
        />
      </Field>
    </>
  );
}
