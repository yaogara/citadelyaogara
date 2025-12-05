<template>
<div class="room-entry-screen">
  <!-- Background with gradient sky and landscape silhouette -->
  <div class="background" :style="{ backgroundImage: `url(${backgroundImage})` }"></div>
  
  <div class="content-container">
    <transition name="fade" mode="out-in">
      <div v-if="loading" class="content-card">
        <LoadingSpinner />
      </div>
      <div v-else-if="error" class="content-card error-card">
        <h2 class="error-title">Error</h2>
        <p class="error-message">{{ t(errorMessage, { msg: errorReason }) }}</p>
        <button class="back-btn" @click="$router.push('/')">
          GO BACK
        </button>
      </div>
      <div v-else-if="askForUsername" class="content-card">
        <h2 class="form-title">Enter Your Name</h2>
        <form @submit.prevent="joinRoom" autocomplete="off" class="username-form">
          <div class="input-group">
            <input
              type="text"
              class="username-input"
              v-model="username"
              id="username"
              placeholder="ENTER YOUR NAME"
              v-focus
              :class="{ 'has-error': joinAttempted && !username.trim() }"
            >
          </div>
          <div class="form-actions">
            <button class="connect-btn" type="submit" :disabled="!username.trim()">
              {{ t('ui.room.connect') }}
            </button>
            <button class="cancel-btn" type="button" @click="$router.push('/')">
              CANCEL
            </button>
          </div>
        </form>
      </div>
      <div v-else class="content-card error-card">
        <h2 class="error-title">Error</h2>
        <p class="error-message">{{ t('ui.unknown_error') }}</p>
        <button class="back-btn" @click="$router.push('/')">
          GO BACK
        </button>
      </div>
    </transition>
  </div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapGetters, mapActions } from 'vuex';
import { RoomId } from 'citadels-common';
import { store } from '../../store';
import { t } from '../../i18n';
import LoadingSpinner from './elements/LoadingSpinner.vue';
import backgroundImage from '../../assets/background-night.png';

export default defineComponent({
  components: { LoadingSpinner },
  name: 'RoomEntryScreen',
  data() {
    return {
      username: '',
      loading: true,
      open: false,
      error: false,
      errorMessage: undefined,
      errorReason: undefined,
      askForUsername: false,
      joinAttempted: false,
      backgroundImage,
    };
  },
  computed: {
    ...mapGetters([
      'isConnected',
    ]),
    roomId() {
      return this.$route.params.roomId;
    },
  },
  methods: {
    t,
    ...mapActions([
      'connect',
    ]),
    async getRoomInfo(roomId: RoomId) {
      try {
        this.loading = true;
        this.open = false;
        const roomInfo = await store.dispatch('getRoomInfo', roomId);
        switch (roomInfo.status) {
          case 'open':
            this.open = true;
            break;
          case 'closed':
            this.open = false;
            break;
          case 'not found':
            this.errorMessage = 'ui.room.error_does_not_exist';
            this.error = true;
            break;
          default:
            console.log('get room info error:', roomInfo);
            this.errorMessage = 'ui.unknown_error';
            this.error = true;
        }
        if (this.error) {
          this.loading = false;
        } else if (localStorage.getItem(this.roomId)) {
          this.joinRoom();
        } else if (this.open) {
          this.askForUsername = true;
          this.loading = false;
        } else {
          this.errorMessage = 'ui.room.not_open';
          this.error = true;
          this.loading = false;
        }
      } catch (error) {
        console.log(error);
      }
    },
    joinRoom() {
      this.joinAttempted = true;
      if (!this.username.trim()) return;
      
      this.loading = true;
      const playerId = localStorage.getItem(this.roomId);
      store.dispatch('joinRoom', { roomId: this.roomId, playerId, username: this.username }).catch((reason: Error) => {
        if (reason.message === 'game state is null') {
          this.getRoomInfo(this.roomId);
        } else {
          this.loading = false;
          this.error = true;
          this.errorMessage = 'ui.room.error_join';
          this.errorReason = reason.message;
        }
      });
    },
  },
  mounted() {
    this.getRoomInfo(this.roomId);
  },
});
</script>

<style scoped lang="scss">
.room-entry-screen {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 1rem;
  box-sizing: border-box;
}

// Background with gradient sky and landscape silhouette
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

.content-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 500px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.content-card {
  background: linear-gradient(145deg, #1a1a2e 0%, #0d0d1e 100%);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2.5rem;
  width: 100%;
  color: white;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(0, 0, 0, 0.3);
}

.form-title,
.error-title {
  margin: 0 0 1.5rem 0;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 1.5rem;
  font-weight: 700;
}

.error-message {
  text-align: center;
  margin: 0 0 2rem 0;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}

.username-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  margin-bottom: 0;
}

.username-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
  box-sizing: border-box;
  transition: all 0.3s ease;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  
  &:focus {
    outline: none;
    border-color: #00bfff;
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 15px rgba(0, 191, 255, 0.3);
  }
  
  &.has-error {
    border-color: #ff5252;
    box-shadow: 0 0 15px rgba(255, 82, 82, 0.3);
  }
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.connect-btn,
.back-btn,
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

.connect-btn {
  background: linear-gradient(90deg, #0096ff 0%, #00bfff 50%, #00e5ff 100%);
  color: white;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 25px rgba(0, 150, 255, 0.6),
    0 0 40px rgba(0, 191, 255, 0.4);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 
      0 6px 20px rgba(0, 0, 0, 0.4),
      0 0 30px rgba(0, 150, 255, 0.7),
      0 0 50px rgba(0, 191, 255, 0.5);
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

.back-btn {
  background: linear-gradient(90deg, #ff6b35 0%, #ffa500 50%, #ffd700 100%);
  color: white;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 25px rgba(255, 107, 53, 0.6),
    0 0 40px rgba(255, 165, 0, 0.4);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 6px 20px rgba(0, 0, 0, 0.4),
      0 0 30px rgba(255, 107, 53, 0.7),
      0 0 50px rgba(255, 165, 0, 0.5);
  }
  
  &:active {
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

.error-card {
  text-align: center;
}

// Fade transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Responsive adjustments
@media (max-width: 480px) {
  .content-card {
    padding: 2rem 1.5rem;
  }
  
  .form-title,
  .error-title {
    font-size: 1.25rem;
  }
  
  .username-input {
    font-size: 0.9rem;
    padding: 0.875rem;
  }
  
  .connect-btn,
  .back-btn,
  .cancel-btn {
    padding: 0.875rem 1.5rem;
    font-size: 0.9rem;
  }
}
</style>