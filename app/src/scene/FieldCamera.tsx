import { useEffect, useLayoutEffect, useRef } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { useFrame, useStore, useThree } from "@react-three/fiber";
import * as THREE from "three";

const FOV = 40;

/**
 * Camera pose is in world units (metres): X across field, Y up, Z along pitch depth.
 * Adjust this directly to position the camera.
 */
const CAMERA_POSITION = new THREE.Vector3(0, 62, 95);
const CAMERA_LOOK_AT = new THREE.Vector3(0, 0, 0);

function applyCameraPose(cam: THREE.PerspectiveCamera, targetX = 0) {
  cam.position.set(
    CAMERA_POSITION.x + targetX,
    CAMERA_POSITION.y,
    CAMERA_POSITION.z,
  );
  cam.lookAt(CAMERA_LOOK_AT.x + targetX, CAMERA_LOOK_AT.y, CAMERA_LOOK_AT.z);
  cam.up.set(0, 1, 0);
}

/**
 * Perspective camera from the long sideline using direct world-space positioning.
 */
function FitFrustum({ targetX }: { targetX: number | null }) {
  const store = useStore();
  const { width, height } = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const cameraXRef = useRef(0);

  useLayoutEffect(() => {
    const camera = store.getState().camera;
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    camera.fov = FOV;
    camera.aspect = width / height;
    camera.near = 0.1;
    camera.far = 200;

    camera.updateProjectionMatrix();
    applyCameraPose(camera, cameraXRef.current);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }, [height, store, width]);

  useEffect(() => {
    invalidate();
  }, [invalidate, targetX]);

  useFrame((_, delta) => {
    const camera = store.getState().camera;
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const desiredX = targetX ?? 0;
    const nextX = THREE.MathUtils.damp(
      cameraXRef.current,
      desiredX,
      3.5,
      delta,
    );
    const snappedX = Math.abs(nextX - desiredX) < 0.01 ? desiredX : nextX;
    cameraXRef.current = snappedX;

    applyCameraPose(camera, snappedX);
    camera.updateMatrixWorld();

    if (snappedX !== desiredX) invalidate();
  });

  return null;
}

export function FieldPerspectiveCamera({
  targetX = null,
}: {
  targetX?: number | null;
}) {
  return (
    <>
      <PerspectiveCamera makeDefault fov={FOV} near={0.1} far={1200} />
      <FitFrustum targetX={targetX} />
    </>
  );
}
