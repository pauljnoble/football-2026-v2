import { useCallback, useEffect, useRef, useState } from 'react';
import { useSpring } from '@react-spring/web';
import { ANIMATION_CONFIG } from '../config/animationConfig';
import teamsData from '../data/teams';
import { getPlayersByTeamCode } from '../data/players';
import { getFormationByName, useTeamStore } from '../store/teamStore';
import type { PlayerData, Team, TeamData } from '../types';

export function useTeamTransitionManager() {
  const typedTeamsData: TeamData = teamsData;
  const [isTransitioningTeam, setIsTransitioningTeam] = useState(false);
  const timersRef = useRef<number[]>([]);
  const pendingTeamRef = useRef<Team | null>(null);
  const preloadedImageUrlsRef = useRef<Set<string>>(new Set());
  const teamName = useTeamStore((state) => state.name);
  const transitionState = useTeamStore((state) => state.transitionState);

  const teamNameSpring = useSpring({
    opacity:
      transitionState === 'entering' || transitionState === 'entered' ? 1 : 0,
    transform:
      transitionState === 'entering' || transitionState === 'entered'
        ? 'translateY(0px)'
        : `translateY(-${ANIMATION_CONFIG.teamTransition.nameOffsetYpx}px)`,
    delay: transitionState === 'entering' ? 0 : 1,
    config: { duration: ANIMATION_CONFIG.teamTransition.nameAnimationMs },
  });

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, []);

  const waitForTimeout = useCallback((delayMs: number) => {
    return new Promise<void>((resolve) => {
      const timer = window.setTimeout(resolve, delayMs);
      timersRef.current.push(timer);
    });
  }, []);

  const preloadImage = useCallback((url: string) => {
    return new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        preloadedImageUrlsRef.current.add(url);
        resolve();
      };
      const image = new Image();
      image.onload = finish;
      image.onerror = finish;
      image.src = url;
      if (image.complete) finish();
    });
  }, []);

  const preloadTeamPlayerImages = useCallback(
    async (teamCode: string, players: PlayerData) => {
      const baseUrl = import.meta.env.BASE_URL;
      const urlsToLoad = players
        .map((player) =>
          (player.profilePictureUrl ?? player.profilePicture)
            ?.trim()
            ?.replace(/^\.\//, ''),
        )
        .filter((path): path is string => Boolean(path))
        .map((path) => `${baseUrl}img/players/${teamCode}/${path}`)
        .filter((url) => !preloadedImageUrlsRef.current.has(url));

      if (urlsToLoad.length === 0) return;
      await Promise.all(urlsToLoad.map((url) => preloadImage(url)));
    },
    [preloadImage],
  );

  const startTeamTransition = (nextTeam: Team) => {
    if (isTransitioningTeam) return;

    pendingTeamRef.current = nextTeam;
    setIsTransitioningTeam(true);
    useTeamStore.setState({ transitionState: 'exiting' });
  };

  const onPlayersExitComplete = useCallback(() => {
    const pendingTeam = pendingTeamRef.current;
    if (!pendingTeam) return;

    void (async () => {
      useTeamStore.setState({ transitionState: 'exited', activePlayerId: null });

      const nextPlayers = getPlayersByTeamCode(pendingTeam.code);
      const nextFormation =
        getFormationByName(pendingTeam.defaultFormation) ??
        useTeamStore.getState().formation;

      await preloadTeamPlayerImages(pendingTeam.code, nextPlayers);
      await waitForTimeout(ANIMATION_CONFIG.teamTransition.exitedPauseMs);

      if (pendingTeamRef.current !== pendingTeam) return;

      useTeamStore.setState({
        name: pendingTeam.name,
        team: pendingTeam,
        players: nextPlayers,
        formation: nextFormation,
        transitionState: 'entering',
        activePlayerId: null,
      });
      pendingTeamRef.current = null;
    })();
  }, [preloadTeamPlayerImages, waitForTimeout]);

  const onPlayersEnterComplete = useCallback(() => {
    if (useTeamStore.getState().transitionState !== 'entering') return;
    useTeamStore.setState({ transitionState: 'entered' });
    setIsTransitioningTeam(false);
  }, []);

  const stepTeam = (direction: 1 | -1) => {
    if (typedTeamsData.length === 0 || isTransitioningTeam) return;

    const currentIndex = typedTeamsData.findIndex((team) => team.name === teamName);
    const startIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex =
      (startIndex + direction + typedTeamsData.length) % typedTeamsData.length;
    const nextTeam = typedTeamsData[nextIndex];
    if (!nextTeam) return;

    startTeamTransition(nextTeam);
  };

  return {
    isTransitioningTeam,
    teamName,
    transitionState,
    teamNameSpring,
    onPlayersExitComplete,
    onPlayersEnterComplete,
    goPrev: () => stepTeam(-1),
    goNext: () => stepTeam(1),
  };
}
