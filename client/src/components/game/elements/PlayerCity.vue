<template>
  <div class="player-city card bg-secondary shadow-sm" style="min-width: 9em;">
    <div class="card-body p-2 d-flex flex-column gap-2">
      <div class="card player-header bg-dark text-light shadow-sm">
        <div class="card-body py-2">
          <div class="header-row d-flex align-items-center justify-content-between flex-wrap">
            <div class="name-row d-flex align-items-center flex-wrap">
              <span
                class="player-name badge rounded-pill px-3 py-2"
                :class="{ 'bg-primary': isCurrentPlayer, 'bg-secondary': !isCurrentPlayer }"
              >
                {{ username }}
              </span>
              <div class="chip-row">
                <span v-if="board.crown" class="pill-chip crown-chip">
                  <emoji emoji="👑" class="mr-1"></emoji>
                  <span>{{ t('ui.game.crown') || 'Crown' }}</span>
                </span>
                <span class="pill-chip coin-chip">
                  <emoji emoji="🪙" class="mr-1"></emoji>
                  <span>{{ board.stash }}</span>
                </span>
                <button
                  type="button"
                  class="pill-chip action-chip btn btn-sm"
                  :class="{ 'btn-primary': exchangeHandMode, 'btn-outline-light text-light': !exchangeHandMode }"
                  :disabled="!exchangeHandMode"
                  @click="exchangeHand()"
                  v-tooltip="exchangeHandMode ? t('ui.game.actions.choose_hand') : ''"
                >
                  <emoji emoji="🃏" class="mr-1"></emoji>
                  <span>{{ board.hand.length }}</span>
                </button>
              </div>
            </div>
          </div>
          <CharactersList v-if="gameProgress === 'IN_GAME'" :characters="board.characters" class="mt-2" />
        </div>
      </div>

      <div class="card city-grid bg-light shadow-sm">
        <div class="card-body py-3 d-flex justify-content-center flex-wrap overflow-auto">
          <div
            v-for="id, i in board.city"
            :key="i"
            class="city-slot"
            :class="{ 'is-selectable': canDestroy(id) }"
            @click="chooseCardDestroy(id)"
          >
            <DistrictCard
              :district-id="id"
              :disabled="destroyMode && !canDestroy(id)"
              :selectable="canDestroy(id)"
              small
            />
          </div>
        </div>
      </div>

      <PlayerScore v-if="gameProgress === 'FINISHED'" :score="board.score" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapGetters } from 'vuex';
import { Move, MoveType, DistrictId } from 'citadels-common';
import { store } from '../../../store';
import CharactersList from './CharactersList.vue';
import DistrictCard from './DistrictCard.vue';
import PlayerScore from './PlayerScore.vue';
import { t } from '../../../i18n';

export default defineComponent({
  name: 'PlayerCity',
  components: {
    DistrictCard,
    CharactersList,
    PlayerScore,
  },
  props: {
    playerId: {
      type: String,
      required: true,
    },
    board: {
      required: true,
    },
    destroyMode: {
      type: Boolean,
      default: false,
    },
    exchangeHandMode: {
      type: Boolean,
      default: false,
    },
    stash: {
      type: Number,
      default: 0,
    },
  },
  computed: {
    ...mapGetters([
      'getPlayerFromId',
      'gameProgress',
      'currentPlayerId',
    ]),
    username() {
      return this.getPlayerFromId(this.playerId)?.username;
    },
    isCurrentPlayer() {
      return this.currentPlayerId === this.playerId;
    },
  },
  methods: {
    t,
    canDestroy(name: DistrictId): boolean {
      if (!this.destroyMode) return false;
      const cost = store.getters.getDistrictDestroyPrice(this.playerId, name);
      return cost >= 0 && cost <= this.stash;
    },
    async chooseCardDestroy(name: DistrictId) {
      if (!this.canDestroy(name)) return;

      try {
        const move: Move = {
          type: MoveType.WARLORD_DESTROY_DISTRICT,
          data: {
            player: store.getters.getPlayerPosition(this.playerId),
            card: name,
          },
        };
        await store.dispatch('sendMove', move);
      } catch (error) {
        console.log('error when sending move', error);
      }
    },
    async exchangeHand() {
      if (!this.exchangeHandMode) return;

      try {
        const move: Move = {
          type: MoveType.MAGICIAN_EXCHANGE_HAND,
          data: store.getters.getPlayerPosition(this.playerId),
        };
        await store.dispatch('sendMove', move);
      } catch (error) {
        console.log('error when sending move', error);
      }
    },
  },
});
</script>

<style scoped lang="scss">
.player-city {
  border: 0;
}

.player-header {
  border: 0;
}

.header-row,
.name-row {
  gap: 0.5rem;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pill-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
  font-weight: 600;
}

.crown-chip {
  background: rgba(220, 53, 69, 0.2);
  border-color: rgba(220, 53, 69, 0.4);
}

.coin-chip {
  background: rgba(255, 193, 7, 0.1);
  border-color: rgba(255, 193, 7, 0.5);
}

.action-chip {
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2.25rem;
}

.city-grid {
  border: 0;
}

.city-grid .card-body {
  gap: 0.75rem;
}

.city-slot {
  flex: 0 1 8rem;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.35rem;
  border-radius: 0.5rem;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.city-slot.is-selectable {
  cursor: pointer;
  box-shadow: 0 0.35rem 0.7rem rgba(0, 0, 0, 0.15);
}

.city-slot.is-selectable:hover {
  transform: translateY(-2px);
}
</style>
