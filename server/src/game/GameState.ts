import {
  Move,
  MoveType,
  GameProgress,
  PlayerRole,
  GamePhase,
  CharacterChoosingStateType as CCST,
  PlayerId,
  DistrictId,
  RoleType,
  GatherActionType,
  PlanSubmission,
  PlayerPosition
} from 'citadels-common';
import Debug from 'debug';
import { Observer, Subject } from '../utils/observerPattern';
import BoardState from './BoardState';
import { ALL_DISTRICTS, DistrictType } from './DistrictCard';
import GameSetupData from './GameSetupData';
import Player from './Player';
import RoleManager, { RolePosition } from './RoleManager'; // Fixed import

const debug = Debug('citadels-server');

export default class GameState implements Subject {
  progress: GameProgress;
  players: Map<PlayerId, Player>;
  board: BoardState | undefined;
  completeCitySize: number;
  observers: Observer[];

  constructor(completeCitySize = 8) {
    this.progress = GameProgress.IN_LOBBY;
    this.players = new Map();
    this.board = undefined;
    this.completeCitySize = completeCitySize;
    this.observers = [];
  }

  containsPlayer(playerId: PlayerId | undefined) {
    if (playerId === undefined) { return false; }
    return this.players.has(playerId);
  }

  getPlayer(playerId: PlayerId | undefined) {
    if (playerId === undefined) { return undefined; }
    return this.players.get(playerId);
  }

  addPlayer(
    id: PlayerId,
    username: string,
    manager = false,
    online = true,
    role = PlayerRole.PLAYER,
  ) {
    const player = new Player(id, username, manager, online, role);
    this.players.set(id, player);
    return player;
  }

  getStateFromPlayer(playerId: PlayerId | undefined) {
    if (playerId === undefined) { return undefined; }
    return {
      progress: this.progress,
      players: Array.from(this.players),
      self: playerId,
      board: this.board?.exportForPlayer(playerId),
      settings: {
        completeCitySize: this.completeCitySize,
      },
    };
  }

  validateGameSetup(gameSetupData: GameSetupData): boolean {
    const roomPlayerIds = Array.from(this.players.keys());
    const validPlayerIds = gameSetupData.players.every(
      (playerId) => roomPlayerIds.includes(playerId),
    );
    if (!validPlayerIds) return false;

    if (gameSetupData.players.length < 1 || gameSetupData.players.length > 8) return false;
    return true;
  }

  setupGame(gameSetupData: GameSetupData) {
    this.completeCitySize = gameSetupData.completeCitySize;

    const players: PlayerId[] = [];
    Array.from(this.players.keys()).forEach((playerId) => {
      const player = this.players.get(playerId);
      if (player) {
        if (gameSetupData.players.includes(playerId)) {
          player.role = PlayerRole.PLAYER;
          players.push(playerId);
        } else {
          player.role = PlayerRole.SPECTATOR;
        }
      }
    });
    this.board = new BoardState(players);
    this.progress = GameProgress.IN_GAME;
  }

  step(move = { type: MoveType.AUTO } as Move): boolean {
    debug('------- STEP -------');
    debug('move', MoveType[move.type], move.data);
    debug('progress', GameProgress[this.progress]);
    debug('phase', this.board ? GamePhase[this.board.gamePhase] : undefined);

    if (!this.board) {
        if (this.progress === GameProgress.IN_LOBBY && move.type === MoveType.AUTO) {
            this.progress = GameProgress.IN_GAME;
            return this.step(move);
        }
        return false;
    }

    switch (this.progress) {
      case GameProgress.IN_GAME:
        switch (this.board.gamePhase) {
          case GamePhase.INITIAL:
            if (move.type === MoveType.AUTO) {
              setTimeout(() => {
                if (this.board) {
                  this.board.gamePhase = GamePhase.CHOOSE_CHARACTERS;
                  this.step();
                  this.notify();
                }
              }, 3000);
              return true;
            }
            return false;

          case GamePhase.CHOOSE_CHARACTERS:
            return this.handleDraftPhase(move);

          case GamePhase.PLANNING:
            return this.handlePlanningPhase(move);

          case GamePhase.RESOLUTION:
             if (move.type === MoveType.AUTO) {
                 this.resolveRound();
                 return true;
             }
             return false;

          default:
            this.progress = GameProgress.FINISHED;
            break;
        }
        break;

      case GameProgress.FINISHED:
        break;
    }
    return false;
  }

  private handleDraftPhase(move: Move): boolean {
      if (!this.board) return false;
      const rm = this.board.roleManager;
      const ccs = rm.choosingState;

      switch (ccs.getState().type) {
        case CCST.INITIAL:
          if (move.type === MoveType.AUTO) {
            setTimeout(() => {
              ccs.step();
              this.notify();
            }, 3000);
            return true;
          }
          return false;

        case CCST.PUT_ASIDE_FACE_DOWN:
          return move.type === MoveType.CHOOSE_CHARACTER && rm.chooseRandomCharacter();

        case CCST.PUT_ASIDE_FACE_UP:
          return move.type === MoveType.CHOOSE_CHARACTER && rm.chooseRandomCharacter(true);

        case CCST.CHOOSE_CHARACTER:
        case CCST.PUT_ASIDE_FACE_DOWN_UP:
          return move.type === MoveType.CHOOSE_CHARACTER && rm.chooseCharacter(move.data);

        case CCST.DONE:
          if (move.type === MoveType.AUTO) {
            this.board.gamePhase = GamePhase.PLANNING;
            this.notify();
            return true;
          }
          return false;
      }
      return false;
  }

  private handlePlanningPhase(move: Move): boolean {
      if (!this.board) return false;

      if (move.type === MoveType.SUBMIT_PLAN) {
          const { playerId, submission } = move.data;
          if (!playerId || !submission) return false;

          this.board.planSubmissions.set(playerId, submission);

          // Check if all players submitted
          // Use this.players to check roles, as this.board.players are PlayerBoardState
          const playingPlayers = Array.from(this.players.values())
              .filter(p => p.role === PlayerRole.PLAYER)
              .map(p => p.id);

          const allSubmitted = playingPlayers.every(id => this.board!.planSubmissions.has(id));

          if (allSubmitted) {
              this.board.gamePhase = GamePhase.RESOLUTION;
              this.notify();
              setTimeout(() => {
                  this.step({ type: MoveType.AUTO });
              }, 1000);
          }

          this.notify();
          return true;
      }
      return false;
  }

  private resolveRound() {
      if (!this.board) return;
      const rm = this.board.roleManager;

      // 1. Rat Mechanic Check
      if (this.board.ratPlayerId && this.board.planSubmissions.has(this.board.ratPlayerId)) {
          const ratPlan = this.board.planSubmissions.get(this.board.ratPlayerId)!;
          if (ratPlan.activateRat) {
              this.executeRatRaid();
          }
      }

      // 2. Iterate Roles 1-8
      const roles = RoleManager.getAllRoles();
      for (const role of roles) {
          rm.currentRole = role;
          const ownerPos = rm.getRoleOwner(role);

          if (ownerPos === PlayerPosition.SPECTATOR) continue;

          const ownerId = this.board.playerOrder[ownerPos - PlayerPosition.PLAYER_1];
          const submission = this.board.planSubmissions.get(ownerId);

          if (!submission) continue;

          if (rm.killedRole === role) {
              this.board.resolutionLog.push(`Role ${role} was Assassinated and skips turn.`);
              continue;
          }

          this.executeRoleTurn(ownerId, role, submission);
      }

      this.finishRound();
  }

  private executeRatRaid() {
      if (!this.board || !this.board.ratPlayerId) return;

      this.board.ratRevealed = false;
      this.board.resolutionLog.push("🚨 DEA RAID! The Rat called the feds!");

      let maxCash = -1;
      let richestPlayers: PlayerId[] = [];

      this.board.players.forEach((p, pid) => {
          if (p.stash > maxCash) {
              maxCash = p.stash;
              richestPlayers = [pid];
          } else if (p.stash === maxCash) {
              richestPlayers.push(pid);
          }
      });

      richestPlayers.forEach(pid => {
          const p = this.board!.players.get(pid)!;
          const loss = Math.floor(p.stash / 2);
          p.stash -= loss;
          this.board!.resolutionLog.push(`Player ${this.players.get(pid)?.username} lost ${loss} cash in the raid.`);
      });

      const rat = this.board.players.get(this.board.ratPlayerId)!;
      rat.stash += 3;
  }

  private executeRoleTurn(playerId: PlayerId, role: RoleType, plan: PlanSubmission) {
      if (!this.board) return;
      const player = this.board.players.get(playerId)!;
      const rm = this.board.roleManager;

      // 1. Ability
      if (role === RoleType.SICARIO) {
          const targetRole = plan.abilityTarget as RoleType;
          if (targetRole && targetRole !== RoleType.SICARIO) {
              rm.killedRole = targetRole;
          }
      }

      if (role === RoleType.MOLE) {
          const targetRole = plan.abilityTarget as RoleType;
          if (targetRole && targetRole !== RoleType.MOLE && targetRole !== RoleType.SICARIO) {
             if (targetRole !== RoleType.BOSS) {
                 rm.robbedRole = targetRole;
             }
          }
      }

      if (role === RoleType.LAUNDERER) {
          if (plan.abilityData && plan.abilityData.type === 'SWAP_PLAYER') {
               const targetPlayerPos = plan.abilityTarget as number;
               if (targetPlayerPos >= 0 && targetPlayerPos < this.board.playerOrder.length) {
                   const targetId = this.board.playerOrder[targetPlayerPos];
                   const target = this.board.players.get(targetId)!;
                   [player.hand, target.hand] = [target.hand, player.hand];
               }
          } else if (plan.abilityData && plan.abilityData.type === 'DISCARD_HAND') {
              const count = player.hand.length;
              this.board.districtsDeck.discardCards(player.hand as DistrictId[]);
              player.hand = [];
              player.addCardsToHand(this.board.districtsDeck.drawCards(count));
          }
      }

      if (role === RoleType.ENFORCER) {
          if (plan.abilityData && plan.abilityData.type === 'ACCUSE_RAT') {
              const accusedPos = plan.abilityTarget as number;
               if (accusedPos >= 0 && accusedPos < this.board.playerOrder.length) {
                   const accusedId = this.board.playerOrder[accusedPos];
                   if (accusedId === this.board.ratPlayerId) {
                       const rat = this.board.players.get(accusedId)!;
                       rat.stash = Math.max(0, rat.stash - 3);
                       this.board.ratRevealed = true;
                   } else {
                       player.stash = Math.max(0, player.stash - 3);
                   }
               }
          } else if (plan.abilityData && plan.abilityData.type === 'DESTROY_ASSET') {
              const { targetPlayerId, assetId } = plan.abilityData;
              const target = this.board.players.get(targetPlayerId);
              if (target) {
                  // Check Politician Immunity: "All Blue assets immune to destruction this round"
                  const card = ALL_DISTRICTS.get(assetId)?.card;
                  let protectedAsset = false;

                  if (card && card.type === DistrictType.RELIGIOUS) {
                      const politicianPos = rm.getRoleOwner(RoleType.POLITICIAN);
                      if (politicianPos !== PlayerPosition.SPECTATOR && rm.killedRole !== RoleType.POLITICIAN) {
                          protectedAsset = true;
                          this.board.resolutionLog.push(`Destruction of ${card.id} failed: Protected by Politician.`);
                      }
                  }

                  if (!protectedAsset) {
                      const cost = target.computeDestroyCost(assetId);
                      if (player.stash >= cost) {
                           player.stash -= cost;
                           target.destroyDistrict(assetId);
                           this.board.graveyard = assetId;
                           this.board.resolutionLog.push(`Enforcer destroyed ${assetId} from Player ${this.players.get(targetPlayerId)?.username}.`);
                      }
                  }
              }
          }
      }

      // 2. Gather
      if (plan.gatherAction === GatherActionType.TAKE_CASH) {
          let amount = 2;
          if (role === RoleType.TRAFFICKER) {
             amount = 3;
          }
          player.stash += amount;
      } else if (plan.gatherAction === GatherActionType.DRAW_CARDS) {
          let drawCount = 2; // Default logic
          if (role === RoleType.COOK) {
              drawCount = 4;
          }
          if (player.city.includes('observatory')) {
              drawCount++;
          }

          const effectiveKeep = (role === RoleType.COOK) ? 2 : 1;
          player.addCardsToHand(this.board.districtsDeck.drawCards(effectiveKeep));
      }

      // Mole Theft Trigger
      if (rm.robbedRole === role) {
          const molePos = rm.getRoleOwner(RoleType.MOLE);
          if (molePos !== PlayerPosition.SPECTATOR) {
              const moleId = this.board.playerOrder[molePos - PlayerPosition.PLAYER_1];
              const mole = this.board.players.get(moleId)!;

              const stolen = player.stash;
              player.stash = 0;
              mole.stash += stolen;
          }
      }

      // 3. Build
      if (plan.buildAction) {
          let buildLimit = 1;
          if (role === RoleType.COOK) buildLimit = 3;

          let builtCount = 0;
          for (const buildItem of plan.buildAction) {
              if (builtCount >= buildLimit) break;

              if (player.buildDistrict(buildItem.districtId)) {
                  builtCount++;
              }
          }
      }

      // 4. Role Income
      if (role === RoleType.BOSS) {
           player.stash += player.computeEarningsForCharacter(RoleType.BOSS);
      }
      if (role === RoleType.POLITICIAN) {
           player.stash += player.computeEarningsForCharacter(RoleType.POLITICIAN);
      }
      if (role === RoleType.TRAFFICKER) {
           player.stash += player.computeEarningsForCharacter(RoleType.TRAFFICKER);
      }
  }

  private finishRound() {
      if (!this.board) return;

      const isEndOfGame = Array.from(this.board.players.values()).some(
        (player) => player.city.length >= this.completeCitySize,
      );

      if (isEndOfGame) {
        this.computeScores();
        this.progress = GameProgress.FINISHED;
      } else {
         this.board.gamePhase = GamePhase.CHOOSE_CHARACTERS;
         this.board.roleManager.reset();
         this.board.planSubmissions.clear();
         this.board.resolutionLog = [];
         this.board.assignRat();

         this.giveCrownToKing();

         this.notify();
      }
  }

  private giveCrownToKing() {
    if (!this.board) return false;
    const rm = this.board.roleManager;
    const pos = rm.roles[RoleType.BOSS];

    if (pos >= RolePosition.PLAYER_1 && pos <= RolePosition.PLAYER_7) {
        const playerPos = (pos as unknown as number) - RolePosition.PLAYER_1;
         this.board.playerOrder.push(...this.board.playerOrder.splice(0, playerPos));
         rm.shiftPlayerPosition(playerPos);
    }
  }

  private computeScores() {
     this.board?.players.forEach((player) => {
       player.computeScore(this.completeCitySize);
     });
  }

  attach(observer: Observer): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  detach(observer: Observer): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }

  notify(): void {
    this.observers.forEach((observer) => {
      observer.update();
    });
  }
}
