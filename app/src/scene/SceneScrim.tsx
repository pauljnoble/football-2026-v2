import { animated as a, useSpring } from "@react-spring/three";
import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { FrontSide } from "three";
import * as THREE from "three";
import { useTeamStore } from "../store/teamStore";

/** Distance along view ray — plane is sized to cover the frustum at this depth */
const SCRIM_DISTANCE = 18;

/**
 * Full-viewport dimming quad in front of the camera (only while a player is active).
 * Sits in world space, not under pitch controls, so it tracks the camera only.
 */
export function SceneScrim() {
  const activePlayerId = useTeamStore((s) => s.activePlayerId);
  const setActivePlayerId = useTeamStore((s) => s.setActivePlayerId);
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const activePlayerIdRef = useRef(activePlayerId);
  const [isMounted, setIsMounted] = useState(Boolean(activePlayerId));
  const [fadeInSpring, fadeInApi] = useSpring(() => ({
    opacity: 0,
  }));

  useEffect(() => {
    activePlayerIdRef.current = activePlayerId;
  }, [activePlayerId]);

  useEffect(() => {
    if (activePlayerId) {
      setIsMounted(true);
      fadeInApi.set({ opacity: 0 });
      void fadeInApi.start({
        opacity: 0.42,
        config: { tension: 220, friction: 26 },
      });
      return;
    }

    void fadeInApi.start({
      opacity: 0,
      config: { tension: 220, friction: 26 },
      onRest: () => {
        if (!activePlayerIdRef.current) setIsMounted(false);
      },
    });
  }, [activePlayerId, fadeInApi]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || !isMounted) return;
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    mesh.position.copy(camera.position).addScaledVector(dir, SCRIM_DISTANCE);
    mesh.quaternion.copy(camera.quaternion);

    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const h = 2 * Math.tan(vFov / 2) * SCRIM_DISTANCE;
    const w = h * camera.aspect;
    mesh.scale.set(w * 1.02, h * 1.02, 1);
  });

  if (!isMounted) return null;

  return (
    <mesh
      ref={meshRef}
      renderOrder={1000}
      onPointerDown={
        activePlayerId
          ? (e) => {
              e.stopPropagation();
              setActivePlayerId(null);
            }
          : undefined
      }
    >
      <planeGeometry args={[1, 1]} />
      <a.meshBasicMaterial
        color="#000000"
        transparent
        opacity={fadeInSpring.opacity}
        depthWrite={false}
        depthTest={false}
        side={FrontSide}
      />
    </mesh>
  );
}
