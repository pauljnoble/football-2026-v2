export type Team = {
    name: string;
    code: string;
    defaultFormation: string;
    playerBgColor: string
    playerRingColorDark: string;
    groupName: string;
    playerRingColor: string;
    bgColor: string;
    textDisplayColor: string;
    textHighlightColor: string
    scrimBgColor: string;
    scrimTextColor: string;
    uiBgColor: string;
    uiTextColor: string;
    uiTextDarkColor: string;
    uiTextHighlightColor: string;
    uiAccentBgColor: string;
    uiAccentTextColor: string;
    uiBtnBgColor: string;
    textFooterColorOverride?: string;
    snippet: string;
    hueRotation?: number;
    cameraAzimuth?: number;
    cameraPolar?: number;
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
    nationality: string
    age: number
    height: number
    weight: number
    club: string
    league: string
    snippet: string
    profilePicture?: string
    profilePictureUrl?: string
    scenePictureUrl?: string
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
