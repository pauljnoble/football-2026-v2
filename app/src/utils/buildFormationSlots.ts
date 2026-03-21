import {
  FIELD_WORLD_INNER_DEPTH,
  FIELD_WORLD_INNER_WIDTH,
} from "../scene/constants";
import type { FormationPosition } from "../types";

export type PlayerSlot = {
  x: number;
  z: number;
};

function clampPercent(value: number) {
  return Math.max(-0.5, Math.min(0.5, value));
}

export function buildFormationSlots(
  positions: FormationPosition[],
  playerCount: number,
): PlayerSlot[] {
  if (playerCount === 0) return [];
  if (positions.length === 0) {
    return Array.from({ length: playerCount }, (_, index) => ({
      x:
        playerCount === 1
          ? 0
          : -FIELD_WORLD_INNER_WIDTH * 0.27 +
            (index / (playerCount - 1 || 1)) * FIELD_WORLD_INNER_WIDTH * 0.54,
      z: FIELD_WORLD_INNER_DEPTH * 0.18,
    }));
  }

  return Array.from({ length: playerCount }, (_, index) => {
    const position = positions[index % positions.length];
    const cycle = Math.floor(index / positions.length);
    const lateralPercent = clampPercent(position.x);
    const depthPercent = clampPercent(position.z);
    const x = lateralPercent * FIELD_WORLD_INNER_WIDTH + cycle * 1.1;
    const z = depthPercent * FIELD_WORLD_INNER_DEPTH;

    return { x, z };
  });
}
