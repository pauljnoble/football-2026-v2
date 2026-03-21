import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import {
  BufferGeometry,
  CanvasTexture,
  ClampToEdgeWrapping,
  Float32BufferAttribute,
  LinearFilter,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";
import { FIELD_WORLD_DEPTH, FIELD_WORLD_WIDTH } from "./constants";

const halfW = FIELD_WORLD_WIDTH / 2;
const halfD = FIELD_WORLD_DEPTH / 2;
const sideDrop = 2.2;
const sideTopY = 0;
const sideCenterY = sideTopY - sideDrop / 2;
const sideOffset = 0.01;
const bottomWaveWorldStep = 6;
const bottomWaveAmplitude = 0.3;
const bottomWaveDetailPerStep = 8;
const defaultBottomOpacityFeatherDistance = 0.3;

function createBottomEdgeGeometry(
  width: number,
  drop: number,
  waveStep: number,
  waveAmplitude: number,
  waveDetailPerStep: number,
) {
  const geometry = new BufferGeometry();
  const halfWidth = width / 2;
  const topY = drop / 2;
  const bottomBaseY = -drop / 2;
  const safeStep = Math.max(0.001, waveStep);
  const segmentCount = Math.max(1, Math.ceil(width / safeStep));
  const samplesPerSegment = Math.max(2, waveDetailPerStep);
  const totalSamples = segmentCount * samplesPerSegment + 1;

  const randomAmplitudes = Array.from(
    { length: segmentCount },
    () => (Math.random() * 2 - 1) * waveAmplitude,
  );

  const positions = new Float32Array(totalSamples * 2 * 3);
  const uvs = new Float32Array(totalSamples * 2 * 2);
  const indices: number[] = [];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / (totalSamples - 1);
    const x = -halfWidth + t * width;
    const clampedX = Math.min(width - 1e-6, Math.max(0, x + halfWidth));
    const segmentIndex = Math.min(
      segmentCount - 1,
      Math.floor(clampedX / safeStep),
    );
    const segmentStartX = segmentIndex * safeStep;
    const localT = (clampedX - segmentStartX) / safeStep;
    const wave = Math.sin(localT * Math.PI) * randomAmplitudes[segmentIndex];
    const bottomY = bottomBaseY + wave;

    const topVertex = i * 2;
    const bottomVertex = topVertex + 1;

    const topPos = topVertex * 3;
    positions[topPos] = x;
    positions[topPos + 1] = topY;
    positions[topPos + 2] = 0;

    const bottomPos = bottomVertex * 3;
    positions[bottomPos] = x;
    positions[bottomPos + 1] = bottomY;
    positions[bottomPos + 2] = 0;

    const uvIndex = topVertex * 2;
    uvs[uvIndex] = t;
    uvs[uvIndex + 1] = 1;
    uvs[uvIndex + 2] = t;
    uvs[uvIndex + 3] = 0;

    if (i < totalSamples - 1) {
      const nextTop = topVertex + 2;
      const nextBottom = bottomVertex + 2;

      indices.push(topVertex, bottomVertex, nextTop);
      indices.push(bottomVertex, nextBottom, nextTop);
    }
  }

  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function createBottomOpacityAlphaMap(drop: number, featherDistance: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 256;

  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  const safeDrop = Math.max(0.001, drop);
  const featherRatio = Math.min(1, Math.max(0, featherDistance / safeDrop));

  for (let y = 0; y < canvas.height; y++) {
    const t = y / (canvas.height - 1);
    const alpha =
      featherRatio <= 0 ? 1 : t <= featherRatio ? t / featherRatio : 1;
    // alphaMap uses color channels (primarily green), not source pixel alpha.
    const alphaByte = Math.round(alpha * 255);
    context.fillStyle = `rgb(${alphaByte}, ${alphaByte}, ${alphaByte})`;
    context.fillRect(0, canvas.height - y - 1, canvas.width, 1);
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;

  return texture;
}

type FieldEdgeProps = {
  bottomOpacityFeatherDistance?: number;
};

export function FieldEdge({
  bottomOpacityFeatherDistance = defaultBottomOpacityFeatherDistance,
}: FieldEdgeProps = {}) {
  const groundTexture = useTexture(
    `${import.meta.env.BASE_URL}img/textures/ground.png`,
  );
  const bottomGeometry = useMemo(
    () =>
      createBottomEdgeGeometry(
        FIELD_WORLD_WIDTH,
        sideDrop,
        bottomWaveWorldStep,
        bottomWaveAmplitude,
        bottomWaveDetailPerStep,
      ),
    [],
  );
  const bottomAlphaMap = useMemo(
    () => createBottomOpacityAlphaMap(sideDrop, bottomOpacityFeatherDistance),
    [bottomOpacityFeatherDistance],
  );

  useMemo(() => {
    groundTexture.wrapS = RepeatWrapping;
    groundTexture.wrapT = RepeatWrapping;
    groundTexture.repeat.set(40, 1);
    groundTexture.colorSpace = SRGBColorSpace;
    groundTexture.needsUpdate = true;
  }, [groundTexture]);

  return (
    <>
      {/* Left side */}
      <mesh
        position={[-halfW - sideOffset, sideCenterY, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[FIELD_WORLD_DEPTH, sideDrop]} />
        <meshBasicMaterial map={groundTexture} color="#ffffff" />
      </mesh>
      {/* Right side */}
      <mesh
        position={[halfW + sideOffset, sideCenterY, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[FIELD_WORLD_DEPTH, sideDrop]} />
        <meshBasicMaterial map={groundTexture} color="#ffffff" />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, sideCenterY, halfD + sideOffset]}>
        <primitive object={bottomGeometry} attach="geometry" />
        <meshBasicMaterial
          map={groundTexture}
          alphaMap={bottomAlphaMap ?? undefined}
          transparent
          depthWrite={false}
          color="#ffffff"
        />
      </mesh>
    </>
  );
}
