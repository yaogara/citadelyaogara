<template>
  <!-- Confirmation Modal (Bootstrap structure but styled) -->
  <div
    class="modal fade styled-modal"
    id="setupConfirmationModal"
    tabindex="-1"
    aria-labelledby="setupConfirmationModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content styled-modal-content">
        <div class="modal-header styled-modal-header">
          <h5 class="modal-title" id="setupConfirmationModalLabel">
            {{ t('ui.lobby.start_game') }}
          </h5>
          <button type="button" class="close styled-close" data-dismiss="modal" :aria-label="t('ui.cancel')">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body styled-modal-body">
          <div class="confirmation-section">
            <div class="confirmation-row">
              <span class="confirmation-label">{{ t('ui.lobby.settings.complete_city_size') }}</span>
              <span class="confirmation-value">{{ gameSetupData.completeCitySize }}</span>
            </div>
          </div>
          <div class="players-preview">
            <h3 class="players-preview-title">{{ t('ui.lobby.players') }}</h3>
            <ul class="players-preview-list">
              <li
                class="player-preview-item"
                :class="{ 'offline': !getPlayerFromId(playerId).online }"
                v-for="playerId in gameSetupData.players"
                :key="playerId"
              >
                <span class="player-name">{{ getPlayerFromId(playerId).username }}</span>
                <div class="player-badges">
                  <span
                    v-if="playerId === gameState.self"
                    class="badge badge-you"
                  >{{ t('ui.lobby.you') }}</span>
                  <span
                    v-if="!getPlayerFromId(playerId).online"
                    class="badge badge-offline"
                  >{{ t('ui.lobby.offline') }}</span>
                  <span
                    v-else
                    class="badge badge-online"
                  >{{ t('ui.lobby.online') }}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div class="modal-footer styled-modal-footer">
          <button type="button" class="cancel-btn" data-dismiss="modal">
            {{ t('ui.cancel') }}
          </button>
          <button
            type="button"
            class="confirm-btn"
            @click="startGame"
            :disabled="startingGame"
          >{{ startingGame ? 'STARTING...' : t('ui.confirm') }}</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Lobby Screen -->
  <div class="lobby-screen">
    <!-- Background -->
    <div class="background" :style="{ backgroundImage: `url(${backgroundImage})` }"></div>
    
    <div class="lobby-content">
      <div class="lobby-card">
        <h2 class="lobby-title">{{ t('ui.lobby.title') }}</h2>
        
        <div class="lobby-body">
          <!-- Settings Section (Manager Only) -->
          <div v-if="isManager" class="settings-section">
            <h3 class="section-title">{{ t('ui.lobby.settings.title') || 'Settings' }}</h3>
            <div class="form-group">
              <label for="completeCitySize" class="form-label">
                {{ t('ui.lobby.settings.complete_city_size') }}
              </label>
              <select 
                class="form-select" 
                id="completeCitySize" 
                v-model="completeCitySize"
              >
                <option :value="7">7</option>
                <option :value="8">8</option>
              </select>
            </div>
          </div>
          
          <!-- Players List -->
          <div class="players-section">
            <PlayersList />
          </div>
        </div>
        
        <!-- Footer with Start Game Button -->
        <div class="lobby-footer">
          <button
            class="start-game-btn"
            @click="showConfirmationModal"
            :disabled="validation.disabled"
          >
            {{ validation.message }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import $ from 'jquery';
import { mapGetters } from 'vuex';
import { PlayerRole } from 'citadels-common';
import PlayersList from './elements/PlayersList.vue';
import { store } from '../../store';
import { t } from '../../i18n';
import backgroundImage from '../../assets/background-night.png';

export default defineComponent({
  components: { PlayersList },
  name: 'LobbyScreen',
  data() {
    return {
      startingGame: false,
      completeCitySize: 7,
      backgroundImage,
    };
  },
  computed: {
    ...mapGetters([
      'getPlayerFromId',
      'gameSetupData',
      'gameState',
    ]),
    isManager() {
      return this.getPlayerFromId(this.gameState.self)?.manager || false;
    },
    validation() {
      // get players
      const players = Array.from(this.gameState?.players.values() || []) as any[];
      const playersCount = players.filter((player) => player.role === PlayerRole.PLAYER).length;

      // too many players
      if (playersCount > 7) {
        return {
          disabled: true,
          message: t('ui.lobby.too_many_players'),
        };
      }

      // not enough players
      if (playersCount < 1) {
        return {
          disabled: true,
          message: t('ui.lobby.not_enough_players'),
        };
      }

      // not a manager
      if (!this.isManager) {
        return {
          disabled: true,
          message: t('ui.lobby.wait_message'),
        };
      }

      // pass all checks
      return {
        disabled: false,
        message: t('ui.lobby.start_game'),
      };
    },
  },
  methods: {
    t,
    showConfirmationModal() {
      const settings = { completeCitySize: this.completeCitySize };
      store.commit('prepareGameSetupConfirmation', settings);
      $('#setupConfirmationModal').modal();
    },
    async startGame() {
      try {
        this.startingGame = true;
        await store.dispatch('startGame');
        this.startingGame = false;
      } catch (error) {
        console.error('error when starting game', error);
        this.startingGame = false;
      }
    },
  },
  beforeUnmount() {
    $('#setupConfirmationModal').modal('hide');
  },
});
</script>

<style scoped lang="scss">
.lobby-screen {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 0;
  box-sizing: border-box;
}

// Background
.background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.lobby-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 800px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.lobby-card {
  background: linear-gradient(145deg, #1a1a2e 0%, #0d0d1e 100%);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  color: white;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.lobby-title {
  margin: 0 0 1.5rem 0;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 1.75rem;
  font-weight: 700;
}

.lobby-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

.settings-section,
.players-section {
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

.form-group {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #00bfff;
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 15px rgba(0, 191, 255, 0.3);
  }
  
  option {
    background: #1a1a2e;
    color: white;
  }
}

.lobby-footer {
  margin-top: auto;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.start-game-btn {
  width: 100%;
  padding: 1rem 2rem;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(90deg, #ff6b35 0%, #ffa500 50%, #ffd700 100%);
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 25px rgba(255, 107, 53, 0.6),
    0 0 40px rgba(255, 165, 0, 0.4);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 
      0 6px 20px rgba(0, 0, 0, 0.4),
      0 0 30px rgba(255, 107, 53, 0.7),
      0 0 50px rgba(255, 165, 0, 0.5);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    background: rgba(255, 255, 255, 0.1);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
}

// Styled Bootstrap Modal
.styled-modal {
  .modal-dialog {
    max-width: 600px;
  }
}

.styled-modal-content {
  background: linear-gradient(145deg, #1a1a2e 0%, #0d0d1e 100%) !important;
  border: 2px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 16px !important;
  color: white !important;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(0, 0, 0, 0.3) !important;
}

.styled-modal-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  padding: 1.5rem 2rem !important;
  
  .modal-title {
    margin: 0;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 1.5rem;
    font-weight: 700;
    color: white !important;
  }
  
  .styled-close {
    color: white !important;
    opacity: 0.8;
    text-shadow: none;
    
    &:hover {
      opacity: 1;
    }
    
    span {
      font-size: 2rem;
      line-height: 1;
    }
  }
}

.styled-modal-body {
  padding: 2rem !important;
}

.styled-modal-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
  padding: 1.5rem 2rem !important;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.confirmation-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.confirmation-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.confirmation-label {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.confirmation-value {
  font-weight: 700;
  font-size: 1.1rem;
  color: #ffd700;
}

.players-preview {
  margin-bottom: 0;
}

.players-preview-title {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.players-preview-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.player-preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  &.offline {
    opacity: 0.6;
  }
}

.player-name {
  font-weight: 500;
}

.player-badges {
  display: flex;
  gap: 0.5rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-you {
  background: linear-gradient(90deg, #0096ff 0%, #00bfff 50%, #00e5ff 100%);
  color: white;
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

.confirm-btn,
.cancel-btn {
  width: 100%;
  padding: 1rem 2rem;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-btn {
  background: linear-gradient(90deg, #ff6b35 0%, #ffa500 50%, #ffd700 100%);
  color: white;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 25px rgba(255, 107, 53, 0.6),
    0 0 40px rgba(255, 165, 0, 0.4);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 
      0 6px 20px rgba(0, 0, 0, 0.4),
      0 0 30px rgba(255, 107, 53, 0.7),
      0 0 50px rgba(255, 165, 0, 0.5);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
}

// Responsive adjustments
@media (max-width: 480px) {
  .lobby-content {
    padding: 0.5rem;
  }
  
  .lobby-card {
    padding: 1.5rem;
  }
  
  .lobby-title {
    font-size: 1.5rem;
  }
  
  .start-game-btn {
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
  }
}
</style>