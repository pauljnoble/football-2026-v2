import styled from "styled-components";
import { useTeamStore } from "../store/teamStore";

export default function PlayerList() {
  const players = useTeamStore((state) => state.players);
  const team = useTeamStore((state) => state.team);
  const setListHoveredPlayerId = useTeamStore(
    (state) => state.setListHoveredPlayerId,
  );
  const setActivePlayerId = useTeamStore((state) => state.setActivePlayerId);

  return (
    <Container
      $bgColor={team.uiBgColor}
      $textColor={team.uiTextColor}
      $highlightColor={team.textHighlightColor}
    >
      <Title style={{ color: team.uiTextHighlightColor }}>Starting XI</Title>
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
    </Container>
  );
}

const Container = styled.div<{
  $bgColor: string;
  $textColor: string;
  $highlightColor: string;
}>`
  position: absolute;
  left: 20px;
  top: 32px;

  max-width: 300px;
  background-color: ${(props) => `${props.$bgColor}dd`};
  backdrop-filter: blur(10px);
  color: ${(props) => props.$textColor};
  border-radius: 24px;
  padding: 8px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 80vh;
  overflow-y: auto;
  transition: all 0.6s ease;
  transition-delay: 100ms;

  /* Custom Scrollbar for better Webkit appearance */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${(props) => props.$highlightColor};
    border-radius: 4px;
  }
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  padding: 6px 12px;
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
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
