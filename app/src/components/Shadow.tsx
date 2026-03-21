import { animated as a } from "@react-spring/three";
import { forwardRef, useMemo } from "react";
import { Color, FrontSide, Mesh } from "three";

type ShadowProps = {
  position?: [number, number, number];
  opacity?: number | any;
  radius?: number;
  color?: string;
  feather?: number;
  scaleX?: number;
};

const Shadow = forwardRef<Mesh, ShadowProps>(function Shadow(
  {
    position = [0, 0.14, -4],
    opacity = 0.25,
    radius = 4.8,
    color = "#000000",
    feather = 0.38,
    scaleX = 1.4,
  },
  ref,
) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(color) },
      uOpacity: { value: 1 },
      uFeather: { value: feather },
    }),
    [color, feather],
  );

  return (
    <mesh
      ref={ref}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[scaleX, 1, 1]}
      renderOrder={-1}
    >
      <circleGeometry args={[radius, 20]} />
      <a.shaderMaterial
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;

          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;

          uniform vec3 uColor;
          uniform float uOpacity;
          uniform float uFeather;

          void main() {
            vec2 centerUv = vec2(0.5, 0.5);
            float dist = distance(vUv, centerUv);
            float clampedFeather = clamp(uFeather, 0.001, 0.999);
            float edgeStart = 0.5 * (1.0 - clampedFeather);
            float alpha = 1.0 - smoothstep(edgeStart, 0.5, dist);
            gl_FragColor = vec4(uColor, alpha * uOpacity);
          }
        `}
        transparent
        toneMapped={false}
        uniforms-uOpacity-value={opacity}
        depthTest={false}
        depthWrite={false}
        side={FrontSide}
      />
    </mesh>
  );
});

export default Shadow;
