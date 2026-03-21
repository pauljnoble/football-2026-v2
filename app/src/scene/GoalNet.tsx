import { useEffect, useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

type GoalNetProps = {
  fieldWidth: number;
  fieldHeight: number;
  groundY?: number;
  frameColor?: string;
  netColor?: string;
  netOpacity?: number;
};

type GoalProps = {
  side: 1 | -1;
  fieldWidth: number;
  fieldHeight: number;
  groundY: number;
  frameMaterial: THREE.Material;
  netBackMaterial: THREE.Material;
  netTopMaterial: THREE.Material;
  netSideMaterial: THREE.Material;
};

const NET_TILE_WORLD_SIZE = 1.2;

const getGoalDimensions = (fieldHeight: number) => {
  const goalWidth = fieldHeight * 0.18;
  const goalHeight = fieldHeight * 0.075;
  const goalDepth = fieldHeight * 0.08;
  const postThickness = Math.max(fieldHeight * 0.0025, 0.08);
  const xInset = postThickness / 2;
  return { goalWidth, goalHeight, goalDepth, postThickness, xInset };
};

const Goal = ({
  side,
  fieldWidth,
  fieldHeight,
  groundY,
  frameMaterial,
  netBackMaterial,
  netTopMaterial,
  netSideMaterial,
}: GoalProps) => {
  const { goalWidth, goalHeight, goalDepth, postThickness, xInset } =
    getGoalDimensions(fieldHeight);
  const baseRailLift = postThickness * 0.25 + 0.2;

  return (
    <group
      position={[side * (fieldWidth / 2 - xInset), groundY, 0]}
      rotation={[0, side === 1 ? 0 : Math.PI, 0]}
    >
      {/* Frame */}
      <mesh
        position={[0, goalHeight / 2, -goalWidth / 2]}
        material={frameMaterial}
      >
        <boxGeometry args={[postThickness, goalHeight, postThickness]} />
      </mesh>
      <mesh
        position={[0, goalHeight / 2, goalWidth / 2]}
        material={frameMaterial}
      >
        <boxGeometry args={[postThickness, goalHeight, postThickness]} />
      </mesh>
      <mesh position={[0, goalHeight, 0]} material={frameMaterial}>
        <boxGeometry
          args={[postThickness, postThickness, goalWidth + postThickness]}
        />
      </mesh>
      <mesh
        position={[
          goalDepth / 2,
          postThickness / 2 + baseRailLift,
          -goalWidth / 2,
        ]}
        material={frameMaterial}
      >
        <boxGeometry args={[goalDepth, postThickness, postThickness]} />
      </mesh>
      <mesh
        position={[
          goalDepth / 2,
          postThickness / 2 + baseRailLift,
          goalWidth / 2,
        ]}
        material={frameMaterial}
      >
        <boxGeometry args={[goalDepth, postThickness, postThickness]} />
      </mesh>
      <mesh
        position={[goalDepth, postThickness / 2 + baseRailLift, 0]}
        material={frameMaterial}
      >
        <boxGeometry
          args={[postThickness, postThickness, goalWidth + postThickness]}
        />
      </mesh>

      {/* Net */}
      <mesh
        position={[goalDepth, goalHeight / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        material={netBackMaterial}
      >
        <planeGeometry args={[goalWidth, goalHeight, 16, 12]} />
      </mesh>
      <mesh
        position={[goalDepth / 2, goalHeight, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={netTopMaterial}
      >
        <planeGeometry args={[goalDepth, goalWidth, 8, 16]} />
      </mesh>
      <mesh
        position={[goalDepth / 2, goalHeight / 2, -goalWidth / 2]}
        material={netSideMaterial}
      >
        <planeGeometry args={[goalDepth, goalHeight, 8, 12]} />
      </mesh>
      <mesh
        position={[goalDepth / 2, goalHeight / 2, goalWidth / 2]}
        rotation={[0, Math.PI, 0]}
        material={netSideMaterial}
      >
        <planeGeometry args={[goalDepth, goalHeight, 8, 12]} />
      </mesh>
    </group>
  );
};

const GoalNet = ({
  fieldWidth,
  fieldHeight,
  groundY = 0,
  frameColor = "#ffffff",
  netColor = "#ffffff",
  netOpacity = 1,
}: GoalNetProps) => {
  const netTexture = useTexture(
    import.meta.env.BASE_URL + "img/textures/net.png",
  );
  const { goalWidth, goalHeight, goalDepth } = useMemo(
    () => getGoalDimensions(fieldHeight),
    [fieldHeight],
  );

  const repeatedTextures = useMemo(() => {
    const createRepeatedTexture = (
      repeatX: number,
      repeatY: number,
    ): THREE.Texture => {
      const texture = netTexture.clone();
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeatX, repeatY);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
      return texture;
    };

    return {
      back: createRepeatedTexture(
        goalWidth / NET_TILE_WORLD_SIZE,
        goalHeight / NET_TILE_WORLD_SIZE,
      ),
      top: createRepeatedTexture(
        goalDepth / NET_TILE_WORLD_SIZE,
        goalWidth / NET_TILE_WORLD_SIZE,
      ),
      side: createRepeatedTexture(
        goalDepth / NET_TILE_WORLD_SIZE,
        goalHeight / NET_TILE_WORLD_SIZE,
      ),
    };
  }, [goalDepth, goalHeight, goalWidth, netTexture]);

  const frameMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: frameColor,
        roughness: 0.55,
        metalness: 0.1,
      }),
    [frameColor],
  );

  const netBackMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: netColor,
        map: repeatedTextures.back,
        transparent: true,
        opacity: netOpacity,
        alphaTest: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      }),
    [netColor, netOpacity, repeatedTextures.back],
  );
  const netTopMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: netColor,
        map: repeatedTextures.top,
        transparent: true,
        opacity: netOpacity,
        alphaTest: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      }),
    [netColor, netOpacity, repeatedTextures.top],
  );
  const netSideMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: netColor,
        map: repeatedTextures.side,
        transparent: true,
        opacity: netOpacity,
        alphaTest: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      }),
    [netColor, netOpacity, repeatedTextures.side],
  );

  useEffect(() => {
    return () => {
      repeatedTextures.back.dispose();
      repeatedTextures.top.dispose();
      repeatedTextures.side.dispose();
      frameMaterial.dispose();
      netBackMaterial.dispose();
      netTopMaterial.dispose();
      netSideMaterial.dispose();
    };
  }, [
    frameMaterial,
    netBackMaterial,
    netTopMaterial,
    netSideMaterial,
    repeatedTextures,
  ]);

  return (
    <group>
      <Goal
        side={1}
        fieldWidth={fieldWidth}
        fieldHeight={fieldHeight}
        groundY={groundY}
        frameMaterial={frameMaterial}
        netBackMaterial={netBackMaterial}
        netTopMaterial={netTopMaterial}
        netSideMaterial={netSideMaterial}
      />
      <Goal
        side={-1}
        fieldWidth={fieldWidth}
        fieldHeight={fieldHeight}
        groundY={groundY}
        frameMaterial={frameMaterial}
        netBackMaterial={netBackMaterial}
        netTopMaterial={netTopMaterial}
        netSideMaterial={netSideMaterial}
      />
    </group>
  );
};

export default GoalNet;
