import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useSpring, useSprings } from "@react-spring/three";
import { animated as a } from "@react-spring/web";
import styled from "styled-components";
import { GlobalStyle } from "./GlobalStyle";
import { PlayerScene } from "./components/PlayerScene";
import { ANIMATION_CONFIG } from "./config/animationConfig";
import { useTeamTransitionManager } from "./hooks/useTeamTransitionManager";
import { useTeamStore } from "./store/teamStore";
import { buildFormationSlots } from "./utils/buildFormationSlots";
import UIOverlay from "./components/UIOverlay";

export default function App() {
  const [frameloopMode, setFrameloopMode] = useState<"always" | "demand">(
    "demand",
  );
  const idleTimerRef = useRef<number | null>(null);
  const players = useTeamStore((state) => state.players);
  const formation = useTeamStore((state) => state.formation);
  const team = useTeamStore((state) => state.team);

  const {
    isTransitioningTeam,
    teamName,
    transitionState,
    teamNameSpring,
    onPlayersExitComplete,
    onPlayersEnterComplete,
    goPrev,
    goNext,
  } = useTeamTransitionManager();
  const slots = useMemo(
    () => buildFormationSlots(formation.positions, players.length),
    [formation.positions, players.length],
  );
  const [playerSprings, playerSpringApi] = useSprings(players.length, () => ({
    y: 0,
    opacity: 1,
    config: ANIMATION_CONFIG.playerTransition.resetSpring,
    immediate: true,
  }));

  useEffect(() => {
    const idleMs = ANIMATION_CONFIG.frameIdleMs;

    const markActive = () => {
      setFrameloopMode("always");
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        const { transitionState } = useTeamStore.getState();
        if (isTransitioningTeam || transitionState !== "entered") return;
        setFrameloopMode("demand");
      }, idleMs);
    };

    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "pointermove",
      "mousemove",
      "touchstart",
      "touchmove",
      "wheel",
    ];

    for (const eventName of events) {
      window.addEventListener(eventName, markActive, { passive: true });
    }

    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      for (const eventName of events) {
        window.removeEventListener(eventName, markActive);
      }
    };
  }, [isTransitioningTeam]);

  useEffect(() => {
    const idleMs = ANIMATION_CONFIG.frameIdleMs;
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    if (isTransitioningTeam || transitionState !== "entered") {
      setFrameloopMode("always");
      return;
    }

    idleTimerRef.current = window.setTimeout(() => {
      setFrameloopMode("demand");
    }, idleMs);
  }, [isTransitioningTeam, transitionState]);

  useEffect(() => {
    if (transitionState !== "entered") return;
    void playerSpringApi.start(() => ({
      y: 0,
      opacity: 1,
      immediate: true,
    }));
  }, [playerSpringApi, transitionState, players.length]);

  useEffect(() => {
    if (transitionState !== "exiting") return;
    let cancelled = false;

    const exitAnimations = playerSpringApi.start((index) => ({
      to: {
        y: ANIMATION_CONFIG.playerTransition.hiddenY,
        opacity: 0,
      },
      delay: index * ANIMATION_CONFIG.playerTransition.staggerExitMs,
      immediate: false,
      config: ANIMATION_CONFIG.playerTransition.spring,
    }));

    void Promise.all(exitAnimations).then(() => {
      if (cancelled) return;
      onPlayersExitComplete();
    });

    return () => {
      cancelled = true;
    };
  }, [onPlayersExitComplete, playerSpringApi, transitionState]);

  useEffect(() => {
    if (transitionState !== "entering") return;
    let cancelled = false;
    let enterTimer: number | null = null;

    void playerSpringApi.start(() => ({
      y: ANIMATION_CONFIG.playerTransition.hiddenY,
      opacity: 0,
      immediate: true,
    }));

    enterTimer = window.setTimeout(() => {
      if (cancelled) return;

      const enterAnimations = playerSpringApi.start((index) => ({
        to: {
          y: 0,
          opacity: 1,
        },
        delay:
          (players.length - 1 - index) *
          ANIMATION_CONFIG.playerTransition.staggerEnterMs,
        immediate: false,
        config: ANIMATION_CONFIG.playerTransition.spring,
      }));

      void Promise.all(enterAnimations).then(() => {
        if (cancelled) return;
        onPlayersEnterComplete();
      });
    }, ANIMATION_CONFIG.playerTransition.enterDelayMs);

    return () => {
      cancelled = true;
      if (enterTimer) window.clearTimeout(enterTimer);
    };
  }, [
    onPlayersEnterComplete,
    playerSpringApi,
    players.length,
    transitionState,
  ]);

  const rootStyles = useSpring({
    backgroundColor: team.bgColor,
    delay: 150,
  });

  return (
    <>
      <GlobalStyle />
      <Root style={rootStyles}>
        <UIOverlay
          teamName={teamName}
          teamNameSpring={teamNameSpring}
          isTransitioningTeam={isTransitioningTeam}
          frameloopMode={frameloopMode}
          goPrev={goPrev}
          goNext={goNext}
        />
        <StyledCanvas
          style={{ width: "100%", height: "100%", display: "block" }}
          frameloop={frameloopMode}
          dpr={[1, 2]}
          gl={{
            // alpha: true,
            antialias: true,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl, scene }) => {
            gl.setClearColor(0x000000, 0);
            scene.background = null;
          }}
        >
          <PlayerScene
            slots={slots}
            players={players}
            playerSprings={playerSprings}
            transitionState={transitionState}
          />
        </StyledCanvas>
      </Root>
    </>
  );
}

const StyledCanvas = styled(Canvas)`
  width: 100%;
  height: 100%;
  display: block;
  position: absolute;
  top: var(--canvas-top);
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
`;

const Root = styled(a.div)`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;
