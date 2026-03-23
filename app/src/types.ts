export type Team = {
    name: string;
    code: string;
    defaultFormation: string;
    playerBgColor: string
    playerRingColorDark: string
    playerRingColor: string;
    bgColor: string;
    textDisplayColor: string;
    textHighlightColor: string
    scrimBgColor: string;
    scrimTextColor: string;
    uiBgColor: string;
    uiTextColor: string;
    uiTextHighlightColor: string;
    uiBtnBgColor: string;
    snippet: string;
    hueRotation?: number;
}

export type TeamData = Team[]

export type PlayerPosition =
    | 'Goalkeeper'
    | 'Defender'
    | 'Midfielder'
    | 'Forward'
    | (string & {})

export type Player = {
    id: string
    name: string
    position: PlayerPosition
    number: number
    country: string
    profilePicture?: string
    profilePictureUrl?: string
}

/** Static roster entries (id assigned when loading a team via `getPlayersByTeamCode`) */
export type PlayerSeed = Omit<Player, 'id'>

export type PlayerData = Player[]

export type FormationPosition = {
    /** Horizontal percentage of inner playing width (-0.5 = left edge, 0.5 = right edge). */
    x: number
    y: number
    /** Depth percentage of inner playing depth (-0.5 = far edge, 0.5 = near edge). */
    z: number
}

export type Formation = {
    name: string
    positions: FormationPosition[]
}

export type FormationData = Formation[]
