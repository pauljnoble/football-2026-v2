import styled from "styled-components";
import { useTeamStore } from "../store/teamStore";

export default function PlayerList() {
  const players = useTeamStore((state) => state.players);
  const team = useTeamStore((state) => state.team);

  return (
    <Container
      $bgColor={team.uiBgColor}
      $textColor={team.uiTextColor}
      $highlightColor={team.textHighlightColor}
    >
      <Title style={{color: team.uiTextHighlightColor}}>Starting XI</Title>
      <List>
        {players.map((player) => (
          <ListItem key={player.id}>
            <PlayerNumber style={{color: team.uiTextHighlightColor}}>{player.number}</PlayerNumber>
            <PlayerName>{player.name}</PlayerName>
          </ListItem>
        ))}
      </List>
    </Container>
  );
}

const Container = styled.div<{ $bgColor: string; $textColor: string; $highlightColor: string }>`
  position: absolute;
  left: 20px;
  top: 32px;
  
  max-width: 300px;
  background-color: ${(props) => props.$bgColor};
  color: ${(props) => props.$textColor};
  border-radius: 24px;
  padding: 16px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 80vh;
  overflow-y: auto;

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
  font-size: 24px;
  font-weight: 700;
  margin: 0;
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ListItem = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  padding: 4px 0;
`;

const PlayerNumber = styled.span`
  font-weight: 700;
  width: 24px;
  text-align: center;
`;

const PlayerName = styled.span`
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
