import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { useSpring, animated } from "@react-spring/web";
import { useTeamStore } from "../store/teamStore";

function useMeasure() {
  const ref = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ height: 0, width: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setBounds({ 
        height: entry.contentRect.height,
        width: entry.contentRect.width 
      });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, bounds] as const;
}

export default function PlayerList() {
  const [isExpanded, setIsExpanded] = useState(true);
  const players = useTeamStore((state) => state.players);
  const team = useTeamStore((state) => state.team);
  const setListHoveredPlayerId = useTeamStore(
    (state) => state.setListHoveredPlayerId,
  );
  const setActivePlayerId = useTeamStore((state) => state.setActivePlayerId);

  const [listRef, listBounds] = useMeasure();

  // If listBounds hasn't measured yet, use 'auto' to let it take shape, 
  // or a reasonable default. Actually we can just animate height explicitly.
  // We need to account for padding of the container if the container has no padding.
  const targetHeight = isExpanded ? listBounds.height || "auto" : 48;
  const targetWidth = isExpanded ? listBounds.width || "auto" : 48;

  const spring = useSpring({
    width: targetWidth,
    height: targetHeight,
    opacityList: isExpanded ? 1 : 0,
    opacityToggle: isExpanded ? 0 : 1,
    config: { tension: 300, friction: 30 },
  });

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
      >
        <ToggleContainer
          style={{
            opacity: spring.opacityToggle,
            pointerEvents: isExpanded ? "none" : "auto",
          }}
          onClick={() => setIsExpanded(true)}
        >
          <MenuIcon>☰</MenuIcon>
        </ToggleContainer>

        {/* We use a measurable wrapper to find the organic height of the list */}
        <AnimatedListContainer
          style={{
            opacity: spring.opacityList,
            pointerEvents: isExpanded ? "auto" : "none",
          }}
        >
          {/* We attach the ref to an inner div so we can measure the list's natural height, 
              while the outer container remains absolute and doesn't get squished manually */}
          <MeasurementWrapper ref={listRef}>
            <Header>
              <Title style={{ color: team.uiTextHighlightColor }}>Starting XI</Title>
              <CloseButton onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}>
                ✕
              </CloseButton>
            </Header>
            <List>
              {players.map((player) => (
                <ListItem
                  key={player.id}
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
  padding: 20px;
  z-index: 100;
  pointer-events: none;
`;

const Container = styled(animated.div)<{
  $bgColor: string;
  $textColor: string;
  $highlightColor: string;
}>`
  position: relative;
  background-color: ${(props) => `${props.$bgColor}dd`};
  // backdrop-filter: blur(10px);
  color: ${(props) => props.$textColor};
  border-radius: 24px;
  overflow: hidden;
  pointer-events: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  max-height: 80vh;
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
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
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
  padding: 8px;
  /* We want to measure the full organic height, so we let it grow but cap at 80vh to match max-height of container */
  max-height: 80vh;
  width: max-content;
  height: max-content;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  padding-right: 4px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin: 0;
`;

const CloseButton = styled.div`
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 16px;
  font-weight: bold;
  opacity: 0.7;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    opacity: 1;
  }
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 12px 0 20px;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  flex: 1;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
`;

const ListItem = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  padding: 8px 12px;
  margin: 0;
  cursor: pointer;
  border-radius: 16px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &:active {
    background-color: rgba(255, 255, 255, 0.13);
    transform: scale(0.98);
  }
`;

const PlayerNumber = styled.span`
  font-weight: 700;
  width: 24px;
  text-align: center;
  height: 24px;
  font-size: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PlayerName = styled.span`
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
