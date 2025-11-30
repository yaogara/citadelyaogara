/**
 * Findings from code scan:
 * - Authoritative game state contracts (ClientGameState, Move, GameSetupData, enums) live in `common/src/index.ts` and are reused on both client and server via the `citadels-common` package.
 * - The current React UI kept its own local-only game flow in earlier iterations; this file is the socket-backed bridge to the authoritative game engine.
 * - UI components expect arrays of players/characters/districts, while the backend emits `Map`-based structures inside `ClientGameState` over Socket.IO events such as `update game state`, `add player`, and `left room`.
 * - The server socket API (see `server/src/socket/server.ts`) exposes events: `create room`, `join room`, `start game`, and `make move`, returning `ClientGameState` snapshots and pushing updates via `update game state`.
 */
import { io, Socket } from 'socket.io-client';
import type {
  ClientGameState,
  GameSetupData,
  Move,
  PlayerId,
  RoomId,
} from 'citadels-common';

type SerializedClientGameState = Omit<ClientGameState, 'players' | 'board'> & {
  players: [PlayerId, ClientGameState['players'] extends Map<PlayerId, infer V> ? V : never][];
  board?: ClientGameState['board'] & {
    players: [
      PlayerId,
      ClientGameState['board'] extends { players: Map<PlayerId, infer V> }
        ? V
        : never,
    ][];
  };
};

function inflateClientGameState(state: SerializedClientGameState | null): ClientGameState | null {
  if (!state) return null;

  const players = new Map(state.players);
  const board = state.board
    ? { ...state.board, players: new Map(state.board.players) }
    : undefined;

  return {
    ...state,
    players,
    board: board as ClientGameState['board'],
  } as ClientGameState;
}

class SocketGameService {
  private socket: Socket | null = null;

  private listeners = new Set<(state: ClientGameState) => void>();

  private latestState: ClientGameState | null = null;

  private roomId?: RoomId;

  private playerId?: PlayerId;

  private ensureSocket() {
    if (!this.socket) {
      this.socket = io({ path: '/s/' });
      this.registerSocketEvents();
    }
  }

  private registerSocketEvents() {
    if (!this.socket) return;

    this.socket.on('update game state', (payload: SerializedClientGameState) => {
      const state = inflateClientGameState(payload);
      if (state) this.pushState(state);
    });

    this.socket.on('add player', (player) => {
      if (!this.latestState) return;
      const players = new Map(this.latestState.players);
      players.set(player.id, player);
      this.pushState({ ...this.latestState, players });
    });

    this.socket.on('left room', (playerId: PlayerId) => {
      if (!this.latestState) return;
      const players = new Map(this.latestState.players);
      const player = players.get(playerId);
      if (player) {
        players.set(playerId, { ...player, online: false });
        this.pushState({ ...this.latestState, players });
      }
    });
  }

  private pushState(state: ClientGameState) {
    this.latestState = state;
    this.listeners.forEach((listener) => listener(state));
  }

  disconnect() {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
    this.latestState = null;
    this.listeners.clear();
  }

  onStateUpdate(callback: (state: ClientGameState) => void) {
    this.listeners.add(callback);
    if (this.latestState) callback(this.latestState);
    return () => this.listeners.delete(callback);
  }

  async createRoom(): Promise<RoomId> {
    this.ensureSocket();
    return new Promise((resolve, reject) => {
      this.socket?.emit('create room', (roomId: RoomId) => {
        if (!roomId) {
          reject(new Error('Failed to create room'));
          return;
        }
        this.roomId = roomId;
        resolve(roomId);
      });
    });
  }

  async joinRoom(roomId: RoomId, playerId: PlayerId | undefined, username: string) {
    this.ensureSocket();
    return new Promise<ClientGameState | null>((resolve, reject) => {
      this.socket?.emit(
        'join room',
        roomId,
        playerId,
        username,
        (payload: SerializedClientGameState | null) => {
          const state = inflateClientGameState(payload);
          if (!state) {
            reject(new Error('Room is closed or not found'));
            return;
          }
          this.roomId = roomId;
          this.playerId = state.self;
          this.pushState(state);
          resolve(state);
        },
      );
    });
  }

  async startGame(setup: GameSetupData) {
    this.ensureSocket();
    return new Promise<void>((resolve, reject) => {
      this.socket?.emit('start game', setup, (result: { status: string; message?: string }) => {
        if (result?.status === 'ok') {
          resolve();
        } else {
          reject(new Error(result?.message || 'Unable to start game'));
        }
      });
    });
  }

  async sendMove(move: Move) {
    this.ensureSocket();
    return new Promise<void>((resolve, reject) => {
      this.socket?.emit('make move', move, (result: { status: string; message?: string }) => {
        if (result?.status === 'ok') {
          resolve();
        } else {
          reject(new Error(result?.message || 'Move rejected by server'));
        }
      });
    });
  }
}

const gameService = new SocketGameService();
export default gameService;
