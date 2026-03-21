import { nanoid } from 'nanoid';
import braPlayers from './bra';
import engPlayers from './eng';
import type { PlayerData, PlayerSeed } from '../../types';

const playersByTeamCode: Record<string, PlayerSeed[]> = {
  bra: braPlayers,
  eng: engPlayers,
};

export function getPlayersByTeamCode(teamCode: string): PlayerData {
  const raw = playersByTeamCode[teamCode] ?? [];
  return raw.map((p) => ({ ...p, id: nanoid() }));
}
