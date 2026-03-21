export const ANIMATION_CONFIG = {
  frameIdleMs: 2000,
  playerTransition: {
    hiddenY: 7.5,
    staggerExitMs: 40,
    enterDelayMs: 500,
    staggerEnterMs: 70,
    spring: {
      tension: 190,
      friction: 18,
      mass: 0.9,
    },
    resetSpring: {
      tension: 180,
      friction: 20,
    },
  },
  teamTransition: {
    nameAnimationMs: 220,
    exitedPauseMs: 180,
    nameOffsetYpx: 10,
  },
} as const;
