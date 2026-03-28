import { useMemo, useRef } from "react";
import { animated as a, useSpring } from "@react-spring/web";
import styled from "styled-components";
import { useTeamStore } from "../store/teamStore";
import type { Player } from "../types";

const PlayerDetails = () => {
  const activePlayerId = useTeamStore((state) => state.activePlayerId);
  const players = useTeamStore((state) => state.players);
  const team = useTeamStore((state) => state.team);
  const setActivePlayerId = useTeamStore((state) => state.setActivePlayerId);

  const activePlayer = useMemo(
    () => players.find((player) => player.id === activePlayerId),
    [activePlayerId, players],
  );
  const activePlayerRef = useRef<Player | null>(null);
  if (activePlayer) {
    activePlayerRef.current = activePlayer;
  }
  const displayedPlayer = activePlayer ?? activePlayerRef.current ?? undefined;

  const activePlayerIndex = activePlayerId
    ? players.findIndex((player) => player.id === activePlayerId)
    : -1;
  const canNavigate = activePlayerIndex >= 0 && players.length > 1;

  const showPreviousPlayer = () => {
    if (!canNavigate) return;
    const previousIndex =
      (activePlayerIndex - 1 + players.length) % players.length;
    setActivePlayerId(players[previousIndex]?.id ?? null);
  };

  const showNextPlayer = () => {
    if (!canNavigate) return;
    const nextIndex = (activePlayerIndex + 1) % players.length;
    setActivePlayerId(players[nextIndex]?.id ?? null);
  };

  const sceneUrl = (displayedPlayer?.scenePictureUrl ?? "")
    ?.trim()
    ?.replace(/^\.\//, "");

  const portraitSrc = sceneUrl
    ? `${import.meta.env.BASE_URL}img/players/${team.code}/scenes/${sceneUrl}`
    : null;

  const panelSpring = useSpring({
    x: activePlayerId ? "-100%" : "0%",
    config: activePlayerId
      ? { tension: 260, friction: 28 }
      : { tension: 240, friction: 32 },
  });

  const statRows = displayedPlayer
    ? [
        { label: "Position", value: displayedPlayer.position },
        { label: "Age", value: `${displayedPlayer.age}` },
        { label: "Height", value: `${displayedPlayer.height} cm` },
        { label: "Weight", value: `${displayedPlayer.weight} kg` },
        { label: "Nationality", value: displayedPlayer.nationality },
        { label: "Club", value: displayedPlayer.club },
        { label: "League", value: displayedPlayer.league },
      ]
    : [];

  return (
    <Root style={panelSpring}>
      <Panel>
        <CloseButton
          type="button"
          aria-label="Close player details"
          onClick={() => setActivePlayerId(null)}
        >
          <CloseIcon viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 7l10 10" />
            <path d="M17 7L7 17" />
          </CloseIcon>
        </CloseButton>
        <ImageContainer>
          <PortraitBackground />
          {portraitSrc ? (
            <PortraitImage
              src={portraitSrc}
              alt={displayedPlayer?.name ?? ""}
            />
          ) : (
            <PortraitFallback>NO IMAGE</PortraitFallback>
          )}
          <ImageNavButton
            type="button"
            onClick={showPreviousPlayer}
            aria-label="Previous player"
            disabled={!canNavigate}
            $isRightAligned={false}
            $bgColor={team.uiBgColor}
            $textColor={team.uiTextHighlightColor}
          >
            <ChevronIcon viewBox="0 0 12 12" aria-hidden="true">
              <path d="M7.5 2.5L4 6l3.5 3.5" />
            </ChevronIcon>
          </ImageNavButton>
          <ImageNavButton
            type="button"
            onClick={showNextPlayer}
            aria-label="Next player"
            disabled={!canNavigate}
            $isRightAligned
            $bgColor={team.uiBgColor}
            $textColor={team.uiTextHighlightColor}
          >
            <ChevronIcon viewBox="0 0 12 12" aria-hidden="true">
              <path d="M4.5 2.5L8 6l-3.5 3.5" />
            </ChevronIcon>
          </ImageNavButton>
        </ImageContainer>

        <Details $textColor={team.uiTextDarkColor}>
          <NumberCircle
            $bgColor={team.uiBgColor}
            $textColor={team.uiTextHighlightColor}
          >
            {displayedPlayer
              ? String(displayedPlayer.number).padStart(2, "0")
              : "--"}
          </NumberCircle>
          <ScrollableContent>
            <h1>{displayedPlayer?.name ?? ""}</h1>
            <IntroText>{displayedPlayer?.snippet ?? ""}</IntroText>
            <StatsList>
              {statRows.map((stat) => (
                <StatRow key={stat.label}>
                  <StatLabel>{stat.label}</StatLabel>
                  <StatValue>{stat.value || "—"}</StatValue>
                </StatRow>
              ))}
            </StatsList>
          </ScrollableContent>
        </Details>
      </Panel>
      <Blurry />
    </Root>
  );
};

const Root = styled(a.div)`
  width: 480px;
  position: fixed;
  top: 0;
  left: 100%;
  bottom: 0;
  margin: auto;
  z-index: 99;
  pointer-events: none;
`;

const Panel = styled.div`
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(24px);
  overflow: hidden;
  z-index: 2;
  pointer-events: auto;
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  flex: 0 0 auto;
  overflow: hidden;
`;

const PortraitBackground = styled.div`
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      circle at 30% 18%,
      rgba(255, 255, 255, 0.5),
      transparent 50%
    ),
    linear-gradient(140deg, #5f6ea1 0%, #2f3a70 50%, #1b2247 100%);
`;

const PortraitImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PortraitFallback = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  letter-spacing: 0.1em;
  font-weight: 700;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 0;
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  margin: 0;
  color: white;
`;

const ImageNavButton = styled.button<{
  $isRightAligned: boolean;
  $bgColor: string;
  $textColor: string;
}>`
  position: absolute;
  top: 100%;
  ${({ $isRightAligned }) =>
    $isRightAligned ? "right: calc(50% - 80px);" : "left: calc(50% - 80px);"}
  transform: translateY(-50%);
  pointer-events: auto;
  border: 1px solid white;
  padding: 0;
  margin: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  z-index: 2;
  background-color: ${({ $bgColor }) => $bgColor};
  color: ${({ $textColor }) => $textColor};

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const Details = styled.div<{ $textColor: string }>`
  padding: 0 30px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  color: ${({ $textColor }) => $textColor};
  overflow: visible;
  position: relative;

  h1 {
    font-size: 48px;
    font-weight: 700;
    line-height: 1;
    margin: 0;
    color: inherit;
    text-transform: uppercase;
    text-align: center;
    letter-spacing: -0.05em;
  }
`;

const NumberCircle = styled.div<{ $bgColor: string; $textColor: string }>`
  position: absolute;
  left: 0;
  right: 0;
  margin: auto;
  top: 0;
  width: 2em;
  height: 2em;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
  text-align: center;
  transform: translateY(-50%);
  border: 1px solid white;
  z-index: 2;
  background-color: ${({ $bgColor }) => $bgColor};
  color: ${({ $textColor }) => $textColor};
`;

const ScrollableContent = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-top: 48px;
  padding-right: 6px;
  -ms-overflow-style: none;
  scrollbar-width: none;
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    black 40px,
    black calc(100% - 40px),
    transparent
  );

  &::-webkit-scrollbar {
    display: none;
  }
`;

const IntroText = styled.p`
  margin: 20px 0 0;
  font-size: 18px;
  line-height: 1.35;
  color: currentColor;
  opacity: 0.82;
`;

const StatsList = styled.dl`
  margin: 18px 0 0;
  padding-bottom: 100px;
`;

const StatRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-top: 1px solid rgba(47, 58, 112, 0.18);
`;

const StatLabel = styled.dt`
  margin: 0;
  font-size: 18px;
  line-height: 1.3;
  font-weight: 500;
  color: currentColor;
  opacity: 0.82;
`;

const StatValue = styled.dd`
  margin: 0;
  text-align: right;
  font-size: 18px;
  line-height: 1.3;
  font-weight: 600;
  color: currentColor;
`;

const Blurry = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 120px;
  backdrop-filter: blur(32px);
  mask: linear-gradient(
    to left,
    rgba(255, 255, 255, 1),
    rgba(255, 255, 255, 0)
  );
  z-index: 1;
`;

const ChevronIcon = styled.svg`
  width: 24px;
  height: 24px;
  stroke: currentColor;
  stroke-width: 1;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
`;

const CloseIcon = styled.svg`
  width: 20px;
  height: 20px;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
`;

export default PlayerDetails;
