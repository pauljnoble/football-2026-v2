import { useEffect, useLayoutEffect, useRef } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { useFrame, useStore, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { FIELD_WORLD_WIDTH } from "./constants";
import { useTeamStore } from "../store/teamStore";

const FOV = 40;

/**
 * Camera pose is in world units (metres): X across field, Y up, Z along pitch depth.
 * Adjust this directly to position the camera.
 */
const CAMERA_POSITION = new THREE.Vector3(0, 66, 85);
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
  const fieldMaxWidthPx = useTeamStore((state) => state.fieldMaxWidthPx);
  const viewXOffset = useTeamStore((state) => state.viewXOffset);
  const cameraFovRef = useRef<number | null>(null);
  const cameraViewXOffsetRef = useRef<number>(0);

  // Calculate target properties for camera
  const dist = CAMERA_POSITION.distanceTo(CAMERA_LOOK_AT);
  const targetPx = Math.min(width, fieldMaxWidthPx);
  const hWorld = (FIELD_WORLD_WIDTH * width) / targetPx;
  const vWorldRequired = hWorld * (height / width);
  const targetFov = THREE.MathUtils.radToDeg(
    2 * Math.atan(vWorldRequired / (2 * dist)),
  );

  useLayoutEffect(() => {
    const camera = store.getState().camera;
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    if (cameraFovRef.current === null) {
      cameraFovRef.current = targetFov;
      camera.fov = targetFov;
    }
    
    camera.aspect = width / height;
    camera.near = 0.1;
    camera.far = 200;

    if (cameraViewXOffsetRef.current === 0) {
      camera.clearViewOffset();
    } else {
      camera.setViewOffset(width, height, cameraViewXOffsetRef.current, 0, width, height);
    }

    camera.updateProjectionMatrix();
    applyCameraPose(camera, cameraXRef.current);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }, [height, store, width, targetFov]);

  useEffect(() => {
    invalidate();
  }, [invalidate, targetX, targetFov, viewXOffset]);

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
    
    let needsUpdate = false;
    
    if (snappedX !== cameraXRef.current) {
      cameraXRef.current = snappedX;
      applyCameraPose(camera, snappedX);
      camera.updateMatrixWorld();
      needsUpdate = true;
    }
    
    // Animate FOV
    if (cameraFovRef.current !== null) {
      const nextFov = THREE.MathUtils.damp(
        cameraFovRef.current,
        targetFov,
        3.5,
        delta,
      );
      const snappedFov = Math.abs(nextFov - targetFov) < 0.01 ? targetFov : nextFov;
      if (snappedFov !== camera.fov) {
        cameraFovRef.current = snappedFov;
        camera.fov = snappedFov;
        camera.updateProjectionMatrix();
        needsUpdate = true;
      }
    }

    // Animate ViewXOffset
    const nextViewXOffset = THREE.MathUtils.damp(
      cameraViewXOffsetRef.current,
      viewXOffset,
      3.5,
      delta,
    );
    const snappedViewXOffset = Math.abs(nextViewXOffset - viewXOffset) < 0.01 ? viewXOffset : nextViewXOffset;
    
    if (snappedViewXOffset !== cameraViewXOffsetRef.current) {
      cameraViewXOffsetRef.current = snappedViewXOffset;
      if (snappedViewXOffset === 0) {
        camera.clearViewOffset();
      } else {
        // Negate to make positive slider pull the scene right (feels more natural)
        camera.setViewOffset(width, height, -snappedViewXOffset, 0, width, height);
      }
      camera.updateProjectionMatrix();
      needsUpdate = true;
    }

    if (needsUpdate) invalidate();
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
