<template>
<div class="board-screen">
  <div class="board-layout">
    <section class="player-section">
      <div class="player-boards surface">
        <div
          class="player-column"
          v-for="[playerId, board] in playerBoards"
          :key="playerId"
        >
          <PlayerCity
            :player-id="playerId"
            :board="board"
            :destroy-mode="destroyMode"
            :stash="selfBoard.stash"
            :exchange-hand-mode="exchangeHandMode"
          />
        </div>
      </div>
      <div class="surface hand-panel">
        <PlayerHand
          :board="selfBoard"
          :build-mode="buildMode"
          :discard-cards-mode="discardCardsMode"
          :laboratory-mode="laboratoryMode"
        />
      </div>
    </section>
    <aside class="sidebar" aria-label="Character sections">
      <div
        v-if="gameProgress === 'IN_GAME'"
        class="section-card"
      >
        <div class="section-header">
          <span>{{ $t('ui.game.characters') }}</span>
        </div>
        <CharactersList
          class="section-body characters-panel"
          :title="''"
          :characters="charactersList.callable"
          :current="charactersList.current"
          :kill-mode="killMode"
          :rob-mode="robMode"
          :put-aside-mode="putAsideMode"
        />
      </div>
      <div
        v-if="gameProgress === 'IN_GAME' && showGraveyard"
        class="section-card"
      >
        <div class="section-header">
          <span>{{ $t('districts.graveyard.name') }}</span>
        </div>
        <div class="section-body graveyard-card">
          <DistrictCard
            class="align-self-center"
            :district-id="gameState.board.graveyard"
          />
        </div>
      </div>
      <div
        v-if="gameProgress === 'IN_GAME'"
        class="section-card"
      >
        <div class="section-header">
          <span>{{ $t('ui.game.characters') }}</span>
        </div>
        <CharactersList
          class="section-body characters-panel"
          :title="''"
          :characters="charactersList.aside"
        />
      </div>
    </aside>
  </div>
  <div
    class="action-bar"
    :class="statusBarClass"
  >
    <div
      class="status-message animate-text"
      ref="statusBarMessage"
    >
      <span
        v-for="c, i in [...$t(statusBar.message, statusBar.args)]"
        :key="i"
      >{{ c }}</span>
    </div>
    <div class="action-buttons">
      <button
        v-for="(action, i) in statusBar.actions"
        :key="i"
        type="button"
        class="btn btn-sm action-pill"
        @click="sendMove(action.move, $event.target)">
        {{ $t(`ui.game.actions.${action.title}`, action.args) }}
      </button>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import $ from 'jquery';
import { mapGetters } from 'vuex';
import { CharacterChoosingStateType as CCST, ClientTurnState, Move } from 'citadels-common';
import { store } from '../../store';
import CharactersList from './elements/CharactersList.vue';
import PlayerCity from './elements/PlayerCity.vue';
import PlayerHand from './elements/PlayerHand.vue';
import DistrictCard from './elements/DistrictCard.vue';
import { getStatusBarData } from '../../data/statusBarData';

export default defineComponent({
  components: {
    CharactersList,
    PlayerCity,
    PlayerHand,
    DistrictCard,
  },
  name: 'LobbyScreen',
  data() {
    return {
      startingGame: false,
    };
  },
  computed: {
    ...mapGetters([
      'getPlayerFromId',
      'gameSetupData',
      'gameState',
      'charactersList',
      'isCurrentPlayerSelf',
      'gameProgress',
    ]),
    self() {
      return this.gameState.self;
    },
    playerBoards() {
      const players = [...this.gameState.board.playerOrder];
      const cutOut = players.splice(players.indexOf(this.gameState.self));
      players.splice(0, 0, ...cutOut);
      return players.map((playerId) => (
        [playerId, {
          ...this.gameState.board.players.get(playerId),
          crown: this.gameState.board.playerOrder[0] === playerId,
        }]));
    },
    selfBoard() {
      return {
        ...this.gameState.board.players.get(this.self),
        crown: this.gameState.board.playerOrder[0] === this.self,
      };
    },
    statusBar() {
      return getStatusBarData(this.gameState);
    },
    statusBarClass() {
      switch (this.statusBar.type) {
        case 'HIGHLIGHTED':
          return 'action-bar--highlighted';
        case 'ERROR':
          return 'action-bar--error';
        default:
          return 'action-bar--normal';
      }
    },
    buildMode() {
      return this.isCurrentPlayerSelf
      && this.gameState.board.turnState === ClientTurnState.BUILD_DISTRICT;
    },
    destroyMode() {
      return this.isCurrentPlayerSelf
      && this.gameState.board.turnState === ClientTurnState.WARLORD_DESTROY_DISTRICT;
    },
    killMode() {
      return this.isCurrentPlayerSelf
      && this.gameState.board.turnState === ClientTurnState.ASSASSIN_KILL;
    },
    robMode() {
      return this.isCurrentPlayerSelf
      && this.gameState.board.turnState === ClientTurnState.THIEF_ROB;
    },
    putAsideMode() {
      if (!this.isCurrentPlayerSelf) return false;
      switch (this.gameState.board.characters.state.type) {
        case CCST.PUT_ASIDE_FACE_UP:
        case CCST.PUT_ASIDE_FACE_DOWN:
        case CCST.PUT_ASIDE_FACE_DOWN_UP:
          return true;
        default:
          return false;
      }
    },
    exchangeHandMode() {
      return this.isCurrentPlayerSelf
      && this.gameState.board.turnState === ClientTurnState.MAGICIAN_EXCHANGE_HAND;
    },
    discardCardsMode() {
      return this.isCurrentPlayerSelf
      && this.gameState.board.turnState === ClientTurnState.MAGICIAN_DISCARD_CARDS;
    },
    laboratoryMode() {
      return this.isCurrentPlayerSelf
      && this.gameState.board.turnState === ClientTurnState.LABORATORY_DISCARD_CARD;
    },
    showGraveyard() {
      return this.gameState.board.graveyard !== undefined;
    },
  },
  methods: {
    showConfirmationModal() {
      store.commit('prepareGameSetupConfirmation');
      $('#setupConfirmationModal').modal();
    },
    async startGame() {
      this.startingGame = true;
      try {
        await store.dispatch('startGame');
        this.startingGame = false;
      } catch (error) {
        console.error('error when starting game', error);
        this.startingGame = false;
      }
    },
    async sendMove(move: Move, target: HTMLElement) {
      target.blur();
      try {
        await store.dispatch('sendMove', move);
      } catch (error) {
        console.log('error when sending move', error);
      }
    },
  },
  beforeUnmount() {
    $('#setupConfirmationModal').modal('hide');
  },
  watch: {
    statusBar(oldVal, newVal) {
      if (oldVal.message !== newVal.message) {
        const el = this.$refs.statusBarMessage;
        el.classList.remove('animate-text');
        // eslint-disable-next-line no-void
        void el.offsetWidth;
        el.classList.add('animate-text');
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.board-screen {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
  background: #0f0f10;
  color: #f8f9fa;
}

.board-layout {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    'players'
    'sidebar';
  gap: 0.75rem;
  padding: 0.75rem;
  height: 100%;
  overflow: hidden;
}

@media (min-width: 992px) {
  .board-layout {
    grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
    grid-template-rows: 1fr;
    grid-template-areas: 'players sidebar';
  }
}

.player-section {
  grid-area: players;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
}

.player-boards {
  display: flex;
  gap: 0.75rem;
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  padding: 0.75rem;
}

.player-column {
  flex: 1 1 320px;
  min-width: 280px;
  display: flex;
}

.surface {
  background: linear-gradient(145deg, #1b1c1f, #111114);
  border-radius: 0.75rem;
  box-shadow: 0 0.75rem 1.5rem rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.hand-panel {
  padding: 0.5rem 0.75rem;
}

.sidebar {
  grid-area: sidebar;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
}

.section-card {
  background: #151518;
  border-radius: 0.75rem;
  padding: 0.75rem;
  box-shadow: 0 0.75rem 1.5rem rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.04);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 0.35rem;
}

.section-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.characters-panel :deep(.card) {
  background: transparent;
  border: none;
  box-shadow: none;
}

.characters-panel :deep(.list-group) {
  border-radius: 0.5rem;
}

.characters-panel :deep(.list-group-item) {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.05);
}

.graveyard-card {
  align-items: center;
  padding: 0.5rem 0;
}

.action-bar {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  z-index: 10;
}

.action-bar--normal {
  background: rgba(108, 117, 125, 0.35);
  box-shadow: 0 -0.5rem 1.25rem rgba(0, 0, 0, 0.4);
}

.action-bar--highlighted {
  background: rgba(0, 123, 255, 0.35);
  box-shadow: 0 -0.5rem 1.25rem rgba(0, 123, 255, 0.35);
}

.action-bar--error {
  background: rgba(220, 53, 69, 0.3);
  box-shadow: 0 -0.5rem 1.25rem rgba(220, 53, 69, 0.35);
}

.status-message {
  flex: 1 1 220px;
  font-weight: 700;
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: flex-end;
}

.action-pill {
  border-radius: 999px;
  padding: 0.35rem 0.95rem;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #f8f9fa;
  background: rgba(255, 255, 255, 0.06);
}

.action-bar--highlighted .action-pill {
  background: rgba(0, 123, 255, 0.2);
  border-color: rgba(0, 123, 255, 0.5);
}

.action-bar--error .action-pill {
  background: rgba(220, 53, 69, 0.18);
  border-color: rgba(220, 53, 69, 0.55);
}

@keyframes animate-text {
  0% {
    top: 1rem;
    opacity: 0;
  }
  80% {
    top: -0.1rem;
    opacity: 1;
  }
  100% {
    top: 0;
    opacity: 1;
  }
}

.animate-text {
  > span {
    position: relative;
    animation: animate-text .3s both;

    @for $i from 0 to 7 {
      &:nth-child(#{$i}n) {
        animation-delay: $i * .05s;
      }
    }
  }
}
</style>
