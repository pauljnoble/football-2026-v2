import { useEffect, useRef } from "react";
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
  const team = useTeamStore((s) => s.team);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const { camera, invalidate } = useThree();
  const targetOpacityRef = useRef(activePlayerId ? 0.42 : 0);
  const opacityRef = useRef(activePlayerId ? 0.42 : 0);
  const dirRef = useRef(new THREE.Vector3());

  useEffect(() => {
    targetOpacityRef.current = activePlayerId ? 0.42 : 0;
    // Kick demand-loop rendering so fade frames are produced.
    invalidate();
  }, [activePlayerId, invalidate]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const dir = dirRef.current;
    camera.getWorldDirection(dir);
    mesh.position.copy(camera.position).addScaledVector(dir, SCRIM_DISTANCE);
    mesh.quaternion.copy(camera.quaternion);

    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const h = 2 * Math.tan(vFov / 2) * SCRIM_DISTANCE;
    const w = h * camera.aspect;
    mesh.scale.set(w * 1.02, h * 1.02, 1);

    const targetOpacity = targetOpacityRef.current;
    const nextOpacity = THREE.MathUtils.damp(
      opacityRef.current,
      targetOpacity,
      10,
      delta,
    );
    const snappedOpacity =
      Math.abs(nextOpacity - targetOpacity) < 0.001
        ? targetOpacity
        : nextOpacity;
    opacityRef.current = snappedOpacity;
    material.opacity = snappedOpacity;

    if (snappedOpacity !== targetOpacity) {
      // Continue requesting frames only while opacity is still animating.
      invalidate();
    }
  });

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
      <meshBasicMaterial
        ref={materialRef}
        color={team?.bgColor ?? "#000000"}
        transparent
        opacity={opacityRef.current}
        depthWrite={false}
        depthTest={false}
        side={FrontSide}
      />
    </mesh>
  );
}
