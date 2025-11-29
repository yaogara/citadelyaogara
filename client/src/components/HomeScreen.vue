<template>
<div class="container-fluid h-100 d-flex justify-content-center align-items-center">
  <div class="card p-4 text-center">
    <div class="form-group">
      <p>{{ $t('ui.homepage.intro_text') }}</p>
      <div class="mb-3">
        <input
          v-model="roomId"
          class="form-control mb-2"
          type="text"
          :placeholder="$t('ui.homepage.join_room_placeholder') || 'Enter room code'"
          @keyup.enter="joinRoom()"
        >
        <input
          class="btn btn-secondary btn-block"
          type="button"
          @click="joinRoom()"
          :value="$t('ui.homepage.join_room') || 'Join Room'"
          :disabled="!roomId.trim()"
        >
      </div>
      <div class="form-group">
        <input
          class="btn btn-primary"
          type="button"
          @click="createRoom()"
          :value="$t('ui.homepage.create_room')"
          :disabled="creatingRoom"
        >
      </div>
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
    };
  },
  methods: {
    async joinRoom() {
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
