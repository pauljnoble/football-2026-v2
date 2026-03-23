import styled from "styled-components";
import { animated } from "@react-spring/web";
import type { ComponentProps } from "react";
import { useTeamStore } from "../store/teamStore";
import Icon from "./Icon";

type UIOverlayProps = {
  teamName: string;
  teamNameSpring: ComponentProps<typeof Heading>["style"];
  isTransitioningTeam: boolean;
  frameloopMode: "always" | "demand";
  goPrev: () => void;
  goNext: () => void;
  rank?: string;
  entries?: string;
  wins?: string;
};

const UIOverlay = ({
  teamName,
  teamNameSpring,
  isTransitioningTeam,
  frameloopMode,
  goPrev,
  goNext,
  rank = "#5",
  entries = "25",
  wins = "04",
}: UIOverlayProps) => {
  const team = useTeamStore((state) => state.team);

  return (
    <Root>
      <DebugPanel>frameloop: {frameloopMode}</DebugPanel>
      <Heading style={teamNameSpring}>
        <Flag>
          <img
            src={`${import.meta.env.BASE_URL}img/players/${team.code}/flag.png`}
            alt={team.name}
          />
        </Flag>
        {teamName.toUpperCase()}
      </Heading>
      <StatsRow>
        <ControlButton
          type="button"
          aria-label="Previous team"
          onClick={goPrev}
          disabled={isTransitioningTeam}
          $bgColor={team.uiBtnBgColor}
        >
          <Icon name="arrow-left" />
        </ControlButton>
        <StatCol>
          <StatLabel $color={team.textHighlightColor}>RANK</StatLabel>
          <StatValue $color={team.textDisplayColor}>{rank}</StatValue>
        </StatCol>
        <StatCol>
          <StatLabel $color={team.textHighlightColor}>ENTRIES</StatLabel>
          <StatValue $color={team.textDisplayColor}>{entries}</StatValue>
        </StatCol>
        <StatCol>
          <StatLabel $color={team.textHighlightColor}>WINS</StatLabel>
          <StatValue $color={team.textDisplayColor}>{wins}</StatValue>
        </StatCol>
        <ControlButton
          type="button"
          aria-label="Next team"
          onClick={goNext}
          disabled={isTransitioningTeam}
          $bgColor={team.uiBtnBgColor}
        >
          <Icon name="arrow-right" />
        </ControlButton>
      </StatsRow>
    </Root>
  );
};

const Root = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 320px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  padding: 24px 24px 12px;
`;

const DebugPanel = styled.div`
  position: fixed;
  bottom: 12px;
  left: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  line-height: 1;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 6px;
  padding: 6px 8px;
  text-transform: lowercase;
`;

const Heading = styled(animated.h1)`
  margin: 0;
  font-size: clamp(64px, 14vw, 120px);
  line-height: 0.9;
  letter-spacing: -0.01em;
  font-weight: 800;
  color: #ffffff;
  text-transform: uppercase;
  padding-bottom: 16px;
  overflow: visible;

  img {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    margin: auto;
  }
`;

const Flag = styled.div`
  width: 52px;
  height: 52px;
  position: absolute;
  top: 0;
  bottom: 16px;
  margin: auto;
  right: calc(100% + 8px);
  border: 1px solid #ffffff;
  border-radius: 50%;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    margin: auto;
    border-radius: 50%;
    z-index: 1;
    background-image: linear-gradient(
      to bottom left,
      rgba(255, 255, 255, 0.5),
      rgba(255, 255, 255, 0) 50%
    );
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    margin: auto;
    border-radius: 50%;
    z-index: 1;
    mix-blend-mode: multiply;
    background-image: linear-gradient(
      to top right,
      rgba(0, 0, 0, 0.3),
      rgba(0, 0, 0, 0) 50%
    );
  }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: auto 1fr 1fr 1fr auto;
  align-items: center;
  gap: 32px;
`;

const StatCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

const StatLabel = styled.div<{ $color: string }>`
  color: ${({ $color }) => $color};
  font-size: clamp(16px, 3.2vw, 22px);
  line-height: 0.88;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: color 300ms ease;
  transition-delay: 100ms;
`;

const StatValue = styled.div<{ $color: string }>`
  color: ${({ $color }) => $color};
  font-size: clamp(20px, 7.2vw, 48px);
  line-height: 0.84;
  font-weight: 800;
`;

const ControlButton = styled.button<{ $bgColor: string }>`
  pointer-events: auto;
  width: 48px;
  height: 48px;
  border: 0;
  border-radius: 50%;
  background: ${({ $bgColor }) => $bgColor};
  color: #ffffff;
  font-size: clamp(24px, 3vw, 42px);
  line-height: 1;
  padding: 0;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition:
    transform 140ms ease,
    opacity 140ms ease;

  &:hover:not(:disabled) {
    transform: scale(1.04);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default UIOverlay;
