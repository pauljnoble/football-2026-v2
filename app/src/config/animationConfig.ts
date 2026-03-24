export const ANIMATION_CONFIG = {
  frameIdleMs: 2000,
  playerTransition: {
    hiddenY: 7.5,
    /** Brief dip before exit (anticipation, then spring up). */
    exitAnticipationY: -0.4,
    exitAnticipationSpring: {
      tension: 620,
      friction: 26,
      mass: 0.35,
    },
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
    /** Delay between each character (and flag) when the heading exits. */
    nameExitStaggerMs: 28,
    /** Delay between each character (and flag) when the heading enters. */
    nameEnterStaggerMs: 32,
    /** Wait before the first character begins entering (was wrapper fade delay). */
    nameEnterBaseDelayMs: 300,
    exitedPauseMs: 180,
    /** Exit: move up. Enter: rise from below. */
    nameTravelYpx: 36,
  },
} as const;
