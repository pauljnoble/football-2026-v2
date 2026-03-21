export const FIELD_CONFIG = {
  controls: {
    polarDegrees: [-10, 10] as [number, number],
    azimuthDegrees: [-20, 20] as [number, number],
  },
} as const;

export function degreesToRadiansRange([min, max]: [number, number]): [number, number] {
  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
  return [toRadians(min), toRadians(max)];
}
