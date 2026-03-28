import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { useSpring, useSprings, animated } from "@react-spring/web";
import { ANIMATION_CONFIG } from "../config/animationConfig";
import { useTeamStore } from "../store/teamStore";

function useMeasure() {
  const ref = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ height: 0, width: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setBounds({
        height: entry.contentRect.height,
        width: entry.contentRect.width,
      });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, bounds] as const;
}

export default function PlayerList() {
  const players = useTeamStore((state) => state.players);
  const team = useTeamStore((state) => state.team);
  const activePlayerId = useTeamStore((state) => state.activePlayerId);
  const setListHoveredPlayerId = useTeamStore(
    (state) => state.setListHoveredPlayerId,
  );
  const setActivePlayerId = useTeamStore((state) => state.setActivePlayerId);
  const setIsPlayerListVisible = useTeamStore(
    (state) => state.setIsPlayerListVisible,
  );
  const isPlayerListVisible = useTeamStore(
    (state) => state.isPlayerListVisible,
  );
  const transitionState = useTeamStore((state) => state.transitionState);

  const [listRef, listBounds] = useMeasure();

  // If listBounds hasn't measured yet, use 'auto' to let it take shape,
  // or a reasonable default. Actually we can just animate height explicitly.
  // We need to account for padding of the container if the container has no padding.
  const targetHeight = isPlayerListVisible ? listBounds.height || "auto" : 48;
  const targetWidth = isPlayerListVisible ? listBounds.width || "auto" : 48;
  const targetListOpacity =
    isPlayerListVisible &&
    transitionState !== "exiting" &&
    transitionState !== "exited"
      ? 1
      : 0;

  const spring = useSpring({
    width: targetWidth,
    height: targetHeight,
    opacityList: targetListOpacity,
    opacityToggle: isPlayerListVisible ? 0 : 1,
    opacityScrim: activePlayerId ? 0.6 : 0,
    config: { tension: 300, friction: 30 },
  });
  const listTravelY = ANIMATION_CONFIG.teamTransition.listTravelYpx;
  const [listSprings, listSpringApi] = useSprings(
    players.length + 1,
    () => {
      if (transitionState === "exited") {
        return {
          opacity: 0,
          transform: `translateY(-${listTravelY}px)`,
        };
      }
      if (transitionState === "entering") {
        return {
          opacity: 0,
          transform: `translateY(${listTravelY}px)`,
        };
      }
      return { opacity: 1, transform: "translateY(0px)" };
    },
    [players.length, transitionState, listTravelY],
  );

  useEffect(() => {
    const duration = ANIMATION_CONFIG.teamTransition.listAnimationMs;
    const exitStagger = ANIMATION_CONFIG.teamTransition.listExitStaggerMs;
    const enterStagger = ANIMATION_CONFIG.teamTransition.listEnterStaggerMs;
    const enterBaseDelay = ANIMATION_CONFIG.teamTransition.listEnterBaseDelayMs;

    if (transitionState === "exiting") {
      void listSpringApi.start((i) => ({
        to: { opacity: 0, transform: `translateY(-${listTravelY}px)` },
        delay: i * exitStagger,
        config: { duration },
      }));
    } else if (transitionState === "exited") {
      void listSpringApi.start(() => ({
        to: { opacity: 0, transform: `translateY(-${listTravelY}px)` },
        immediate: true,
      }));
    } else if (transitionState === "entering") {
      void listSpringApi.start((i) => ({
        from: { opacity: 0, transform: `translateY(${listTravelY}px)` },
        to: { opacity: 1, transform: "translateY(0px)" },
        delay: enterBaseDelay + i * enterStagger,
        config: { duration },
      }));
    } else {
      void listSpringApi.start(() => ({
        to: { opacity: 1, transform: "translateY(0px)" },
        immediate: true,
      }));
    }
  }, [listSpringApi, listTravelY, transitionState]);

  return (
    <Root>
      <Container
        style={{
          width: spring.width,
          height: spring.height,
        }}
        $bgColor={team.uiBgColor}
        $textColor={team.uiTextColor}
        $highlightColor={team.textHighlightColor}
        $uiBtnBgColor={team.uiBtnBgColor}
      >
        <Scrim
          style={{
            opacity: spring.opacityScrim,
            pointerEvents: activePlayerId ? "auto" : "none",
            backgroundColor: team.bgColor,
          }}
        />
        <ToggleContainer
          style={{
            opacity: spring.opacityToggle,
            pointerEvents: isPlayerListVisible ? "none" : "auto",
          }}
          onClick={() => setIsPlayerListVisible(true)}
        >
          <MenuIcon>☰</MenuIcon>
        </ToggleContainer>

        {/* We use a measurable wrapper to find the organic height of the list */}
        <AnimatedListContainer
          style={{
            opacity: spring.opacityList,
            pointerEvents: isPlayerListVisible ? "auto" : "none",
          }}
        >
          {/* We attach the ref to an inner div so we can measure the list's natural height, 
              while the outer container remains absolute and doesn't get squished manually */}
          <MeasurementWrapper ref={listRef}>
            <Content>
              <Header style={listSprings[0]}>
                <Title style={{ color: team.uiTextHighlightColor }}>
                  Starting XI
                </Title>
                <CloseButton
                  style={{ color: team.uiTextHighlightColor }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlayerListVisible(false);
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 20 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 2.5V13.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M14.5 3.5L10 8L14.5 12.5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </CloseButton>
              </Header>
              <List>
                {players.map((player, index) => (
                  <ListItem
                    key={player.id}
                    style={listSprings[index + 1]}
                    onMouseEnter={() => setListHoveredPlayerId(player.id)}
                    onMouseLeave={() => setListHoveredPlayerId(null)}
                    onClick={() => setActivePlayerId(player.id)}
                  >
                    <PlayerNumber
                      style={{
                        color: team.uiAccentTextColor,
                        backgroundColor: team.uiAccentBgColor,
                      }}
                    >
                      {player.number}
                    </PlayerNumber>
                    <PlayerName>{player.name}</PlayerName>
                  </ListItem>
                ))}
              </List>
            </Content>
          </MeasurementWrapper>
        </AnimatedListContainer>
      </Container>
    </Root>
  );
}

const Root = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 12px;
  z-index: 100;
  pointer-events: none;
`;

const Scrim = styled(animated.div)`
  position: absolute;
  inset: 0;
  z-index: 2;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  flex: 1;
  width: var(--dim-side-panel-root-width);
`;

const ToggleContainer = styled(animated.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const MenuIcon = styled.div`
  font-size: 20px;
  font-weight: bold;
`;

const AnimatedListContainer = styled(animated.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const MeasurementWrapper = styled.div`
  display: flex;
  flex-direction: column;
  /* We want to measure the full organic height, so we let it grow but cap at 80vh to match max-height of container */
  max-height: 80vh;
  width: var(--dim-side-panel-root-width);
  height: max-content;
`;

const Header = styled(animated.div)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 12px 12px 16px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const CloseButton = styled.div`
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 16px;
  font-weight: bold;
  flex-shrink: 0;
  position: absolute;
  right: 8px;
  top: 8px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    opacity: 1;
  }
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 4px 0 12px;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  flex: 1;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge legacy */

  &::-webkit-scrollbar {
    display: none; /* Chrome/Safari */
  }
`;

const ListItem = styled(animated.li)`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  padding: 8px 12px 8px 8px;
  cursor: pointer;
  border-radius: 16px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  min-width: 0;
  margin: 0 4px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &:active {
    background-color: rgba(255, 255, 255, 0.13);
    transform: scale(0.98);
  }
`;

const Container = styled(animated.div)<{
  $bgColor: string;
  $textColor: string;
  $highlightColor: string;
  $uiBtnBgColor: string;
}>`
  position: relative;
  color: ${(props) => props.$textColor};
  border-radius: 24px;
  overflow: hidden;
  pointer-events: auto;
  max-height: 80vh;

  ${ToggleContainer} {
    background-color: ${(props) => props.$uiBtnBgColor};
  }

  ${MeasurementWrapper} {
    background-color: ${(props) => props.$bgColor};
  }
`;

const PlayerNumber = styled.span`
  font-weight: 700;
  width: 24px;
  text-align: center;
  height: 24px;
  flex-shrink: 0;
  font-size: 15px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PlayerName = styled.span`
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  flex: 1;
  text-overflow: ellipsis;
  min-width: 0;
`;
