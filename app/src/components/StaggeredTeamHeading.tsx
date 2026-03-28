import { animated, useSprings } from "@react-spring/web";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { ANIMATION_CONFIG } from "../config/animationConfig";
import type { TeamTransitionState } from "../store/teamStore";

type StaggeredTeamHeadingProps = {
  teamName: string;
  transitionState: TeamTransitionState;
  wrapperStyle: ComponentProps<typeof animated.span>["style"];
  flag: ReactNode;
};

type Item = { kind: "flag" } | { kind: "char"; char: string };

export function StaggeredTeamHeading({
  teamName,
  transitionState,
  wrapperStyle,
  flag,
}: StaggeredTeamHeadingProps) {
  const items: Item[] = useMemo(
    () => [
      { kind: "flag" },
      ...Array.from(teamName.toUpperCase(), (char) => ({
        kind: "char" as const,
        char,
      })),
    ],
    [teamName],
  );

  const travel = ANIMATION_CONFIG.teamTransition.nameTravelYpx;

  const [springs, api] = useSprings(
    items.length,
    () => {
      if (transitionState === "exited") {
        return {
          opacity: 0,
          transform: `translateY(-${travel}px)`,
        };
      }
      if (transitionState === "entering") {
        return {
          opacity: 0,
          transform: `translateY(${travel}px)`,
        };
      }
      return { opacity: 1, transform: "translateY(0px)" };
    },
    [items.length, transitionState],
  );

  useEffect(() => {
    const duration = ANIMATION_CONFIG.teamTransition.nameAnimationMs;
    const exitStagger = ANIMATION_CONFIG.teamTransition.nameExitStaggerMs;
    const enterStagger = ANIMATION_CONFIG.teamTransition.nameEnterStaggerMs;
    const enterBaseDelay = ANIMATION_CONFIG.teamTransition.nameEnterBaseDelayMs;

    if (transitionState === "exiting") {
      void api.start((i) => ({
        to: { opacity: 0, transform: `translateY(-${travel}px)` },
        delay: i * exitStagger,
        config: { duration },
      }));
    } else if (transitionState === "exited") {
      void api.start(() => ({
        to: { opacity: 0, transform: `translateY(-${travel}px)` },
        immediate: true,
      }));
    } else if (transitionState === "entering") {
      void api.start((i) => ({
        from: { opacity: 0, transform: `translateY(${travel}px)` },
        to: { opacity: 1, transform: "translateY(0px)" },
        delay: enterBaseDelay + i * enterStagger,
        config: { duration },
      }));
    }
  }, [api, items.length, transitionState, travel]);

  return (
    <animated.span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        ...wrapperStyle,
      }}
    >
      {springs.map((springStyle, index) => {
        const item = items[index];
        if (!item) return null;
        const zIndex = items.length - index;

        if (item.kind === "flag") {
          return (
            <animated.span
              key="flag"
              style={{
                position: "absolute",
                display: "inline-block",
                zIndex,
                ...springStyle,
              }}
            >
              {flag}
            </animated.span>
          );
        }

        const displayChar = item.char === " " ? "\u00A0" : item.char;
        return (
          <animated.span
            key={`${index}-${item.char}`}
            style={{
              display: "inline-block",
              zIndex,
              ...springStyle,
            }}
          >
            {displayChar}
          </animated.span>
        );
      })}
    </animated.span>
  );
}
