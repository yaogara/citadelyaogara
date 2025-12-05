<template>
  <div class="player-hand card bg-secondary shadow-sm w-100">
    <div class="card-body p-2">
      <div class="d-flex justify-content-end flex-wrap align-items-center chip-row mb-2">
        <span v-if="board.crown" class="pill-chip crown-chip">
          <emoji emoji="👑" class="mr-1"></emoji>
          <span>{{ t('ui.game.crown') || 'Crown' }}</span>
        </span>
        <span class="pill-chip coin-chip">
          <emoji emoji="🪙" class="mr-1"></emoji>
          <span>{{ board.stash }}</span>
        </span>
      </div>

      <div class="hand-scroll d-flex align-items-stretch overflow-auto pb-2">
        <div
          class="hand-card"
          v-for="id, i in board.hand"
          :key="i"
          :class="{
            'is-focused': focusedCard === i,
            'is-selected': selectedCards[i],
            'is-disabled': showTmpHand || (buildMode && !canBuild(id)),
          }"
          @click="focusCard(i)"
        >
          <DistrictCard
            :district-id="id"
            :disabled="showTmpHand || (buildMode && !canBuild(id))"
            :selectable="canBuild(id) || discardCardsMode || laboratoryMode"
            v-model:selected="selectedCards[i]"
          />
        </div>
      </div>

      <div v-if="showTmpHand" class="temp-hand card bg-light shadow-sm mt-2">
        <div class="card-body py-2 d-flex justify-content-start overflow-auto">
          <DistrictCard
            v-for="id, i in board.tmpHand"
            :key="i"
            :district-id="id"
            class="mr-2"
            @click="chooseCard(id)"
            :selectable="showTmpHand"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Move, MoveType, DistrictId } from 'citadels-common';
import { store } from '../../../store';
import DistrictCard from './DistrictCard.vue';
import { t } from '../../../i18n';

export default defineComponent({
  name: 'PlayerHand',
  components: {
    DistrictCard,
  },
  props: {
    board: {
      required: true,
    },
    buildMode: {
      type: Boolean,
      default: false,
    },
    discardCardsMode: {
      type: Boolean,
      default: false,
    },
    laboratoryMode: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      selectedCards: [] as boolean[],
      focusedCard: null as number | null,
    };
  },
  computed: {
    showTmpHand() {
      return this.board.tmpHand.length > 0;
    },
  },
  methods: {
    t,
    canBuild(name: DistrictId): boolean {
      if (!this.buildMode) return false;
      return !this.board.city.includes(name)
        && store.getters.getDistrictFromId(name).cost <= this.board.stash;
    },
    async chooseCard(name: DistrictId) {
      try {
        const move: Move = { type: MoveType.DRAW_CARDS, data: name };
        await store.dispatch('sendMove', move);
      } catch (error) {
        console.log('error when sending move', error);
      }
    },
    async chooseCardBuild(name: DistrictId) {
      if (!this.canBuild(name)) return;

      try {
        const move: Move = { type: MoveType.BUILD_DISTRICT, data: name };
        await store.dispatch('sendMove', move);
      } catch (error) {
        console.log('error when sending move', error);
      }
    },
    async chooseCardLaboratory(name: DistrictId) {
      try {
        const move: Move = { type: MoveType.LABORATORY_DISCARD_CARD, data: name };
        await store.dispatch('sendMove', move);
      } catch (error) {
        console.log('error when sending move', error);
      }
    },
    focusCard(index: number) {
      this.focusedCard = this.focusedCard === index ? null : index;
    },
  },
  watch: {
    board: {
      handler(newBoard, oldBoard) {
        if (newBoard.hand !== oldBoard.hand) {
          this.selectedCards = [];
          this.focusedCard = null;
        }
      },
      deep: true,
    },
    selectedCards: {
      handler(val) {
        const cards: DistrictId[] = [];
        val.forEach((isSelected, index) => {
          if (isSelected) {
            const card = this.board.hand[index];
            if (card !== undefined) cards.push(card);
          }
        });

        store.commit('setSelectedCards', { cards });

        if (cards.length > 0) {
          if (this.buildMode) {
            this.chooseCardBuild(cards[0]);
            this.selectedCards = [];
          } else if (this.laboratoryMode) {
            this.chooseCardLaboratory(cards[0]);
            this.selectedCards = [];
          }
        }
      },
      deep: true,
    },
  },
});
</script>

<style lang="scss" scoped>
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
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
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

.hand-scroll {
  gap: 0.75rem;
  scrollbar-width: thin;
}

.hand-card {
  flex: 0 0 7.5rem;
  display: flex;
  justify-content: center;
  align-items: stretch;
  padding: 0.35rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0.35rem 0.7rem rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}

.hand-card.is-focused {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.16);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.2);
}

.hand-card.is-selected {
  border: 1px solid rgba(0, 123, 255, 0.5);
  box-shadow: 0 0.6rem 1.1rem rgba(0, 123, 255, 0.25);
}

.hand-card.is-disabled {
  opacity: 0.7;
}

.temp-hand .card-body {
  gap: 0.5rem;
}
</style>

