import { useEffect, useMemo, useRef } from "react";
import { animated as a, useSpring } from "@react-spring/web";
import styled from "styled-components";
import { useTeamStore } from "../store/teamStore";
import type { Player } from "../types";

const PlayerDetails = () => {
  const activePlayerId = useTeamStore((s) => s.activePlayerId);
  const players = useTeamStore((s) => s.players);
  const activePlayer = players.find((p) => p.id === activePlayerId);

  const activePlayerRef = useRef<Player | null>(null);

  useEffect(() => {
    if (!activePlayerId) return;
    const idx = players.findIndex((p) => p.id === activePlayerId);
    if (idx < 0) return;
    activePlayerRef.current = players[idx];
  }, [activePlayerId, players]);

  const rootStyle = useSpring({
    x: !!activePlayerId ? "-100%" : "0",
  });

  const renderedPlayer = activePlayer || activePlayerRef.current;

  return (
    <Root style={rootStyle}>
      <Panel>{renderedPlayer?.name}</Panel>
    </Root>
  );
};

const Root = styled(a.div)`
  position: absolute;
  top: 0;
  left: 100%;
  width: var(--dim-side-panel-root-width);
  height: 100%;
  padding: 24px;
  z-index: 3;
`;

const Panel = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
  background-color: var(--color-side-panel-bg);
  color: var(--color-content-text-primary);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  border: 1px solid #333;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
`;

export default PlayerDetails;
