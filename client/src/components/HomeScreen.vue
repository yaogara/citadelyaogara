<template>
  <div class="home-screen">
    <div class="button-container">
      <button
        class="host-btn"
        type="button"
        @click="createRoom()"
        :disabled="creatingRoom"
      >
        {{ creatingRoom ? 'CREATING...' : 'HOST GAME' }}
      </button>
      
      <div class="divider">OR</div>
      
      <div class="join-section">
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
        <button
          class="join-btn"
          type="button"
          @click="joinRoom()"
          :disabled="!roomId.trim()"
        >
          JOIN GAME
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { store } from '../store';

export default defineComponent({
  name: 'HomeScreen',
  data() {
    return {
      roomId: '',
      creatingRoom: false,
      joinAttempted: false,
      inputId: `room-input-${Math.random().toString(36).slice(2)}`,
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
  },
});
</script>

<style scoped lang="scss">
.home-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 10% 20%, rgba(88, 86, 214, 0.12), transparent 35%),
    radial-gradient(circle at 90% 10%, rgba(32, 201, 151, 0.1), transparent 30%),
    linear-gradient(135deg, rgba(17, 24, 39, 0.85), rgba(17, 24, 39, 0.7));
  color: white;
  padding: 0 !important;
  margin: 0 !important;
  width: 100vw;
  max-width: 100%;
  overflow-x: hidden;
}

.button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  width: 100%;
  max-width: 320px;
  padding: 2rem;
}

.host-btn, .join-btn {
  width: 100%;
  padding: 1.25rem;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: bold;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.host-btn {
  background: linear-gradient(45deg, #ff9800, #ffc107);
  color: #1a237e;
}

.join-btn {
  background: linear-gradient(45deg, #00bcd4, #00e5ff);
  color: #0d47a1;
}

.host-btn:disabled, .join-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.host-btn:not(:disabled):hover, .join-btn:not(:disabled):hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.divider {
  color: white;
  text-transform: uppercase;
  font-weight: bold;
  position: relative;
  width: 100%;
  text-align: center;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: rgba(255, 255, 255, 0.3);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.join-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.room-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  text-align: center;
  text-transform: uppercase;
  transition: all 0.3s ease;
}

.room-input:focus {
  outline: none;
  border-color: #00bcd4;
  background: rgba(255, 255, 255, 0.15);
}

.room-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
}

.room-input.has-error {
  border-color: #ff5252;
}

.hero-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(1.5rem, 3vw, 2.5rem);
  background: #fff;
  border-radius: 24px;
  padding: clamp(1.75rem, 4vw, 3rem);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  max-width: 1100px;
  width: 100%;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 2vw, 1.5rem);
}

.eyebrow {
  font-size: clamp(0.85rem, 1.8vw, 1rem);
  font-weight: 600;
  color: var(--bs-primary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin: 0;
}

.headline {
  font-size: clamp(1.9rem, 4vw, 2.8rem);
  line-height: 1.2;
  font-weight: 700;
  margin: 0;
  color: var(--bs-emphasis-color, #111827);
}

.lede {
  margin: 0;
  color: var(--bs-secondary-color, #4b5563);
  font-size: clamp(1rem, 2vw, 1.125rem);
}

.cta-group {
  display: grid;
  grid-template-columns: 2fr 1px 1.2fr;
  gap: clamp(1rem, 2vw, 1.5rem);
  align-items: center;
}

.divider {
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, transparent, rgba(15, 23, 42, 0.08), transparent);
}

@media (max-width: 768px) {
  .cta-group {
    grid-template-columns: 1fr;
  }

  .divider {
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(15, 23, 42, 0.08), transparent);
  }
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-weight: 600;
  color: var(--bs-emphasis-color, #111827);
  margin: 0;
}

.input-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.room-input {
  flex: 1;
  min-width: 200px;
  border: 1px solid var(--bs-border-color, #e5e7eb);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.room-input:focus {
  outline: none;
  border-color: var(--bs-primary);
  box-shadow: 0 0 0 3px rgba(88, 86, 214, 0.18);
}

.room-input.has-error {
  border-color: var(--bs-danger, #dc3545);
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.18);
}

button {
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.2s ease;
  font-size: 1rem;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
  box-shadow: none;
}

.btn-primary {
  background: var(--bs-primary);
  color: #fff;
  box-shadow: 0 12px 30px rgba(88, 86, 214, 0.35);
}

.btn-primary:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 34px rgba(88, 86, 214, 0.4);
}

.btn-ghost {
  background: rgba(17, 24, 39, 0.05);
  color: var(--bs-emphasis-color, #111827);
}

.btn-ghost:not(:disabled):hover {
  background: rgba(17, 24, 39, 0.08);
  transform: translateY(-1px);
}

.helper-text {
  margin: 0;
  color: var(--bs-secondary-color, #4b5563);
  font-size: 0.95rem;
}

.helper-text.error {
  color: var(--bs-danger, #dc3545);
}

.supporting-panel {
  background: linear-gradient(145deg, rgba(88, 86, 214, 0.1), rgba(32, 201, 151, 0.12));
  border-radius: 16px;
  padding: clamp(1.25rem, 3vw, 1.75rem);
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.panel-title {
  margin: 0;
  font-size: clamp(1.2rem, 2.5vw, 1.5rem);
  font-weight: 700;
  color: var(--bs-emphasis-color, #111827);
}

.panel-list {
  margin: 0;
  padding-left: 1.25rem;
  display: grid;
  gap: 0.5rem;
  color: var(--bs-secondary-color, #4b5563);
  line-height: 1.5;
}
</style>
