import { useMemo, type ReactNode } from "react";
import { Line, PresentationControls, useTexture } from "@react-three/drei";
import { FrontSide, RepeatWrapping, SRGBColorSpace } from "three";
import {
  CENTER_CIRCLE_RADIUS,
  FIELD_WORLD_DEPTH,
  FIELD_WORLD_INNER_DEPTH,
  FIELD_WORLD_INNER_WIDTH,
  FIELD_WORLD_WIDTH,
} from "./constants";
import { Grass } from "./Grass";
import { degreesToRadiansRange, FIELD_CONFIG } from "./fieldConfig";

const halfW = FIELD_WORLD_WIDTH / 2;
const halfD = FIELD_WORLD_DEPTH / 2;
const halfInnerW = FIELD_WORLD_INNER_WIDTH / 2;
const halfInnerD = FIELD_WORLD_INNER_DEPTH / 2;
const y = 0.02;
const sideDrop = 2;
const sideTopY = 0;
const sideCenterY = sideTopY - sideDrop / 2;
const sideOffset = 0.01;
const polarRange = degreesToRadiansRange(FIELD_CONFIG.controls.polarDegrees);
const azimuthRange = degreesToRadiansRange(
  FIELD_CONFIG.controls.azimuthDegrees,
);

function circlePoints(r: number, segments = 48): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push([Math.cos(a) * r, y, Math.sin(a) * r]);
  }
  return pts;
}

// const outline: [number, number, number][] = [
//   [-halfW, y, -halfD],
//   [halfW, y, -halfD],
//   [halfW, y, halfD],
//   [-halfW, y, halfD],
//   [-halfW, y, -halfD],
// ];

const innerOutline: [number, number, number][] = [
  [-halfInnerW, y, -halfInnerD],
  [halfInnerW, y, -halfInnerD],
  [halfInnerW, y, halfInnerD],
  [-halfInnerW, y, halfInnerD],
  [-halfInnerW, y, -halfInnerD],
];

type FieldProps = {
  children?: ReactNode;
};

export function Field({ children }: FieldProps) {
  const grassTexture = useTexture(
    `${import.meta.env.BASE_URL}img/textures/grass.png`,
  );
  const groundTexture = useTexture(
    `${import.meta.env.BASE_URL}img/textures/ground.png`,
  );

  useMemo(() => {
    grassTexture.wrapS = RepeatWrapping;
    grassTexture.wrapT = RepeatWrapping;
    grassTexture.repeat.set(FIELD_WORLD_WIDTH / 5, FIELD_WORLD_DEPTH / 5);
    grassTexture.colorSpace = SRGBColorSpace;
    grassTexture.needsUpdate = true;
  }, [grassTexture]);

  useMemo(() => {
    groundTexture.wrapS = RepeatWrapping;
    groundTexture.wrapT = RepeatWrapping;
    groundTexture.repeat.set(40, 1);
    groundTexture.colorSpace = SRGBColorSpace;
    groundTexture.needsUpdate = true;
  }, [groundTexture]);

  return (
    <PresentationControls
      global
      cursor
      snap={0.28}
      speed={1.25}
      polar={polarRange}
      azimuth={azimuthRange}
      rotation={[0, 0, 0]}
    >
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[FIELD_WORLD_WIDTH, FIELD_WORLD_DEPTH]} />
          <meshBasicMaterial
            map={grassTexture}
            color="#ffffff"
            side={FrontSide}
          />
        </mesh>
        <Grass stripeCount={11} stripeOpacity={0.2} stripeColor="#1f3b28" />
        <mesh
          position={[-halfW - sideOffset, sideCenterY, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[FIELD_WORLD_DEPTH, sideDrop]} />
          <meshBasicMaterial map={groundTexture} color="#ffffff" />
        </mesh>
        <mesh
          position={[halfW + sideOffset, sideCenterY, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[FIELD_WORLD_DEPTH, sideDrop]} />
          <meshBasicMaterial map={groundTexture} color="#ffffff" />
        </mesh>
        <mesh position={[0, sideCenterY, halfD + sideOffset]}>
          <planeGeometry args={[FIELD_WORLD_WIDTH, sideDrop]} />
          <meshBasicMaterial map={groundTexture} color="#ffffff" />
        </mesh>
        {children}
      </group>
    </PresentationControls>
  );
}
