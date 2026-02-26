import {
  CharacterChoosingStateType as CCST,
  PlayerPosition,
  RoleType
} from 'citadels-common';
import { CharacterChoosingState } from './ChoosingState';

export enum RolePosition {
  NOT_CHOSEN = 0,
  ASIDE_FACE_UP,
  ASIDE_FACE_DOWN,
  PLAYER_1,
  PLAYER_2,
  PLAYER_3,
  PLAYER_4,
  PLAYER_5,
  PLAYER_6,
  PLAYER_7,
}

export default class RoleManager {
  // player count between 2 and 7
  playerCount: number;

  // roles position on board, indexed by RoleType (0 = NONE, 1 = SICARIO...)
  // Note: RoleType starts at 0 (NONE), but we usually iterate 1-8.
  // The array size should cover up to RoleType.ENFORCER (8).
  // CharacterManager used RoleType.CHARACTER_COUNT. I should probably add ROLE_COUNT to common or just hardcode 9.
  roles: Array<RolePosition>;

  // choosing state
  choosingState: CharacterChoosingState;

  // special role attributes for the round
  killedRole: RoleType;
  robbedRole: RoleType;

  // Current role being resolved (for Resolution Phase)
  currentRole: RoleType;

  constructor(playerCount: number) {
    this.playerCount = playerCount;
    this.choosingState = new CharacterChoosingState(playerCount);
    this.roles = [];
    this.killedRole = RoleType.NONE;
    this.robbedRole = RoleType.NONE;
    this.currentRole = RoleType.NONE;
    this.reset();
  }

  reset() {
    // Fill with NOT_CHOSEN. Size is 9 (indices 0 to 8).
    this.roles = Array(9).fill(RolePosition.NOT_CHOSEN);
    this.choosingState.reset();
    this.killedRole = RoleType.NONE;
    this.robbedRole = RoleType.NONE;
    this.currentRole = RoleType.NONE;
  }

  static getAllRoles() {
    // Returns [1, 2, ..., 8]
    return Array.from({length: 8}, (_, i) => i + 1) as RoleType[];
  }

  private getRolesAtPosition(pos: RolePosition) {
    return this.roles.reduce((roles, position, roleType) => {
      if (position === pos) roles.push(roleType);
      return roles;
    }, new Array<RoleType>());
  }

  // Mapping PlayerPosition (common) to RolePosition (local)
  private getRolePositionFromPlayerPosition(pos: PlayerPosition): RolePosition {
    if (pos === PlayerPosition.SPECTATOR) return RolePosition.NOT_CHOSEN; // Invalid really
    return (pos + RolePosition.PLAYER_1) as unknown as RolePosition;
  }

  getCurrentPlayerPosition(): PlayerPosition {
    if (this.currentRole === RoleType.NONE) return PlayerPosition.SPECTATOR;

    const pos = this.roles[this.currentRole];
    switch (pos) {
      case RolePosition.PLAYER_1:
      case RolePosition.PLAYER_2:
      case RolePosition.PLAYER_3:
      case RolePosition.PLAYER_4:
      case RolePosition.PLAYER_5:
      case RolePosition.PLAYER_6:
      case RolePosition.PLAYER_7:
        return (pos - RolePosition.PLAYER_1) as unknown as PlayerPosition;

      default:
        break;
    }

    return PlayerPosition.SPECTATOR;
  }

  getRoleOwner(role: RoleType): PlayerPosition {
     const pos = this.roles[role];
     if (pos >= RolePosition.PLAYER_1 && pos <= RolePosition.PLAYER_7) {
         return (pos - RolePosition.PLAYER_1) as unknown as PlayerPosition;
     }
     return PlayerPosition.SPECTATOR;
  }

  exportPlayerRoles(pos: PlayerPosition, dest: PlayerPosition) {
    // Can see roles if:
    // - Is spectator
    // - Is own roles (dest == pos)
    // - Role has been revealed (during resolution, currentRole >= role) - simplified logic
    // Actually, in Resolution Phase, roles are revealed one by one.
    // If currentRole >= role, it means this role has acted or is acting, so it is public.
    // EXCEPT if it was killed? "If assassinated -> skip". But usually revealed?
    // Let's assume revealed when turn starts.

    // Also during Drafting, nobody sees anything except their own choice (and maybe partial info).
    // The ChoosingState handles visibility logic for drafting.

    // For now, simple logic:
    const canSee = dest === PlayerPosition.SPECTATOR || dest === pos;
    const rolePos = this.getRolePositionFromPlayerPosition(pos);

    const playerRoles = this.getRolesAtPosition(rolePos);

    return playerRoles.map((role) => {
        // Visibility Check
        // If currentRole >= role, it's public (Resolution phase revealed)
        // If canSee (self or spectator), it's visible.
        // Otherwise hidden.

        // Note: This logic might need refinement for "Plan Phase" where roles are hidden even to self?
        // No, you know your role.

        const visible = canSee || (this.currentRole >= role && role !== RoleType.NONE);

        return {
            id: visible ? role : RoleType.NONE, // Masked if not visible (Wait, NONE is 0)
            // Ideally we shouldn't even send the object if hidden, but the client expects an array.
            // Old code sent "CHARACTER_COUNT" as hidden ID.
            // I'll stick to logic: if hidden, send NONE or a specific HIDDEN constant.
            // But types expect RoleType.
            // Let's assume 0 (NONE) means hidden or none.
            killed: visible && role === this.killedRole,
            robbed: visible && role === this.robbedRole,
        };
    }).filter(r => r.id !== RoleType.NONE || canSee); // Maybe just return all, masked
  }

  // Re-implementing exportPlayerCharacters logic more closely to original for safety
  exportPlayerRolesLegacy(pos: PlayerPosition, dest: PlayerPosition) {
    const canSee = dest === PlayerPosition.SPECTATOR || dest === pos;
    // We assume resolution reveals roles.
    const rolePos = this.getRolePositionFromPlayerPosition(pos);

    return this.getRolesAtPosition(rolePos).map((id) => (
      (
        canSee || (id <= this.currentRole && id !== this.killedRole && this.currentRole !== RoleType.NONE)
      ) ? id : 999 // 999 as hidden marker
    )).sort().map((id) => ({
      id: (id === 999 ? RoleType.NONE : id),
      killed: id !== 999 && id === this.killedRole,
      robbed: id !== 999 && id === this.robbedRole,
    }));
  }

  exportRolesList(dest: PlayerPosition) {
    let roles = {};

    switch (this.choosingState.getState().type) {
      case CCST.INITIAL:
        roles = RoleManager.exportListInitial();
        break;
      case CCST.PUT_ASIDE_FACE_UP:
      case CCST.PUT_ASIDE_FACE_DOWN:
        roles = this.exportListPutAside(dest);
        break;
      case CCST.PUT_ASIDE_FACE_DOWN_UP:
      case CCST.CHOOSE_CHARACTER:
        roles = this.exportListChooseCard(dest);
        break;
      case CCST.DONE:
        roles = this.exportListDone();
        break;
      default:
    }

    return {
      state: this.choosingState.getState(),
      ...roles,
    };
  }

  private getAsideCards() {
    return [
      ...(this.getRolesAtPosition(RolePosition.ASIDE_FACE_DOWN)?.map(() => ({
        id: 0,
      })) || []),
      ...(this.getRolesAtPosition(RolePosition.ASIDE_FACE_UP)?.map((roleType) => ({
        id: roleType,
      })) || [])];
  }

  private static exportListInitial() {
    return {
      current: RoleType.NONE,
      callable: RoleManager.getAllRoles().map((roleType) => ({
        id: roleType,
      })),
      aside: [],

    };
  }

  private exportListPutAside(dest: PlayerPosition) {
    return this.exportListChooseCard(dest, false);
  }

  private exportListChooseCard(dest: PlayerPosition, canSee = true) {
    const { player } = this.choosingState.getState();
    const isSpectator = player === PlayerPosition.SPECTATOR;
    const canSeeList = canSee && (isSpectator || dest === player);

    return {
      // current role (the one being drafted? No, drafting picks from callable)
      current: this.currentRole,
      // callable roles: roles that have not been chosen
      callable: RoleManager.getAllRoles().filter(
        (roleType) => this.getRolesAtPosition(RolePosition.NOT_CHOSEN)
          ?.includes(roleType),
      ).map((roleType) => ({
        id: canSeeList ? roleType : 0,
        selectable: dest === player,
      })),
      // roles that are put aside
      aside: this.getAsideCards(),
    };
  }

  private exportListDone() {
    return {
      // current role acting
      current: this.currentRole,
      // all roles logic is different now. We might just list all roles and their status?
      // Original code listed "callable" as "all characters except aside face up".
      callable: RoleManager.getAllRoles().filter(
        (roleType) => !this.getRolesAtPosition(RolePosition.ASIDE_FACE_UP)
          ?.includes(roleType),
      ).map((roleType) => ({
        id: roleType,
        killed: this.killedRole === roleType,
        robbed: this.robbedRole === roleType,
      })),
      // roles that are put aside
      aside: this.getAsideCards(),
    };
  }

  chooseRandomCharacter(avoidKing = false): boolean {
    const roles = this.getRolesAtPosition(RolePosition.NOT_CHOSEN);
    let index;

    do {
      index = Math.floor(Math.random() * roles.length);
    } while (avoidKing && roles.length > 1 && roles[index] === RoleType.BOSS);

    return this.chooseCharacter(index);
  }

  chooseCharacter(index: number): boolean {
    let roles = this.getRolesAtPosition(RolePosition.NOT_CHOSEN);

    if (index < 0 || index >= roles.length) {
      return false;
    }

    if (this.choosingState.getState().player === PlayerPosition.SPECTATOR) {
      return false;
    }

    switch (this.choosingState.getState().type) {
      case CCST.PUT_ASIDE_FACE_UP:
        this.roles[roles[index]] = RolePosition.ASIDE_FACE_UP;
        break;

      case CCST.PUT_ASIDE_FACE_DOWN:
      case CCST.PUT_ASIDE_FACE_DOWN_UP:
        this.roles[roles[index]] = RolePosition.ASIDE_FACE_DOWN;
        break;

      case CCST.CHOOSE_CHARACTER:
        this.roles[roles[index]] = (
          this.choosingState.getState().player + RolePosition.PLAYER_1
        );
        break;

      default:
        // invalid state
        return false;
    }

    this.choosingState.step();

    // apply next automatic steps
    while (this.choosingState.getState().player === PlayerPosition.SPECTATOR) {
      roles = this.getRolesAtPosition(RolePosition.NOT_CHOSEN);

      switch (this.choosingState.getState().type) {
        case CCST.GET_ASIDE_FACE_DOWN:
          this.roles[this.getRolesAtPosition(RolePosition.ASIDE_FACE_DOWN)[0]] = (
            RolePosition.NOT_CHOSEN
          );
          break;

        case CCST.PUT_ASIDE_FACE_DOWN:
          this.roles[roles[0]] = RolePosition.ASIDE_FACE_DOWN;
          break;

        case CCST.DONE:
          return true;

        default:
      }

      this.choosingState.step();
    }

    return true;
  }

  shiftPlayerPosition(amount: number) {
    const offset = RolePosition.PLAYER_1;
    this.roles.forEach((rolePos, i) => {
      // Check if role is held by a player
      if (rolePos >= RolePosition.PLAYER_1 && rolePos <= RolePosition.PLAYER_7) {
        // We are shifting PLAYERS not Roles.
        // Wait, "shiftPlayerPosition" in Citadels was used when the King changes the starting player order?
        // No, it was used to rotate the crown?
        // "giveCrownToKing" called "shiftPlayerPosition".
        // It shifted the `playerOrder` array in `BoardState` AND shifted the `CharacterPosition` values?
        // Let's re-read `GameManager.ts`.
        // `this.board.playerOrder.push(...this.board.playerOrder.splice(0, playerPos));`
        // `cm.shiftPlayerPosition(playerPos);`

        // This is complex. If Player 1 (index 0) becomes Player 3 (index 2) in the turn order...
        // The `PlayerPosition` enum is usually static (P1..P7).
        // But `playerOrder` array changes.
        // If `PlayerPosition` refers to the INDEX in `playerOrder`, then when `playerOrder` rotates, the mapping changes.

        // Let's assume `PlayerPosition` is index in `playerOrder`.
        // If I rotate `playerOrder`, I must update `roles` array because `RolePosition.PLAYER_1` (index 0) now refers to a different player?
        // Actually, if `roles` stores "This role belongs to Player at Index 0", and I rotate players so Player X is now at Index 0...
        // No, if Player X has King. Player X is at Index 3.
        // I rotate so Player X is at Index 0.
        // The King role should now point to Index 0 (PLAYER_1).

        const currentPosVal = rolePos as number;
        // Logic from original file:
        // ((character - offset + this.playerCount - amount) % this.playerCount) + offset;
        // character (e.g. 3) - offset (3) = 0.
        // 0 + count - amount (shift) % count.

        this.roles[i] = ((currentPosVal - offset + this.playerCount - amount) % this.playerCount) + offset;
      }
    });
  }
}
