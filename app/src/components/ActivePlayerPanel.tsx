import { Html } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import styled from "styled-components";
import { useTeamStore } from "../store/teamStore";
import type { PlayerSlot } from "../utils/buildFormationSlots";

/** Match `PlayerScene` token geometry for vertical placement */
const PLAYER_RADIUS = 4;
const PLAYER_SURFACE_OFFSET = 0.03;
const HOVER_SCALE = 1.5;
/** World Y: top of disc at max scale + small gap above */
const PANEL_ANCHOR_Y =
  PLAYER_SURFACE_OFFSET + PLAYER_RADIUS * 2 * HOVER_SCALE + 1.2;

const Card = styled.div`
  background: #111;
  color: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  border: 1px solid #333;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  min-width: 180px;
  pointer-events: auto;
`;

const Title = styled.h2`
  margin: 0 0 6px;
  font-size: 1rem;
  font-weight: 600;
`;

const Meta = styled.p`
  margin: 0 0 4px;
  font-size: 0.8rem;
  color: #c8c8c8;
`;

const CloseRow = styled.div`
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
`;

const CloseButton = styled.button`
  border: 1px solid #3a3a3a;
  background: #1a1a1a;
  color: #fff;
  font-size: 0.75rem;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: #252525;
  }
`;

type ActivePlayerPanelProps = {
  slots: PlayerSlot[];
};

export function ActivePlayerPanel({ slots }: ActivePlayerPanelProps) {
  const players = useTeamStore((s) => s.players);
  const activePlayerId = useTeamStore((s) => s.activePlayerId);
  const setActivePlayerId = useTeamStore((s) => s.setActivePlayerId);

  const active = useMemo(
    () => players.find((p) => p.id === activePlayerId) ?? null,
    [players, activePlayerId],
  );

  const position = useMemo((): [number, number, number] | null => {
    if (!activePlayerId || !active) return null;
    const idx = players.findIndex((p) => p.id === activePlayerId);
    if (idx < 0) return null;
    const slot = slots[idx];
    if (!slot) return null;
    return [slot.x, PANEL_ANCHOR_Y, slot.z];
  }, [active, activePlayerId, players, slots]);

  const close = () => setActivePlayerId(null);

  useEffect(() => {
    if (!activePlayerId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePlayerId]);

  useEffect(() => {
    if (activePlayerId && !active) setActivePlayerId(null);
  }, [active, activePlayerId, setActivePlayerId]);

  if (!position || !active) return null;

  return (
    <Html
      position={position}
      center
      distanceFactor={88}
      style={{ pointerEvents: "none" }}
    >
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="active-player-title"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Title id="active-player-title">{active.name}</Title>
        <Meta>
          #{active.number} · {active.position}
        </Meta>
        <Meta>{active.country}</Meta>
        <CloseRow>
          <CloseButton type="button" onClick={close}>
            Close
          </CloseButton>
        </CloseRow>
      </Card>
    </Html>
  );
}
