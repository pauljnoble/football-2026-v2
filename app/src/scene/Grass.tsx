import * as React from "react";
import * as THREE from "three";
import { shaderMaterial, useGLTF, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import type { InstancedMesh } from "three";
import { FIELD_WORLD_DEPTH, FIELD_WORLD_WIDTH } from "./constants";

type GrassProps = {
  fieldWidth?: number;
  fieldHeight?: number;
  groundY?: number;
  count?: number;
  modelScale?: number | [number, number, number];
  brightness?: number;
  hueRotation?: number;
  lineInsetX?: number;
  lineInsetZ?: number;
  lineOpacity?: number;
  lineColor?: string;
  stripeCount?: number;
  stripeOpacity?: number;
  stripeColor?: string;
  lodNearDistance?: number;
  lodFarDistance?: number;
  lodMidRatio?: number;
  lodFarRatio?: number;
};

const DEFAULT_MODEL_URL = `${import.meta.env.BASE_URL}models/grass-model.glb`;
const DEFAULT_LINES_URL = `${import.meta.env.BASE_URL}img/textures/lines.png`;

const hexToVec3 = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `vec3(${r / 255}, ${g / 255}, ${b / 255})`;
};

const shaderDark = hexToVec3("#274e34");
const shaderLight = hexToVec3("#559466");

const GRASS_CONFIG = {
  count: 130_000,
  modelScale: 1,
  heightScale: 0.33,
  darkColor: "#000000",
  lightColor: "#ffffff",
  shaderDark: shaderDark,
  shaderLight: shaderLight,
} as const;

interface GrassMaterialUniforms {
  uLinesMap: { value: THREE.Texture | null };
  uFieldWidth: { value: number };
  uFieldHeight: { value: number };
  uInsetX: { value: number };
  uInsetZ: { value: number };
  uLinesOpacity: { value: number };
  uLineColor: { value: THREE.Color };
  uBrightness: { value: number };
  uHueRotation?: { value: number };
  uStripeCount: { value: number };
  uStripeOpacity: { value: number };
  uStripeColor: { value: THREE.Color };
}

const createGrassMaterial = (enableHueRotation: boolean) =>
  shaderMaterial(
    {
      uLinesMap: null,
      uFieldWidth: 1,
      uFieldHeight: 1,
      uInsetX: 2,
      uInsetZ: 2,
      uLinesOpacity: 0.8,
      uLineColor: new THREE.Color("#ffffff"),
      uBrightness: 0,
      ...(enableHueRotation ? { uHueRotation: 0 } : {}),
      uStripeCount: 6,
      uStripeOpacity: 0.03,
      uStripeColor: new THREE.Color("#000000"),
    },
    `
  varying vec3 vInstanceColor;
  varying float vHeight;
  varying vec2 vFieldLocalXZ;

  void main() {
    vInstanceColor = instanceColor;
    vHeight = max(0.0, position.y);
    vec3 instanceLocalPos = (instanceMatrix * vec4(position, 1.0)).xyz;
    vFieldLocalXZ = instanceLocalPos.xz;
    vec3 worldPos = (modelMatrix * vec4(instanceLocalPos, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
  }
  `,
    `
  varying vec3 vInstanceColor;
  varying float vHeight;
  varying vec2 vFieldLocalXZ;

  uniform sampler2D uLinesMap;
  uniform float uFieldWidth;
  uniform float uFieldHeight;
  uniform float uInsetX;
  uniform float uInsetZ;
  uniform float uLinesOpacity;
  uniform vec3 uLineColor;
  uniform float uBrightness;
  ${enableHueRotation ? "uniform float uHueRotation;" : ""}
  uniform float uStripeCount;
  uniform float uStripeOpacity;
  uniform vec3 uStripeColor;

  ${
    enableHueRotation
      ? `
  vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }

  vec3 hsv2rgb(vec3 c) {
    vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
    vec3 rgb = clamp(p - 1.0, 0.0, 1.0);
    return c.z * mix(vec3(1.0), rgb, c.y);
  }
  `
      : ""
  }

  void main() {
    vec3 dark = ${GRASS_CONFIG.shaderDark};
    vec3 bright = ${GRASS_CONFIG.shaderLight};
    vec3 color = mix(dark, bright, clamp(vHeight / 1.6, 0.0, 1.0));
    color *= mix(vec3(0.85), vec3(1.15), vInstanceColor);

    float innerWidth = max(0.0001, uFieldWidth - (uInsetX * 2.0));
    float innerHeight = max(0.0001, uFieldHeight - (uInsetZ * 2.0));
    vec2 linesUv = vec2(
      (vFieldLocalXZ.x + uFieldWidth * 0.5 - uInsetX) / innerWidth,
      (vFieldLocalXZ.y + uFieldHeight * 0.5 - uInsetZ) / innerHeight
    );

    bool inBounds = linesUv.x >= 0.0 && linesUv.x <= 1.0 && linesUv.y >= 0.0 && linesUv.y <= 1.0;
    if (inBounds) {
      float safeStripeCount = max(1.0, uStripeCount);
      float stripeIndex = min(floor(linesUv.x * safeStripeCount), safeStripeCount - 1.0);
      float stripeMask = mod(stripeIndex, 2.0);
      color = mix(color, uStripeColor, stripeMask * uStripeOpacity);

      vec4 linesTex = texture2D(uLinesMap, linesUv);
      float lineMask = smoothstep(0.1, 0.9, linesTex.a) * uLinesOpacity;
      color = mix(color, uLineColor, clamp(lineMask, 0.0, 1.0));
    } else {
      color = mix(color, uStripeColor, uStripeOpacity);
    }

    ${
      enableHueRotation
        ? `
    if (uHueRotation > 0.001) {
      vec3 hsv = rgb2hsv(color);
      hsv.x = fract(hsv.x + (uHueRotation / 360.0));
      color = hsv2rgb(hsv);
    }
    `
        : ""
    }
    if (abs(uBrightness) > 0.0001) {
      color = clamp(color + vec3(uBrightness), 0.0, 1.0);
    }

    gl_FragColor = vec4(color, 1.0);
  }
  `,
  );

const _cameraPos = new THREE.Vector3();
const _fieldCenter = new THREE.Vector3();
const LOD_EVALUATION_FRAME_INTERVAL = 3;
const LOD_HYSTERESIS_DISTANCE = 6;

type LODTier = "full" | "mid" | "far";

type GrassChunkData = {
  key: string;
  instanceCount: number;
  matrices: THREE.Matrix4[];
  colors: THREE.Color[];
};

export function Grass({
  fieldWidth = FIELD_WORLD_WIDTH,
  fieldHeight = FIELD_WORLD_DEPTH,
  groundY = 0.1,
  count = GRASS_CONFIG.count,
  modelScale = GRASS_CONFIG.modelScale,
  brightness = 0,
  hueRotation = 0,
  lineInsetX = 4,
  lineInsetZ = 2.5,
  lineOpacity = 0.7,
  lineColor = "#ffffff",
  stripeCount = 6,
  stripeOpacity = 0.03,
  stripeColor = "#000000",
  lodNearDistance = 220,
  lodFarDistance = 320,
  lodMidRatio = 0.6,
  lodFarRatio = 0.35,
}: GrassProps) {
  const groupRef = React.useRef<THREE.Group>(null);
  const chunkRefs = React.useRef<Array<InstancedMesh | null>>([]);
  const camera = useThree((state) => state.camera);
  const lodTierRef = React.useRef<LODTier>("full");
  const lodFrameCounterRef = React.useRef<number>(0);

  const { scene } = useGLTF(DEFAULT_MODEL_URL) as { scene: THREE.Group };
  const linesTexture = useTexture(DEFAULT_LINES_URL);
  const includeHueRotation = hueRotation > 0;

  const material = React.useMemo(() => {
    const GrassMaterialImpl = createGrassMaterial(includeHueRotation);
    const mat = new GrassMaterialImpl();
    mat.side = THREE.FrontSide;
    return mat;
  }, [includeHueRotation]);

  const uniforms = React.useMemo(
    () => (material as unknown as { uniforms: GrassMaterialUniforms }).uniforms,
    [material],
  );

  React.useEffect(() => {
    linesTexture.wrapS = THREE.ClampToEdgeWrapping;
    linesTexture.wrapT = THREE.ClampToEdgeWrapping;
    linesTexture.colorSpace = THREE.SRGBColorSpace;
    linesTexture.needsUpdate = true;
  }, [linesTexture]);

  const lineColorObj = React.useMemo(
    () => new THREE.Color(lineColor),
    [lineColor],
  );
  const stripeColorObj = React.useMemo(
    () => new THREE.Color(stripeColor),
    [stripeColor],
  );

  React.useEffect(() => {
    uniforms.uLinesMap.value = linesTexture;
    uniforms.uFieldWidth.value = fieldWidth;
    uniforms.uFieldHeight.value = fieldHeight;
    uniforms.uInsetX.value = lineInsetX;
    uniforms.uInsetZ.value = lineInsetZ;
    uniforms.uLinesOpacity.value = lineOpacity;
    uniforms.uLineColor.value = lineColorObj;
    uniforms.uBrightness.value = brightness;
    if (uniforms.uHueRotation) uniforms.uHueRotation.value = hueRotation;
    uniforms.uStripeCount.value = stripeCount;
    uniforms.uStripeOpacity.value = stripeOpacity;
    uniforms.uStripeColor.value = stripeColorObj;
  }, [
    uniforms,
    fieldWidth,
    fieldHeight,
    brightness,
    hueRotation,
    lineInsetX,
    lineInsetZ,
    lineOpacity,
    lineColorObj,
    stripeCount,
    stripeOpacity,
    stripeColorObj,
    linesTexture,
  ]);

  const bladeGeometry = React.useMemo(() => {
    const mesh = scene?.children?.find(
      (child) => child instanceof THREE.Mesh,
    ) as THREE.Mesh | undefined;
    const geometry = mesh?.geometry?.clone();
    if (!geometry) return undefined;

    const [sx, sy, sz] = Array.isArray(modelScale)
      ? modelScale
      : [modelScale, modelScale, modelScale];

    geometry.scale(sx, sy, sz);
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  }, [modelScale, scene]);

  const chunks = React.useMemo<GrassChunkData[]>(() => {
    const MAX_INSTANCES_PER_CHUNK = 2500;
    const targetChunkCount = Math.max(
      1,
      Math.ceil(count / MAX_INSTANCES_PER_CHUNK),
    );
    const safeFieldHeight = Math.max(0.0001, fieldHeight);
    const fieldAspect = fieldWidth / safeFieldHeight;

    const chunkCountX = Math.max(
      1,
      Math.round(Math.sqrt(targetChunkCount * fieldAspect)),
    );
    const chunkCountZ = Math.max(1, Math.ceil(targetChunkCount / chunkCountX));
    const totalChunks = chunkCountX * chunkCountZ;

    const baseChunkCount = Math.floor(count / totalChunks);
    const remainder = count % totalChunks;

    const dark = new THREE.Color(GRASS_CONFIG.darkColor);
    const light = new THREE.Color(GRASS_CONFIG.lightColor);
    const color = new THREE.Color();
    const tmp = new THREE.Object3D();

    const nextChunks: GrassChunkData[] = [];
    for (let chunkZ = 0; chunkZ < chunkCountZ; chunkZ++) {
      const zMin = -fieldHeight * 0.5 + (chunkZ / chunkCountZ) * fieldHeight;
      const zMax =
        -fieldHeight * 0.5 + ((chunkZ + 1) / chunkCountZ) * fieldHeight;

      for (let chunkX = 0; chunkX < chunkCountX; chunkX++) {
        const chunkIndex = chunkZ * chunkCountX + chunkX;
        const chunkInstanceCount =
          baseChunkCount + (chunkIndex < remainder ? 1 : 0);
        if (chunkInstanceCount <= 0) continue;

        const xMin = -fieldWidth * 0.5 + (chunkX / chunkCountX) * fieldWidth;
        const xMax =
          -fieldWidth * 0.5 + ((chunkX + 1) / chunkCountX) * fieldWidth;
        const matrices: THREE.Matrix4[] = new Array(chunkInstanceCount);
        const colors: THREE.Color[] = new Array(chunkInstanceCount);

        for (let i = 0; i < chunkInstanceCount; i++) {
          const x = xMin + Math.random() * (xMax - xMin);
          const z = zMin + Math.random() * (zMax - zMin);

          tmp.position.set(x, groundY, z);
          tmp.rotation.set(0, Math.random() * Math.PI * 2, 0);
          const s = Math.random() * 0.25 + 0.25;
          tmp.scale.set(s, s * GRASS_CONFIG.heightScale, s);
          tmp.updateMatrix();

          matrices[i] = tmp.matrix.clone();

          color.copy(dark).lerp(light, Math.random());
          color.offsetHSL(
            (Math.random() - 0.5) * 0.08,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.08,
          );
          colors[i] = color.clone();
        }

        nextChunks.push({
          key: `chunk-${chunkX}-${chunkZ}`,
          instanceCount: chunkInstanceCount,
          matrices,
          colors,
        });
      }
    }

    return nextChunks;
  }, [count, fieldWidth, fieldHeight, groundY]);

  const clampedMidRatio = React.useMemo(
    () => THREE.MathUtils.clamp(lodMidRatio, 0.1, 1),
    [lodMidRatio],
  );
  const clampedFarRatio = React.useMemo(
    () => THREE.MathUtils.clamp(lodFarRatio, 0.05, clampedMidRatio),
    [lodFarRatio, clampedMidRatio],
  );

  const lodNearDistanceSq = React.useMemo(
    () => lodNearDistance * lodNearDistance,
    [lodNearDistance],
  );
  const lodFarDistanceSq = React.useMemo(
    () => lodFarDistance * lodFarDistance,
    [lodFarDistance],
  );
  const lodNearExitDistanceSq = React.useMemo(
    () => Math.pow(Math.max(0, lodNearDistance - LOD_HYSTERESIS_DISTANCE), 2),
    [lodNearDistance],
  );
  const lodFarExitDistanceSq = React.useMemo(
    () => Math.pow(Math.max(0, lodFarDistance - LOD_HYSTERESIS_DISTANCE), 2),
    [lodFarDistance],
  );

  const evaluateLodTier = React.useCallback(
    (distanceSq: number, currentTier: LODTier): LODTier => {
      if (currentTier === "full") {
        if (distanceSq >= lodFarDistanceSq) return "far";
        if (distanceSq >= lodNearDistanceSq) return "mid";
        return "full";
      }
      if (currentTier === "mid") {
        if (distanceSq >= lodFarDistanceSq) return "far";
        if (distanceSq < lodNearExitDistanceSq) return "full";
        return "mid";
      }
      if (distanceSq < lodFarExitDistanceSq) {
        return distanceSq < lodNearExitDistanceSq ? "full" : "mid";
      }
      return "far";
    },
    [
      lodFarDistanceSq,
      lodNearDistanceSq,
      lodNearExitDistanceSq,
      lodFarExitDistanceSq,
    ],
  );

  const applyTierDrawCounts = React.useCallback(
    (tier: LODTier) => {
      const drawRatio =
        tier === "full"
          ? 1
          : tier === "mid"
            ? clampedMidRatio
            : clampedFarRatio;
      chunks.forEach((chunk, idx) => {
        const inst = chunkRefs.current[idx];
        if (!inst) return;
        const nextDrawCount =
          tier === "full"
            ? chunk.instanceCount
            : Math.floor(chunk.instanceCount * drawRatio);
        if (inst.count !== nextDrawCount) inst.count = nextDrawCount;
      });
    },
    [chunks, clampedMidRatio, clampedFarRatio],
  );

  React.useEffect(() => {
    chunks.forEach((chunk, idx) => {
      const inst = chunkRefs.current[idx];
      if (!inst) return;

      for (let i = 0; i < chunk.instanceCount; i++) {
        inst.setMatrixAt(i, chunk.matrices[i]);
        inst.setColorAt(i, chunk.colors[i]);
      }

      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      inst.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      inst.count = chunk.instanceCount;
      inst.computeBoundingSphere();
    });

    groupRef.current?.getWorldPosition(_fieldCenter);
    camera.getWorldPosition(_cameraPos);
    const initialDistanceSq = _cameraPos.distanceToSquared(_fieldCenter);
    const initialTier = evaluateLodTier(initialDistanceSq, "full");
    lodTierRef.current = initialTier;
    lodFrameCounterRef.current = 0;
    applyTierDrawCounts(initialTier);
  }, [chunks, camera, evaluateLodTier, applyTierDrawCounts]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    lodFrameCounterRef.current =
      (lodFrameCounterRef.current + 1) % LOD_EVALUATION_FRAME_INTERVAL;
    if (lodFrameCounterRef.current !== 0) return;

    group.getWorldPosition(_fieldCenter);
    camera.getWorldPosition(_cameraPos);
    const distanceSq = _cameraPos.distanceToSquared(_fieldCenter);

    const currentTier = lodTierRef.current;
    const nextTier = evaluateLodTier(distanceSq, currentTier);
    if (nextTier === currentTier) return;
    lodTierRef.current = nextTier;
    applyTierDrawCounts(nextTier);
  });

  React.useEffect(() => {
    return () => {
      material.dispose();
      bladeGeometry?.dispose();
    };
  }, [material, bladeGeometry]);

  return (
    <group ref={groupRef}>
      {bladeGeometry &&
        chunks.map((chunk, idx) => (
          <instancedMesh
            key={chunk.key}
            ref={(node) => {
              chunkRefs.current[idx] = node;
            }}
            args={[
              bladeGeometry,
              undefined as unknown as THREE.Material,
              chunk.instanceCount,
            ]}
            frustumCulled
          >
            <primitive object={material} attach="material" />
          </instancedMesh>
        ))}
    </group>
  );
}

useGLTF.preload(DEFAULT_MODEL_URL);
