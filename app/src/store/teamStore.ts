import { create } from 'zustand';
import formationsData from '../data/formations';
import teamsData from '../data/teams';
import { getPlayersByTeamCode } from '../data/players';
import type { Formation, FormationData, PlayerData, TeamData, Team } from '../types';

export type TeamTransitionState =
  | 'entered'
  | 'entering'
  | 'exiting'
  | 'exited'

type TeamStore = {
  name: string
  players: PlayerData
  team: Team
  formation: Formation
  transitionState: TeamTransitionState
  activePlayerId: string | null
  setActivePlayerId: (id: string | null) => void
  listHoveredPlayerId: string | null
  setListHoveredPlayerId: (id: string | null) => void
  fieldMaxWidthPx: number
  setFieldMaxWidthPx: (width: number) => void
  viewXOffset: number
  setViewXOffset: (offset: number) => void
}

const typedTeamsData: TeamData = teamsData;
const typedFormationsData: FormationData = formationsData;
const defaultTeam = typedTeamsData[0];

export function getFormationByName(name: string): Formation | undefined {
  return typedFormationsData.find((formation) => formation.name === name);
}

const defaultFormation =
  (defaultTeam && getFormationByName(defaultTeam.defaultFormation)) ||
  typedFormationsData[0];

if (!defaultTeam) {
  throw new Error('No default team found');
}
if (!defaultFormation) {
  throw new Error('No default formation found');
}

export const useTeamStore = create<TeamStore>((set) => ({
  team: defaultTeam,
  name: defaultTeam.name,
  players: getPlayersByTeamCode(defaultTeam.code),
  formation: defaultFormation,
  transitionState: 'entered',
  activePlayerId: null,
  setActivePlayerId: (activePlayerId) => set({ activePlayerId }),
  listHoveredPlayerId: null,
  setListHoveredPlayerId: (listHoveredPlayerId) => set({ listHoveredPlayerId }),
  fieldMaxWidthPx: 1200,
  setFieldMaxWidthPx: (fieldMaxWidthPx) => set({ fieldMaxWidthPx }),
  viewXOffset: 0,
  setViewXOffset: (viewXOffset) => set({ viewXOffset }),
}));
