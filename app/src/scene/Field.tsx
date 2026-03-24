import { useMemo, type ReactNode } from "react";
import { PresentationControls, useTexture } from "@react-three/drei";
import { FrontSide, RepeatWrapping, SRGBColorSpace } from "three";
import * as THREE from "three";
import { useSpring, animated as a } from "@react-spring/three";
import { FIELD_WORLD_DEPTH, FIELD_WORLD_WIDTH } from "./constants";
import { Grass } from "./Grass";
import { FieldEdge } from "./FieldEdge";
import { degreesToRadiansRange, FIELD_CONFIG } from "./fieldConfig";
import { useTeamStore } from "../store/teamStore";

const polarRange = degreesToRadiansRange(FIELD_CONFIG.controls.polarDegrees);
const azimuthRange = degreesToRadiansRange(
  FIELD_CONFIG.controls.azimuthDegrees,
);

type FieldProps = {
  children?: ReactNode;
};

export function Field({ children }: FieldProps) {
  const grassTexture = useTexture(
    `${import.meta.env.BASE_URL}img/textures/grass.png`,
  );
  const team = useTeamStore((s) => s.team);

  useMemo(() => {
    grassTexture.wrapS = RepeatWrapping;
    grassTexture.wrapT = RepeatWrapping;
    grassTexture.repeat.set(FIELD_WORLD_WIDTH / 5, FIELD_WORLD_DEPTH / 5);
    grassTexture.colorSpace = SRGBColorSpace;
    grassTexture.needsUpdate = true;
  }, [grassTexture]);

  const rotationSpring = useSpring({
    azimuth: THREE.MathUtils.degToRad(team.cameraAzimuth ?? 0),
    polar: THREE.MathUtils.degToRad(team.cameraPolar ?? 0),
    delay: 100,
    config: { duration: 1000 }
  });

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
      <a.group rotation-y={rotationSpring.azimuth} rotation-x={rotationSpring.polar}>
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[FIELD_WORLD_WIDTH, FIELD_WORLD_DEPTH]} />
            <meshBasicMaterial
              map={grassTexture}
              color="#ffffff"
              side={FrontSide}
            />
          </mesh>
          <Grass
            hueRotation={team.hueRotation}
            stripeCount={11}
            stripeOpacity={0.2}
            stripeColor="#1f3b28"
          />
          <FieldEdge />
          {children}
        </group>
      </a.group>
    </PresentationControls>
  );
}
