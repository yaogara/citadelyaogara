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
    <div v-else>
      {{ t('ui.unknown_error') }}
    </div>
  </transition>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapGetters, mapActions } from 'vuex';
import { RoomId } from 'citadels-common';
import { store } from '../../store';
import { t } from '../../i18n';
import LoadingSpinner from './elements/LoadingSpinner.vue';

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
