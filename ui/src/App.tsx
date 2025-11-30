import React, { useEffect, useMemo, useState } from 'react';
import {
  CharacterChoosingStateType as CCST,
  CharacterType,
  ClientGameState,
  ClientTurnState,
  GamePhase,
  GameProgress,
  GameSetupData,
  Move,
  MoveType,
  PlayerId,
  PlayerPosition,
  PlayerRole,
  DistrictId,
} from 'citadels-common';
import gameService from './services/gameService';
import { CHARACTER_BY_ID, getDistrictMeta } from './constants';
import { CharacterCard, DistrictCard } from './components/CardComponents';
import getStatusBarData from './services/statusBar';
import { Action } from './types';

function formatPlayerName(state: ClientGameState, id: PlayerId | undefined) {
  if (!id) return 'Unknown';
  const player = state.players.get(id);
  return player ? player.username : id;
}

export default function App() {
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState<PlayerId | undefined>(undefined);
  const [clientState, setClientState] = useState<ClientGameState | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCards, setSelectedCards] = useState<DistrictId[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [busyMove, setBusyMove] = useState<MoveType | null>(null);

  useEffect(() => {
    const storedPlayerId = window.localStorage.getItem('citadels-player-id');
    const storedName = window.localStorage.getItem('citadels-player-name');
    if (storedPlayerId) setPlayerId(storedPlayerId as PlayerId);
    if (storedName) setPlayerName(storedName);
  }, []);

  useEffect(() => {
    if (playerId) window.localStorage.setItem('citadels-player-id', playerId);
  }, [playerId]);

  useEffect(() => {
    if (playerName) window.localStorage.setItem('citadels-player-name', playerName);
  }, [playerName]);

  useEffect(() => {
    const unsubscribe = gameService.onStateUpdate((state) => {
      setClientState(state);
      setPlayerId(state.self);
      setStatusMessage('Synced game state from server');
      if (state.board?.turnState !== ClientTurnState.MAGICIAN_DISCARD_CARDS) {
        setSelectedCards([]);
      }
    });
    return () => {
      unsubscribe();
      gameService.disconnect();
    };
  }, []);

  const handleCreateRoom = async () => {
    try {
      setConnecting(true);
      const newRoomId = await gameService.createRoom();
      setRoomId(newRoomId);
      setStatusMessage(`Created room ${newRoomId}. Share it with friends.`);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setConnecting(false);
    }
  };

  const handleJoinRoom = async () => {
    try {
      if (!roomId) {
        setErrorMessage('Enter a room ID to join');
        return;
      }
      setConnecting(true);
      const state = await gameService.joinRoom(roomId, playerId, playerName || '');
      setClientState(state);
      setStatusMessage(`Joined room ${roomId}`);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setConnecting(false);
    }
  };

  const handleStartGame = async () => {
    try {
      if (!clientState) {
        setErrorMessage('Join a room before starting a game');
        return;
      }
      const players = Array.from(clientState.players.values())
        .filter((player) => player.role === PlayerRole.PLAYER)
        .map((player) => player.id);
      const setup: GameSetupData = {
        players,
        completeCitySize: clientState.settings?.completeCitySize ?? 7,
      };
      await gameService.startGame(setup);
      setStatusMessage('Requested game start');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const sendMove = async (move: Move) => {
    try {
      setBusyMove(move.type);
      await gameService.sendMove(move);
      setStatusMessage(`Sent move ${MoveType[move.type]}`);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setBusyMove(null);
    }
  };

  const isCurrentPlayerSelf = useMemo(() => {
    if (!clientState?.board) return false;
    const currentPlayerId = clientState.board.playerOrder[clientState.board.currentPlayer];
    return clientState.self === currentPlayerId;
  }, [clientState]);

  const boardPlayers = clientState?.board ? Array.from(clientState.board.players.entries()) : [];
  const characters = clientState?.board?.characters;

  const statusBar = clientState && clientState.board
    ? getStatusBarData(clientState, selectedCards)
    : null;

  const killMode = isCurrentPlayerSelf && clientState?.board?.turnState === ClientTurnState.ASSASSIN_KILL;
  const robMode = isCurrentPlayerSelf && clientState?.board?.turnState === ClientTurnState.THIEF_ROB;
  const destroyMode = isCurrentPlayerSelf && clientState?.board?.turnState === ClientTurnState.WARLORD_DESTROY_DISTRICT;
  const buildMode = isCurrentPlayerSelf && clientState?.board?.turnState === ClientTurnState.BUILD_DISTRICT;
  const discardCardsMode = isCurrentPlayerSelf && clientState?.board?.turnState === ClientTurnState.MAGICIAN_DISCARD_CARDS;
  const labMode = isCurrentPlayerSelf && clientState?.board?.turnState === ClientTurnState.LABORATORY_DISCARD_CARD;
  const chooseCardMode = isCurrentPlayerSelf && clientState?.board?.turnState === ClientTurnState.CHOOSE_CARD;
  const putAsideMode = clientState?.board?.characters.state.type !== undefined
    && isCurrentPlayerSelf
    && [CCST.PUT_ASIDE_FACE_UP, CCST.PUT_ASIDE_FACE_DOWN, CCST.PUT_ASIDE_FACE_DOWN_UP].includes(clientState.board.characters.state.type);
  const exchangeHandMode = isCurrentPlayerSelf && clientState?.board?.turnState === ClientTurnState.MAGICIAN_EXCHANGE_HAND;

  const currentPlayerId = clientState?.board
    ? clientState.board.playerOrder[clientState.board.currentPlayer]
    : undefined;

  const handleCharacterSelect = async (index: number, characterId: number) => {
    if (!clientState) return;
    let move: Move = { type: MoveType.CHOOSE_CHARACTER, data: index };
    if (killMode) {
      move = { type: MoveType.ASSASSIN_KILL, data: characterId };
    } else if (robMode) {
      move = { type: MoveType.THIEF_ROB, data: characterId };
    }
    await sendMove(move);
  };

  const handleBuildCard = async (cardId: DistrictId) => {
    if (!buildMode) return;
    await sendMove({ type: MoveType.BUILD_DISTRICT, data: cardId });
  };

  const handleDiscardCard = (cardId: DistrictId) => {
    if (!discardCardsMode) return;
    setSelectedCards((prev) => {
      if (prev.includes(cardId)) return prev.filter((c) => c !== cardId);
      return [...prev, cardId];
    });
  };

  const handleLaboratory = async (cardId: DistrictId) => {
    if (!labMode) return;
    await sendMove({ type: MoveType.LABORATORY_DISCARD_CARD, data: cardId });
  };

  const handleDrawnCardChoice = async (cardId: DistrictId) => {
    if (!chooseCardMode) return;
    await sendMove({ type: MoveType.DRAW_CARDS, data: cardId });
  };

  const handleDestroyDistrict = async (player: PlayerId, district: DistrictId) => {
    if (!destroyMode || !clientState?.board) return;
    const index = clientState.board.playerOrder.indexOf(player);
    const position = (index + PlayerPosition.PLAYER_1) as PlayerPosition;
    await sendMove({ type: MoveType.WARLORD_DESTROY_DISTRICT, data: { player: position, card: district } });
  };

  const handleExchangeHand = async (player: PlayerId) => {
    if (!exchangeHandMode) return;
    await sendMove({ type: MoveType.MAGICIAN_EXCHANGE_HAND, data: player });
  };

  const handleAction = async (action: Action) => {
    await sendMove(action.move);
  };

  const renderPlayerBoard = (id: PlayerId, board: ClientGameState['board']['players'] extends Map<any, infer V> ? V : never) => {
    const isSelf = clientState?.self === id;
    const districts = board.city.map((cardId) => getDistrictMeta(cardId));
    const hand = board.hand.map((cardId) => getDistrictMeta(cardId));
    const tmpHand = board.tmpHand.map((cardId) => getDistrictMeta(cardId));
    return (
      <div key={id} className="border border-slate-800 rounded-lg bg-slate-900 p-3 space-y-2 shadow">
        <div className="flex justify-between items-center">
          <div className="font-semibold text-slate-100 flex items-center gap-2">
            <span className="text-sm uppercase tracking-wide">{formatPlayerName(clientState as ClientGameState, id)}</span>
            {clientState?.board?.playerOrder[0] === id && <span className="text-amber-400">👑</span>}
            {!board?.characters?.length && <span className="text-xs text-slate-500">(waiting for character)</span>}
          </div>
          <div className="text-sm text-slate-300 flex items-center gap-2">
            <span>Gold: {board.stash}</span>
            {exchangeHandMode && !isSelf && (
              <button
                type="button"
                className="px-2 py-1 rounded bg-blue-500 text-white text-xs"
                onClick={() => handleExchangeHand(id)}
              >
                Exchange hand
              </button>
            )}
          </div>
        </div>
        <div className="text-xs text-slate-400">City ({board.city.length}):</div>
        <div className="flex flex-wrap gap-2">
          {districts.map((card) => card && (
            <div
              key={card.id}
              className="relative"
              onClick={() => destroyMode && handleDestroyDistrict(id, card.id as DistrictId)}
            >
              <DistrictCard district={card} mini />
            </div>
          ))}
          {districts.length === 0 && <span className="text-slate-500">No districts built yet</span>}
        </div>
        {board.characters?.length > 0 && (
          <div className="text-xs text-slate-400">Characters: {board.characters.map((c) => CharacterType[c.id]).join(', ')}</div>
        )}
        {isSelf && (
          <div className="space-y-2">
            <div className="text-xs text-slate-400">Hand ({board.hand.filter(Boolean).length}):</div>
            <div className="flex gap-2 flex-wrap">
              {hand.map((card) => card && (
                <div
                  key={card.id}
                  onClick={() => {
                    if (buildMode) return handleBuildCard(card.id as DistrictId);
                    if (discardCardsMode) return handleDiscardCard(card.id as DistrictId);
                    if (labMode) return handleLaboratory(card.id as DistrictId);
                    return undefined;
                  }}
                >
                  <DistrictCard district={card} mini canBuild={buildMode || discardCardsMode || labMode} />
                </div>
              ))}
              {hand.length === 0 && <span className="text-slate-500">No cards in hand</span>}
            </div>
            {tmpHand.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs text-amber-300">Choose from drawn cards:</div>
                <div className="flex gap-2 flex-wrap">
                  {tmpHand.map((card) => card && (
                    <div key={card.id} onClick={() => handleDrawnCardChoice(card.id as DistrictId)}>
                      <DistrictCard district={card} mini />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {discardCardsMode && selectedCards.length > 0 && (
              <div className="text-xs text-slate-400">Selected to discard: {selectedCards.join(', ')}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCharacters = () => {
    if (!characters) return null;
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-200 mb-2">Callable characters</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {characters.callable.map((character, index) => {
              const meta = CHARACTER_BY_ID[character.id - 1] || CHARACTER_BY_ID[character.id];
              if (!meta) return null;
              const disabled = !putAsideMode && !killMode && !robMode && characters.state.type !== CCST.CHOOSE_CHARACTER;
              return (
                <div key={character.id} onClick={() => !disabled && handleCharacterSelect(index, character.id)}>
                  <CharacterCard
                    character={meta}
                    disabled={disabled}
                    selected={characters.current === character.id}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-200 mb-2">Aside</div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {characters.aside.map((character, index) => {
              const meta = CHARACTER_BY_ID[character.id - 1] || CHARACTER_BY_ID[character.id];
              if (!meta) return null;
              return (
                <CharacterCard
                  key={`${character.id}-${index}`}
                  character={meta}
                  hidden
                />
              );
            })}
            {characters.aside.length === 0 && <span className="text-slate-500">No characters aside</span>}
          </div>
        </div>
      </div>
    );
  };

  const renderLobby = () => {
    const playersList = clientState ? Array.from(clientState.players.values()) : [];
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">Lobby</h2>
        {playersList.length === 0 && <p className="text-slate-400">No players yet. Create or join a room.</p>}
        {playersList.length > 0 && (
          <ul className="space-y-1">
            {playersList.map((player) => (
              <li key={player.id} className="flex items-center justify-between text-slate-200 bg-slate-900 border border-slate-800 rounded px-3 py-2">
                <span>
                  <strong>{player.username}</strong> ({player.id}) – {player.manager ? 'Manager' : 'Player'} – {player.online ? 'Online' : 'Offline'} – Role: {PlayerRole[player.role]}
                </span>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="px-3 py-2 rounded bg-amber-500 text-slate-900 font-semibold disabled:opacity-50"
          onClick={handleStartGame}
          disabled={!playersList.length || (clientState?.progress ?? GameProgress.IN_LOBBY) !== GameProgress.IN_LOBBY}
        >
          Start game with listed players
        </button>
      </section>
    );
  };

  const renderStatusBar = () => {
    if (!statusBar) return null;
    const tone = statusBar.type === 'HIGHLIGHTED' ? 'bg-amber-500 text-slate-900' : statusBar.type === 'ERROR' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-100';
    return (
      <div className={`mt-4 p-3 rounded ${tone} flex flex-wrap items-center gap-2`}>
        <div className="font-semibold mr-auto">{statusBar.message}</div>
        {statusBar.actions?.map((action) => (
          <button
            key={`${action.title}-${JSON.stringify(action.move)}`}
            type="button"
            className="px-3 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-50"
            onClick={() => handleAction(action)}
            disabled={!!busyMove}
          >
            {action.title}
          </button>
        ))}
      </div>
    );
  };

  const renderBoard = () => {
    if (!clientState?.board) return null;
    return (
      <section className="space-y-4">
        <div className="grid md:grid-cols-3 gap-3">
          <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
            <div className="text-xs uppercase tracking-wide text-slate-400">Progress</div>
            <div className="text-slate-100 font-semibold">{GameProgress[clientState.progress]}</div>
            <div className="text-slate-300">Phase: {GamePhase[clientState.board.gamePhase]}</div>
            <div className="text-slate-300">Turn state: {ClientTurnState[clientState.board.turnState]}</div>
            <div className="text-slate-300">Active player: {formatPlayerName(clientState, currentPlayerId)}</div>
          </div>
          <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
            <div className="text-xs uppercase tracking-wide text-slate-400">Order</div>
            <div className="text-slate-200 text-sm">{clientState.board.playerOrder.join(', ')}</div>
            <div className="text-xs text-slate-400">Current player index: {clientState.board.currentPlayer}</div>
          </div>
          <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
            <div className="text-xs uppercase tracking-wide text-slate-400">Characters</div>
            <div className="text-slate-200 text-sm">Callable: {clientState.board.characters.callable.map((c) => c.id).join(', ')}</div>
            <div className="text-slate-200 text-sm">Aside: {clientState.board.characters.aside.map((c) => c.id).join(', ')}</div>
          </div>
        </div>
        {renderCharacters()}
        <div className="grid lg:grid-cols-2 gap-3">
          {boardPlayers.map(([id, board]) => renderPlayerBoard(id, board))}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Citadels</h1>
            <p className="text-slate-400 text-sm">React UI connected to the authoritative Citadels server.</p>
          </div>
          <div className="flex gap-2 items-center text-sm">
            {clientState && <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">Room: {roomId || 'N/A'}</span>}
            {playerId && <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">You: {playerName || playerId}</span>}
            {clientState && <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">Players online: {Array.from(clientState.players.values()).filter((p) => p.online).length}</span>}
          </div>
        </header>

        <section className="p-4 rounded bg-slate-900 border border-slate-800 space-y-3">
          <h2 className="text-lg font-semibold">Room & Player</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="space-y-1 text-sm">
              <div>Player name</div>
              <input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your nickname"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <div>Room ID</div>
              <input
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Room to join"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleCreateRoom} className="px-3 py-2 rounded bg-emerald-500 text-slate-900 font-semibold disabled:opacity-50" disabled={connecting}>
              Create room
            </button>
            <button type="button" onClick={handleJoinRoom} className="px-3 py-2 rounded bg-blue-500 text-white font-semibold disabled:opacity-50" disabled={connecting}>
              Join room
            </button>
          </div>
        </section>

        {clientState && clientState.progress === GameProgress.IN_LOBBY && (
          <div className="p-4 rounded bg-slate-900 border border-slate-800">
            {renderLobby()}
          </div>
        )}

        {clientState && clientState.progress !== GameProgress.IN_LOBBY && (
          <div className="p-4 rounded bg-slate-900 border border-slate-800 space-y-4">
            {renderBoard()}
            {renderStatusBar()}
          </div>
        )}

        {!clientState && (
          <div className="text-slate-500 text-sm">Join or create a room to begin.</div>
        )}

        {statusMessage && <div className="text-emerald-400 text-sm">{statusMessage}</div>}
        {errorMessage && <div className="text-red-400 text-sm">{errorMessage}</div>}
      </div>
    </div>
  );
}
