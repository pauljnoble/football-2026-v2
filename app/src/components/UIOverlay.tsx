import styled from "styled-components";
import { animated, useSpring, useSprings } from "@react-spring/web";
import type { ComponentProps } from "react";
import { useEffect, useMemo } from "react";
import { ANIMATION_CONFIG } from "../config/animationConfig";
import { useTeamStore, type TeamTransitionState } from "../store/teamStore";
import Icon from "./Icon";
import { StaggeredTeamHeading } from "./StaggeredTeamHeading";

type UIOverlayProps = {
  teamName: string;
  teamNameSpring: ComponentProps<typeof animated.span>["style"];
  transitionState: TeamTransitionState;
  isTransitioningTeam: boolean;
  frameloopMode: "always" | "demand";
  goPrev: () => void;
  goNext: () => void;
  rank?: string;
  entries?: string;
  groupName?: string;
};

const UIOverlay = ({
  teamName,
  teamNameSpring,
  transitionState,
  isTransitioningTeam,
  frameloopMode,
  goPrev,
  goNext,
  rank = "#5",
  entries = "25",
  groupName = "G",
}: UIOverlayProps) => {
  const team = useTeamStore((state) => state.team);
  const isPlayerListVisible = useTeamStore(
    (state) => state.isPlayerListVisible,
  );
  const isPlayerActive = useTeamStore((state) => state.activePlayerId !== null);

  const topSpring = useSpring({
    opacity: isPlayerActive ? 0.1 : 1,
  });

  const statValues = useMemo(
    () => [rank, entries, groupName],
    [rank, entries, groupName],
  );
  const travel = ANIMATION_CONFIG.teamTransition.nameTravelYpx;
  const duration = ANIMATION_CONFIG.teamTransition.nameAnimationMs;
  const exitStagger = ANIMATION_CONFIG.teamTransition.nameExitStaggerMs;
  const enterStagger = ANIMATION_CONFIG.teamTransition.nameEnterStaggerMs;
  const enterBaseDelay = ANIMATION_CONFIG.teamTransition.nameEnterBaseDelayMs;

  const [statSprings, statApi] = useSprings(
    statValues.length,
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
    [statValues.length, transitionState, travel],
  );

  useEffect(() => {
    if (transitionState === "exiting") {
      void statApi.start((i) => ({
        to: { opacity: 0, transform: `translateY(-${travel}px)` },
        delay: i * exitStagger,
        config: { duration },
      }));
    } else if (transitionState === "exited") {
      void statApi.start(() => ({
        to: { opacity: 0, transform: `translateY(-${travel}px)` },
        immediate: true,
      }));
    } else if (transitionState === "entering") {
      void statApi.start((i) => ({
        from: { opacity: 0, transform: `translateY(${travel}px)` },
        to: { opacity: 1, transform: "translateY(0px)" },
        delay: enterBaseDelay + i * enterStagger,
        config: { duration },
      }));
    } else {
      void statApi.start(() => ({
        to: { opacity: 1, transform: "translateY(0px)" },
        immediate: true,
      }));
    }
  }, [
    duration,
    enterBaseDelay,
    enterStagger,
    exitStagger,
    statApi,
    transitionState,
    travel,
  ]);

  return (
    <>
      <Root $isPlayerListVisible={isPlayerListVisible}>
        <DebugPanel>frameloop: {frameloopMode}</DebugPanel>
        <Top style={topSpring}>
          <Heading $shadowColor={team.bgColor}>
            <StaggeredTeamHeading
              teamName={teamName}
              transitionState={transitionState}
              wrapperStyle={teamNameSpring}
              flag={
                <Flag>
                  <img
                    src={`${import.meta.env.BASE_URL}img/players/${team.code}/flag.png`}
                    alt={team.name}
                  />
                </Flag>
              }
            />
          </Heading>
          <StatsRow>
            {/* <ControlButton
            type="button"
            aria-label="Previous team"
            onClick={goPrev}
            disabled={isTransitioningTeam}
            $bgColor={team.uiBtnBgColor}
          >
            <Icon name="arrow-left" />
          </ControlButton> */}
            <StatCol>
              <StatLabel $color={team.textHighlightColor}>RANK</StatLabel>
              <StatValue $color={team.textDisplayColor} style={statSprings[0]}>
                <span>#</span>
                <span>{rank.replace("#", "")}</span>
              </StatValue>
            </StatCol>
            <StatCol>
              <StatLabel $color={team.textHighlightColor}>ENTRIES</StatLabel>
              <StatValue $color={team.textDisplayColor} style={statSprings[1]}>
                {entries}
              </StatValue>
            </StatCol>
            <StatCol>
              <StatLabel $color={team.textHighlightColor}>GROUP</StatLabel>
              <StatValue $color={team.textDisplayColor} style={statSprings[2]}>
                {groupName}
              </StatValue>
            </StatCol>
            <StatCol>
              <StatLabel $color={team.textHighlightColor}>POT</StatLabel>
              <StatValue $color={team.textDisplayColor} style={statSprings[2]}>
                3
              </StatValue>
            </StatCol>
            {/* <ControlButton
            type="button"
            aria-label="Next team"
            onClick={goNext}
            disabled={isTransitioningTeam}
            $bgColor={team.uiBtnBgColor}
          >
            <Icon name="arrow-right" />
          </ControlButton> */}
          </StatsRow>
        </Top>

        {/* <FooterSnippet
        $dimmed={isTransitioningTeam}
        style={{
          color: team.textFooterColorOverride ?? team.textHighlightColor,
          ...topSpring,
        }}
      >
        <div>{team.snippet}</div>
      </FooterSnippet> */}
      </Root>
      <FooterTmp $isPlayerListVisible={isPlayerListVisible}>
        <div
          style={{
            color: team.textDisplayColor,
            background: team.uiBtnBgColor,
          }}
          onClick={goPrev}
        >
          <Icon name="arrow-left" />
        </div>
        <div
          style={{
            color: team.textDisplayColor,
            background: team.uiBtnBgColor,
          }}
        >
          <span>TEAMS</span>
        </div>
        <div
          style={{
            color: team.textDisplayColor,
            background: team.uiBtnBgColor,
          }}
          onClick={goNext}
        >
          <Icon name="arrow-right" />
        </div>
      </FooterTmp>
      <FormationTmp>
        <FormationTmpBtn
          style={{
            color: team.textDisplayColor,
            background: team.uiBtnBgColor,
          }}
        >
          <span>{team.defaultFormation}</span>
          <Icon name="chevron-up" />
        </FormationTmpBtn>
      </FormationTmp>
    </>
  );
};

const Root = styled.div<{ $isPlayerListVisible: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  padding: 24px 24px 12px;
  transition: transform 0.3s ease;
  transform: ${({ $isPlayerListVisible }) =>
    $isPlayerListVisible ? "translateX(60px)" : "translateX(0)"};
`;

const Top = styled(animated.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
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

const Heading = styled.h1<{ $shadowColor: string }>`
  margin: 0;
  font-size: clamp(64px, 14vw, 120px);
  line-height: 0.9;
  letter-spacing: -0.01em;
  font-weight: 800;
  color: #ffffff;
  text-transform: uppercase;
  padding-bottom: 16px;
  overflow: visible;

  span {
    text-shadow: 0 0 10px ${({ $shadowColor }) => $shadowColor};
  }

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

const FormationTmp = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  justify-content: center;
  z-index: 999;
`;

const FormationTmpBtn = styled.div`
  --size: 40px;
  height: var(--size);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  font-size: 18px;
  padding: 0 16px 0 24px;
  border-radius: calc(var(--size) / 2);

  svg {
    width: 16px;
    opacity: 0.5;
  }
`;

const StatsRow = styled.div`
  display: flex;
  justify-content: ceneter;
  align-items: center;
  gap: 32px;
`;

const StatCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const StatLabel = styled.div<{ $color: string }>`
  color: ${({ $color }) => $color};
  font-size: clamp(16px, 3.2vw, 20px);
  line-height: 0.88;
  font-weight: 600;
  letter-spacing: 0.01em;
  transition: color 300ms ease;
  transition-delay: 100ms;
`;

const StatValue = styled(animated.div)<{ $color: string }>`
  color: ${({ $color }) => $color};
  font-size: clamp(20px, 7.2vw, 48px);
  line-height: 0.84;
  font-weight: 800;
  padding-top: 2px;
  display: inline-flex;

  span:nth-child(1) {
    font-size: 0.66em;
    padding-right: 1px;
    padding-top: 1px;
    font-weight: 600;
  }
`;

const FooterTmp = styled.div<{ $isPlayerListVisible: boolean }>`
  --size: 48px;
  --icon-size: 20px;
  --font-size: 20px;

  position: fixed;
  bottom: 24px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 0;
  z-index: 999;
  transform: ${({ $isPlayerListVisible }) =>
    $isPlayerListVisible ? "translateX(60px)" : "translateY(0)"};
  transition: transform 0.3s ease;

  > div svg {
    width: var(--icon-size);
  }

  > div:nth-child(1) {
    cursor: default;
    transform-origin: 100% 50%;
    transition: transform 200ms ease;

    &:hover {
      transform: scale(1.1);
    }
  }

  > div:nth-child(3) {
    cursor: default;
    transform-origin: 0% 50%;
    transition: transform 200ms ease;

    &:hover {
      transform: scale(1.1);
    }
  }

  > div {
    cursor: pointer;
    /* outline: 1px solid #ffffff11; */
  }

  > div:first-child,
  div:last-child {
    height: var(--size);
    flex: 0 0 var(--size);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  &:has(> div:nth-child(2):hover) {
    > div:nth-child(1) {
      transform: translateX(-5px);
    }
    > div:nth-child(3) {
      transform: translateX(5px);
    }
  }

  > div:nth-child(2) {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: var(--size);
    font-weight: 700;
    letter-spacing: 0.03em;
    flex: 0;
    padding: 0 24px;
    display: flex;
    gap: 8px;
    font-size: var(--font-size);
    align-items: center;
    justify-content: center;
    color: white;
    border-radius: calc(var(--size) / 2);
    transition: transform 200ms ease;

    span + span {
      opacity: 0.66;
      font-weight: 600;
      font-size: 0.8em;
    }

    &:hover {
      transform: scale(1.1);
    }

    svg {
      width: 18px;
    }
  }
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

const FooterSnippet = styled(animated.div)<{ $dimmed: boolean }>`
  position: fixed;
  bottom: 32px;
  left: 0;
  right: 0;
  z-index: 20;
  text-align: center;
  font-weight: 500;
  max-width: 500px;
  text-wrap: balance;
  font-weight: 400;
  margin: auto;
  left: 0;
  font-size: 24px;
  line-height: 1.3;
  transform-origin: 50% -200px;
  transition: transform 0.3s ease;
  transform: ${({ $dimmed }) => ($dimmed ? "scale(0.9)" : "scale(1)")};

  > div {
    opacity: ${({ $dimmed }) => ($dimmed ? 0 : 1)};
    transition: opacity 0.3s ease;
  }
`;

export default UIOverlay;
