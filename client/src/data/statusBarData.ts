import {
  CharacterChoosingStateType as CCST,
  ClientGameState,
  GameProgress,
  GamePhase,
  ClientTurnState,
} from 'citadels-common';

import {
  StatusBarData,
} from '../types/gameTypes';

const INVALID_STATE: StatusBarData = {
  type: 'ERROR',
  message: 'ui.game.messages.errors.invalid_state',
};

const END_OF_GAME: StatusBarData = {
  type: 'NORMAL',
  message: 'ui.game.messages.end',
};

// Maps for Drafting Phase messages
const MESSAGES_CHOOSE_CHARACTERS = {
  [CCST.INITIAL]: 'initial',
  [CCST.PUT_ASIDE_FACE_UP]: 'put_aside_face_up',
  [CCST.PUT_ASIDE_FACE_DOWN]: 'put_aside_face_down',
  [CCST.PUT_ASIDE_FACE_DOWN_UP]: 'put_aside_face_down',
  [CCST.CHOOSE_CHARACTER]: 'choose_character',
  [CCST.DONE]: 'done',
};

export function getStatusBarData(state: ClientGameState): StatusBarData {
  switch (state.progress) {
    case GameProgress.IN_GAME:
    {
      const currentPlayer = state.board.playerOrder[state.board.currentPlayer]; // For drafting
      // For Planning, we don't have a single "current player".

      const isCurrentPlayerSelf = currentPlayer === state.self;
      const currentPlayerName = state.players.get(currentPlayer)?.username ?? '';

      switch (state.board.gamePhase) {
        case GamePhase.INITIAL:
          return {
            type: 'NORMAL',
            message: 'ui.game.messages.welcome',
          };

        case GamePhase.CHOOSE_CHARACTERS:
        {
          // @ts-ignore
          const message = MESSAGES_CHOOSE_CHARACTERS[state.board.characters.state.type];
          if (message !== undefined) {
             // Adapt message key logic if needed, or update i18n
             // For now assume keys exist or will fallback
            return {
              type: isCurrentPlayerSelf ? 'HIGHLIGHTED' : 'NORMAL',
              message: `ui.game.messages.choose_characters.${message}`, // Legacy keys
              args: [currentPlayerName],
            };
          }
          break;
        }

        case GamePhase.PLANNING:
           return {
               type: 'HIGHLIGHTED',
               message: 'Planning Phase: Submit your orders',
               actions: [] // Actions are in the Planning Component
           };

        case GamePhase.RESOLUTION:
           return {
               type: 'NORMAL',
               message: 'Resolution Phase: Watch the action unfold',
               actions: []
           };

        default:
      }
      return INVALID_STATE;
    }

    case GameProgress.FINISHED:
      return END_OF_GAME;

    default:
  }

  return INVALID_STATE;
}

export default getStatusBarData;
