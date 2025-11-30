import {
  CharacterChoosingStateType as CCST,
  CharacterType,
  ClientGameState,
  ClientTurnState,
  GamePhase,
  GameProgress,
  MoveType,
} from 'citadels-common';
import { Action, StatusBarData } from '../types';

function getActions(
  turnState: ClientTurnState,
  character: CharacterType,
  extraData: ClientGameState['board']['currentPlayerExtraData'],
  player: ClientGameState['board']['players'] extends Map<any, infer V> ? V : never,
  selectedCards: string[] = [],
): Action[] {
  const actions: Action[] = [];

  switch (turnState) {
    case ClientTurnState.TAKE_RESOURCES:
    case ClientTurnState.CHOOSE_ACTION:
      if (!extraData.hasUsedLaboratory && player.city.includes('laboratory') && player.hand.length >= 1) {
        actions.push({ title: 'laboratory_discard_card', move: { type: MoveType.LABORATORY_DISCARD_CARD } });
      }
      if (!extraData.hasUsedSmithy && player.city.includes('smithy') && player.stash >= 2) {
        actions.push({ title: 'smithy_draw_cards', move: { type: MoveType.SMITHY_DRAW_CARDS } });
      }
      break;
    default:
      break;
  }

  switch (turnState) {
    case ClientTurnState.TAKE_RESOURCES:
    case ClientTurnState.CHOOSE_ACTION:
      if (extraData.canTakeEarnings && extraData.earningsValue > 0) {
        actions.push({ title: 'take_gold_earnings', args: [extraData.earningsValue.toString()], move: { type: MoveType.TAKE_GOLD_EARNINGS } });
      }
      if (extraData.canDoSpecialAction) {
        switch (character) {
          case CharacterType.ASSASSIN:
            actions.push({ title: 'assassin_kill', move: { type: MoveType.ASSASSIN_KILL } });
            break;
          case CharacterType.THIEF:
            actions.push({ title: 'thief_rob', move: { type: MoveType.THIEF_ROB } });
            break;
          case CharacterType.MAGICIAN:
            actions.push({ title: 'magician_exchange_hand', move: { type: MoveType.MAGICIAN_EXCHANGE_HAND } });
            actions.push({ title: 'magician_discard_cards', move: { type: MoveType.MAGICIAN_DISCARD_CARDS, data: selectedCards } });
            break;
          case CharacterType.WARLORD:
            actions.push({ title: 'warlord_destroy_district', move: { type: MoveType.WARLORD_DESTROY_DISTRICT } });
            break;
          default:
            break;
        }
      }
      if (turnState === ClientTurnState.TAKE_RESOURCES) {
        actions.push({ title: 'take_gold', move: { type: MoveType.TAKE_GOLD } });
        actions.push({ title: 'draw_cards', move: { type: MoveType.DRAW_CARDS } });
      } else {
        if (extraData.districtsToBuild > 0) {
          actions.push({ title: 'build_district', move: { type: MoveType.BUILD_DISTRICT } });
        }
        actions.push({ title: 'finish_turn', move: { type: MoveType.FINISH_TURN } });
      }
      break;
    case ClientTurnState.ASSASSIN_KILL:
    case ClientTurnState.THIEF_ROB:
    case ClientTurnState.MAGICIAN_EXCHANGE_HAND:
    case ClientTurnState.WARLORD_DESTROY_DISTRICT:
    case ClientTurnState.BUILD_DISTRICT:
      actions.push({ title: 'cancel', move: { type: MoveType.DECLINE } });
      break;
    case ClientTurnState.MAGICIAN_DISCARD_CARDS:
      actions.push({ title: 'confirm', move: { type: MoveType.MAGICIAN_DISCARD_CARDS, data: selectedCards } });
      actions.push({ title: 'cancel', move: { type: MoveType.DECLINE } });
      break;
    case ClientTurnState.MERCHANT_TAKE_1_GOLD:
      actions.push({ title: 'accept', move: { type: MoveType.MERCHANT_TAKE_1_GOLD } });
      actions.push({ title: 'decline', move: { type: MoveType.DECLINE } });
      break;
    case ClientTurnState.ARCHITECT_DRAW_2_CARDS:
      actions.push({ title: 'accept', move: { type: MoveType.ARCHITECT_DRAW_2_CARDS } });
      actions.push({ title: 'decline', move: { type: MoveType.DECLINE } });
      break;
    case ClientTurnState.GRAVEYARD_RECOVER_DISTRICT:
      actions.push({ title: 'graveyard_recover_district', move: { type: MoveType.GRAVEYARD_RECOVER_DISTRICT } });
      actions.push({ title: 'decline', move: { type: MoveType.DECLINE } });
      break;
    case ClientTurnState.LABORATORY_DISCARD_CARD:
      actions.push({ title: 'cancel', move: { type: MoveType.DECLINE } });
      break;
    default:
  }
  return actions;
}

export function getStatusBarData(state: ClientGameState, selectedCards: string[]): StatusBarData {
  switch (state.progress) {
    case GameProgress.IN_GAME: {
      const currentPlayer = state.board.playerOrder[state.board.currentPlayer];
      const isCurrentPlayerSelf = currentPlayer === state.self;
      const currentPlayerName = state.players.get(currentPlayer)?.username ?? '';

      switch (state.board.gamePhase) {
        case GamePhase.INITIAL:
          return {
            type: 'NORMAL',
            message: 'Welcome to Citadels',
          };

        case GamePhase.CHOOSE_CHARACTERS: {
          const message = {
            [CCST.INITIAL]: 'Choose characters',
            [CCST.PUT_ASIDE_FACE_UP]: 'Put aside a character face up',
            [CCST.PUT_ASIDE_FACE_DOWN]: 'Put aside a character face down',
            [CCST.PUT_ASIDE_FACE_DOWN_UP]: 'Put aside a character face down',
            [CCST.CHOOSE_CHARACTER]: 'Choose your character',
            [CCST.DONE]: 'Waiting for other players',
          }[state.board.characters.state.type];

          if (message) {
            return {
              type: isCurrentPlayerSelf ? 'HIGHLIGHTED' : 'NORMAL',
              message,
              args: [currentPlayerName],
            };
          }
          break;
        }

        case GamePhase.DO_ACTIONS: {
          const currentCharacter = state.board.characters.current;
          if (!isCurrentPlayerSelf && state.board.turnState === ClientTurnState.GRAVEYARD_RECOVER_DISTRICT) {
            return {
              type: 'NORMAL',
              message: 'Waiting for graveyard recovery',
            };
          }

          const message = {
            [ClientTurnState.INITIAL]: 'Starting turn',
            [ClientTurnState.TAKE_RESOURCES]: 'Choose to take gold or draw',
            [ClientTurnState.CHOOSE_CARD]: 'Choose your card',
            [ClientTurnState.CHOOSE_ACTION]: 'Choose your action',
            [ClientTurnState.ASSASSIN_KILL]: 'Assassin: choose a target',
            [ClientTurnState.THIEF_ROB]: 'Thief: choose a target',
            [ClientTurnState.MAGICIAN_EXCHANGE_HAND]: 'Magician: exchange hands',
            [ClientTurnState.MAGICIAN_DISCARD_CARDS]: 'Magician: discard cards',
            [ClientTurnState.MERCHANT_TAKE_1_GOLD]: 'Merchant bonus',
            [ClientTurnState.ARCHITECT_DRAW_2_CARDS]: 'Architect bonus',
            [ClientTurnState.WARLORD_DESTROY_DISTRICT]: 'Warlord: destroy a district',
            [ClientTurnState.GRAVEYARD_RECOVER_DISTRICT]: 'Graveyard: recover district',
            [ClientTurnState.LABORATORY_DISCARD_CARD]: 'Laboratory: discard a card',
            [ClientTurnState.BUILD_DISTRICT]: 'Build a district',
            [ClientTurnState.DONE]: 'Turn complete',
          }[state.board.turnState];

          if (message) {
            const player = state.board.players.get(currentPlayer);
            return {
              type: isCurrentPlayerSelf ? 'HIGHLIGHTED' : 'NORMAL',
              message,
              actions: player
                ? getActions(state.board.turnState, currentCharacter, state.board.currentPlayerExtraData, player, selectedCards)
                : [],
            };
          }
          break;
        }
        default:
          break;
      }
      return { type: 'ERROR', message: 'Invalid state' };
    }
    case GameProgress.FINISHED:
      return { type: 'NORMAL', message: 'Game finished' };
    default:
      return { type: 'ERROR', message: 'Invalid state' };
  }
}

export default getStatusBarData;
