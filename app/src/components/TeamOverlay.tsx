import { animated } from "@react-spring/web";
import type { ComponentProps } from "react";
import styled from "styled-components";

type TeamOverlayProps = {
  frameloopMode: "always" | "demand";
  isTransitioningTeam: boolean;
  teamName: string;
  teamNameSpring: ComponentProps<typeof TeamName>["style"];
  goPrev: () => void;
  goNext: () => void;
};

export function TeamOverlay({
  frameloopMode,
  isTransitioningTeam,
  teamName,
  teamNameSpring,
  goPrev,
  goNext,
}: TeamOverlayProps) {
  return (
    <>
      <TeamDebugPanel>
        <TeamButtonRow>
          <TeamButton
            type="button"
            disabled={isTransitioningTeam}
            onClick={goPrev}
          >
            Prev
          </TeamButton>
          <TeamButton
            type="button"
            disabled={isTransitioningTeam}
            onClick={goNext}
          >
            Next
          </TeamButton>
        </TeamButtonRow>
        <TeamName style={teamNameSpring}>{teamName || "-"}</TeamName>
      </TeamDebugPanel>
      <DebugBox>frameloop: {frameloopMode}</DebugBox>
    </>
  );
}

const DebugBox = styled.div`
  position: absolute;
  left: 8px;
  bottom: 8px;
  z-index: 10;
  padding: 2px 6px;
  border-radius: 4px;
  background: #000;
  color: #fff;
  font-size: 10px;
  line-height: 1.2;
  pointer-events: none;
`;

const TeamDebugPanel = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px;
  border-radius: 6px;
  background: #000;
  color: #fff;
`;

const TeamButtonRow = styled.div`
  display: flex;
  gap: 6px;
`;

const TeamButton = styled.button`
  border: 1px solid #3a3a3a;
  background: #111;
  color: #fff;
  font-size: 10px;
  line-height: 1;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TeamName = styled(animated.div)`
  min-height: 12px;
  font-size: 10px;
  line-height: 1.2;
  white-space: nowrap;
`;
