import {
  DistrictId, GamePhase, PlayerId, PlayerPosition, PlanSubmission, RoleType,
} from 'citadels-common';
import RoleManager from './RoleManager';
import DistrictsDeck from './DistrictsDeck';
import PlayerBoardState from './PlayerBoardState';

export default class BoardState {
  // player city, hand and stash
  players: Map<PlayerId, PlayerBoardState>;

  // player order, first player has the crown
  playerOrder: Array<PlayerId>;

  // role manager (handles drafting and role assignment)
  roleManager: RoleManager;

  // current game phase
  gamePhase: GamePhase;

  // district cards deck
  districtsDeck: DistrictsDeck;

  // graveyard (1 card)
  graveyard: DistrictId | undefined;

  // Plan Phase Data
  planSubmissions: Map<PlayerId, PlanSubmission>;
  ratPlayerId: PlayerId | undefined;
  ratRevealed: boolean;
  resolutionLog: string[];

  constructor(players: PlayerId[]) {
    this.players = new Map();
    this.playerOrder = [...players];
    this.roleManager = new RoleManager(players.length);
    this.gamePhase = GamePhase.INITIAL;
    this.districtsDeck = new DistrictsDeck();
    this.planSubmissions = new Map();
    this.ratRevealed = false;
    this.resolutionLog = [];

    // initialize each player hand with 2 gold and 4 district cards
    players.forEach((playerId) => {
      this.players.set(playerId, new PlayerBoardState(2, this.districtsDeck.drawCards(4)));
    });

    // Randomly assign Rat
    this.assignRat();
  }

  assignRat() {
    const randomIndex = Math.floor(Math.random() * this.playerOrder.length);
    this.ratPlayerId = this.playerOrder[randomIndex];
    this.ratRevealed = false;
  }

  exportForPlayer(destPlayerId: PlayerId) {
    // whether the player can see all hands
    const destPlayerPos = this.playerOrder.indexOf(destPlayerId) as PlayerPosition;
    const seesAll = destPlayerPos === PlayerPosition.SPECTATOR;
    const isRat = this.ratPlayerId === destPlayerId;

    return {
      players: Array.from(this.players).map((elem) => {
        const playerId = elem[0];
        const board = elem[1];
        const canSeeHand = seesAll || playerId === destPlayerId;
        const otherPlayerPos = this.playerOrder.indexOf(playerId) as PlayerPosition;

        // Export logic needs to be mindful of new RoleManager structure
        const characters = this.roleManager.exportPlayerRoles(otherPlayerPos, destPlayerPos);

        return [playerId, {
          ...board.exportForPlayer(canSeeHand),
          characters: characters,
          isRat: (this.ratRevealed || (isRat && playerId === destPlayerId)) ? (this.ratPlayerId === playerId) : false
        }];
      }),
      gamePhase: this.gamePhase,
      // turnState is less relevant now in PLANNING/RESOLUTION, but maybe we map it for compatibility or send null
      turnState: 0, // value 0 is INITIAL/AUTO usually
      playerOrder: this.playerOrder,
      currentPlayer: this.getCurrentPlayerPosition(),
      currentPlayerExtraData: {
        // ...this.roleManager.exportCurrentPlayerExtraData(), // This might need update
         districtsToBuild: 1, // Default, updated during resolution
         canTakeEarnings: false,
         canDoSpecialAction: false,
         hasUsedLaboratory: false,
         hasUsedSmithy: false,
         earningsValue: 0
      },
      characters: this.roleManager.exportRolesList(destPlayerPos),
      graveyard: this.graveyard,
      ratPlayerId: (this.ratRevealed || isRat) ? this.ratPlayerId : undefined,
      resolutionLog: this.resolutionLog
    };
  }

  // current player (index of playerOrder)
  getCurrentPlayerPosition(): PlayerPosition {
    switch (this.gamePhase) {
      case GamePhase.CHOOSE_CHARACTERS:
        return this.roleManager.choosingState.getState().player;
      case GamePhase.RESOLUTION:
        return this.roleManager.getCurrentPlayerPosition();
      default:
    }
    return PlayerPosition.SPECTATOR;
  }

  getCurrentPlayerId() {
    return this.playerOrder[this.getCurrentPlayerPosition()];
  }
}
