<template>
  <div class="home-screen">
    <!-- Background with gradient sky and landscape silhouette -->
    <div class="background" :style="{ backgroundImage: `url(${backgroundImage})` }"></div>
    
    <!-- Title/Logo -->
    <div class="title-container">
      <img 
        :src="logoImage" 
        alt="PLATA O PLOMO" 
        class="logo-image"
      />
    </div>
    
    <!-- Characters -->
    <div class="characters-container">
      <img 
        :src="charactersImage" 
        alt="Game Characters" 
        class="characters-image"
      />
    </div>
    
    <!-- Buttons -->
    <div class="button-container">
      <button
        class="host-btn"
        type="button"
        @click="createRoom()"
        :disabled="creatingRoom"
      >
        {{ creatingRoom ? 'CREATING...' : 'HOST GAME' }}
      </button>
      
      <button
        class="join-btn"
        type="button"
        @click="showJoinModal = true"
      >
        JOIN GAME
      </button>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <span class="version">Version 1.0.0</span>
      <button class="settings-btn" @click="showSettings" aria-label="Settings">
        <svg class="settings-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.4-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" fill="currentColor"/>
        </svg>
      </button>
    </div>
    
    <!-- Join Game Modal -->
    <div v-if="showJoinModal" class="modal-overlay" @click="showJoinModal = false">
      <div class="modal-content" @click.stop>
        <h2>Join Game</h2>
        <div class="input-row">
          <input
            v-model="roomId"
            class="room-input"
            type="text"
            placeholder="ENTER ROOM CODE"
            :class="{ 'has-error': joinAttempted && !roomId.trim() }"
            @keyup.enter="joinRoom()"
          >
        </div>
        <div class="modal-actions">
          <button class="join-btn-modal" @click="joinRoom()" :disabled="!roomId.trim()">
            JOIN
          </button>
          <button class="cancel-btn" @click="showJoinModal = false">
            CANCEL
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { store } from '../store';
import logoImage from '../assets/logo-plata-o-plomo.png';
import charactersImage from '../assets/characters-group.png';
import backgroundImage from '../assets/background-night.png';

export default defineComponent({
  name: 'HomeScreen',
  data() {
    return {
      roomId: '',
      creatingRoom: false,
      joinAttempted: false,
      showJoinModal: false,
      logoImage,
      charactersImage,
      backgroundImage,
    };
  },
  methods: {
    async joinRoom() {
      this.joinAttempted = true;
      if (!this.roomId.trim()) return;
      this.$router.push({ name: 'room', params: { roomId: this.roomId.trim() } });
    },
    async createRoom() {
      this.creatingRoom = true;
      try {
        const roomId = await store.dispatch('createRoom');
        this.$router.push({ name: 'room', params: { roomId } });
        this.creatingRoom = false;
      } catch (error) {
        console.error('error when creating room', error);
        this.creatingRoom = false;
      }
    },
    showSettings() {
      // TODO: Implement settings functionality
      console.log('Settings clicked');
    },
  },
});
</script>

<style scoped lang="scss">
.home-screen {
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
  gap: 1rem;
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

// Title/Logo Container
.title-container {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo-image {
  max-width: 100%;
  max-height: 220px;
  width: auto;
  height: auto;
  object-fit: contain;
}

// Characters Container
.characters-container {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 100%;
  margin: 0;
}

.characters-image {
  max-width: 90%;
  max-height: 350px;
  width: auto;
  height: auto;
  object-fit: contain;
}

// Button Container
.button-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
  max-width: 320px;
  margin: 0;
}

.host-btn,
.join-btn {
  width: 100%;
  padding: 1.25rem 2rem;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 20px currentColor;
}

.host-btn {
  background: linear-gradient(90deg, #ff6b35 0%, #ffa500 50%, #ffd700 100%);
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 25px rgba(255, 107, 53, 0.6),
    0 0 40px rgba(255, 165, 0, 0.4);
}

.join-btn {
  background: linear-gradient(90deg, #0096ff 0%, #00bfff 50%, #00e5ff 100%);
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 25px rgba(0, 150, 255, 0.6),
    0 0 40px rgba(0, 191, 255, 0.4);
}

.host-btn:disabled,
.join-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.host-btn:not(:disabled):hover,
.join-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(0, 0, 0, 0.4),
    0 0 30px currentColor,
    0 0 50px rgba(255, 255, 255, 0.3);
}

.host-btn:not(:disabled):active,
.join-btn:not(:disabled):active {
  transform: translateY(0);
}

// Footer
.footer {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 600px;
  padding: 0 1rem 1rem;
}

.version {
  color: white;
  font-size: 0.875rem;
  font-weight: 400;
  opacity: 0.9;
}

.settings-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, opacity 0.2s ease;
  opacity: 0.9;
}

.settings-btn:hover {
  transform: rotate(90deg);
  opacity: 1;
}

.settings-icon {
  width: 24px;
  height: 24px;
  color: white;
}

// Modal for Join Game
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: linear-gradient(145deg, #1a1a2e 0%, #0d0d1e 100%);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  color: white;
  
  h2 {
    margin: 0 0 1.5rem 0;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
}

.input-row {
  margin-bottom: 1.5rem;
}

.room-input {
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

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.join-btn-modal,
.cancel-btn {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
}

.join-btn-modal {
  background: linear-gradient(90deg, #0096ff 0%, #00bfff 50%, #00e5ff 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(0, 150, 255, 0.4);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 150, 255, 0.5);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }
}

// Responsive adjustments
@media (max-width: 480px) {
  .logo-image {
    max-height: 180px;
  }
  
  .characters-image {
    max-height: 280px;
  }
  
  .button-container {
    max-width: 280px;
  }
  
  .host-btn,
  .join-btn {
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }
}
</style>