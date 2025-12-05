<template>
  <div class="players-list">
    <h3 class="section-title">{{ t('ui.lobby.players') }}</h3>
    <ul class="players-list-items">
      <li class="player-item self">
        <span class="player-name">{{ self.username }}</span>
        <div class="player-badges">
          <span class="badge badge-you">{{ t('ui.lobby.you') }}</span>
          <span v-if="self.manager" class="badge badge-manager">{{ t('ui.lobby.manager') }}</span>
        </div>
      </li>
      <li
        class="player-item"
        :class="{ 'offline': !player.online }"
        v-for="(player) in otherPlayers"
        :key="player.id"
      >
        <span class="player-name">{{ player.username }}</span>
        <div class="player-badges">
          <span v-if="player.online" class="badge badge-online">{{ t('ui.lobby.online') }}</span>
          <span v-else class="badge badge-offline">{{ t('ui.lobby.offline') }}</span>
          <span v-if="player.manager" class="badge badge-manager">{{ t('ui.lobby.manager') }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapGetters } from 'vuex';
import { t } from '../../../i18n';

export default defineComponent({
  name: 'PlayersList',
  computed: {
    ...mapGetters([
      'gameState',
    ]),
    otherPlayers() {
      return Array.from(this.gameState.players.values())
        .filter((player) => player.id !== this.gameState.self);
    },
    self() {
      return this.gameState.players.get(this.gameState.self);
    },
  },
  methods: {
    t,
  },
});
</script>

<style lang="scss" scoped>
.players-list {
  display: flex;
  flex-direction: column;
}

.section-title {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.9);
}

.players-list-items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.player-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  &.self {
    border-color: rgba(0, 191, 255, 0.3);
    background: rgba(0, 191, 255, 0.1);
    box-shadow: 0 0 10px rgba(0, 191, 255, 0.2);
  }
  
  &.offline {
    opacity: 0.6;
  }
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.player-name {
  font-weight: 500;
  color: white;
  font-size: 1rem;
}

.player-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.35rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.badge-you {
  background: linear-gradient(90deg, #0096ff 0%, #00bfff 50%, #00e5ff 100%);
  color: white;
  box-shadow: 0 0 10px rgba(0, 191, 255, 0.3);
}

.badge-online {
  background: rgba(76, 175, 80, 0.3);
  color: #4caf50;
  border: 1px solid #4caf50;
}

.badge-offline {
  background: rgba(158, 158, 158, 0.3);
  color: #9e9e9e;
  border: 1px solid #9e9e9e;
}

.badge-manager {
  background: linear-gradient(90deg, #ff6b35 0%, #ffa500 50%, #ffd700 100%);
  color: white;
  box-shadow: 0 0 10px rgba(255, 107, 53, 0.3);
}
</style>