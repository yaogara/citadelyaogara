import districtsJson from './districts.json';

export const districts = districtsJson;

export type PlayerId = string;
export type RoomId = string;
export type DistrictId = keyof typeof districts;

export enum GameProgress {
  IN_LOBBY = 1,
  IN_GAME,
  FINISHED,
}

export enum PlayerRole {
  SPECTATOR = 1,
  PLAYER,
}

export enum GamePhase {
  INITIAL = 0,
  CHOOSE_CHARACTERS, // Drafting
  PLANNING,          // Simultaneous Plan (New)
  RESOLUTION,        // Automated Resolution (New)
  DO_ACTIONS,        // Deprecated (Legacy)
}

export enum CharacterChoosingStateType {
  INITIAL = 0,
  PUT_ASIDE_FACE_UP,
  PUT_ASIDE_FACE_DOWN,
  PUT_ASIDE_FACE_DOWN_UP,
  CHOOSE_CHARACTER,
  GET_ASIDE_FACE_DOWN,
  DONE,
}

// Renamed to match Plata o Plomo roles
export enum RoleType {
  NONE = 0,
  SICARIO,     // 1 (Assassin)
  MOLE,        // 2 (Thief)
  LAUNDERER,   // 3 (Magician)
  BOSS,        // 4 (King)
  POLITICIAN,  // 5 (Bishop)
  TRAFFICKER,  // 6 (Merchant)
  COOK,        // 7 (Architect)
  ENFORCER,    // 8 (Warlord)
}

// Alias for backward compatibility if needed, though refactoring is preferred
export const CharacterType = RoleType;
export type CharacterType = RoleType;

export enum PlayerPosition {
  SPECTATOR = -1,
  PLAYER_1,
  PLAYER_2,
  PLAYER_3,
  PLAYER_4,
  PLAYER_5,
  PLAYER_6,
  PLAYER_7,
}

export enum ClientTurnState {
  INITIAL = 0,
  TAKE_RESOURCES,
  CHOOSE_CARD,
  CHOOSE_ACTION,
  ASSASSIN_KILL,
  THIEF_ROB,
  MAGICIAN_EXCHANGE_HAND,
  MAGICIAN_DISCARD_CARDS,
  MERCHANT_TAKE_1_GOLD,
  ARCHITECT_DRAW_2_CARDS,
  WARLORD_DESTROY_DISTRICT,
  GRAVEYARD_RECOVER_DISTRICT,
  LABORATORY_DISCARD_CARD,
  BUILD_DISTRICT,
  DONE,
}

export interface PlayerScore {
  base?: number
  extraPointsStash?: number
  extraPointsHand?: number
  extraPointsDistrictTypes?: number
  extraPointsCompleteCity?: number
  total?: number
}

export type PlayerBoard = {
  stash: number
  hand: (DistrictId | null)[]
  tmpHand: (DistrictId | null)[]
  city: DistrictId[]
  score: PlayerScore
  characters: {
    id: RoleType
  }[]
  isRat?: boolean // New
};

export type PlayerExtraData = {
  districtsToBuild: number
  canTakeEarnings: boolean
  canDoSpecialAction: boolean
  hasUsedLaboratory: boolean
  hasUsedSmithy: boolean
  earningsValue: number
};

export type ClientGameState = {
  progress: GameProgress
  players: Map<PlayerId, {
    id: PlayerId
    username: string
    manager: boolean
    online: boolean
    role: PlayerRole
  }>
  self: PlayerId
  board: {
    players: Map<PlayerId, PlayerBoard>
    gamePhase: GamePhase
    turnState: ClientTurnState
    playerOrder: PlayerId[],
    currentPlayer: PlayerPosition,
    currentPlayerExtraData: PlayerExtraData
    characters: {
      state: {
        type: CharacterChoosingStateType
        player: PlayerPosition
      }
      current: RoleType
      callable: {
        id: RoleType
        killed: boolean
        robbed: boolean
      }[]
      aside: {
        id: RoleType
      }[]
    }
    graveyard: DistrictId | undefined
    ratPlayerId?: PlayerId // New
    resolutionLog?: string[] // New
  }
  settings: {
    completeCitySize: number
  }
};

export type GameSetupData = {
  players: PlayerId[]
  completeCitySize: number
};

export enum MoveType {
  AUTO = 0,

  CHOOSE_CHARACTER,

  TAKE_GOLD,
  DRAW_CARDS,

  ASSASSIN_KILL,
  THIEF_ROB,
  MAGICIAN_EXCHANGE_HAND,
  MAGICIAN_DISCARD_CARDS,
  TAKE_GOLD_EARNINGS,
  MERCHANT_TAKE_1_GOLD,
  ARCHITECT_DRAW_2_CARDS,
  WARLORD_DESTROY_DISTRICT,

  GRAVEYARD_RECOVER_DISTRICT,
  SMITHY_DRAW_CARDS,
  LABORATORY_DISCARD_CARD,

  DECLINE,
  BUILD_DISTRICT,
  FINISH_TURN,

  // New Move for Planning Phase
  SUBMIT_PLAN,
}

export enum GatherActionType {
  TAKE_CASH = 1, // Take 2 Dirty Cash (Trafficker can take 3)
  DRAW_CARDS,    // Draw 2 keep 1 (Cook draws 4 keep 1)
}

export interface PlanSubmission {
  gatherAction: GatherActionType;
  buildAction?: {
    districtId: DistrictId;
  }[]; // Array to support Cook building up to 3
  abilityTarget?: number; // RoleRank or PlayerIndex depending on role
  abilityData?: any; // Extra data for complex abilities (e.g. Launderer swap)
  activateRat?: boolean;
}

export interface Move {
  type: MoveType
  data?: any
}
