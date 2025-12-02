<template>
  <div class="min-h-screen p-4">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">Join Game</h1>
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="gameId">
            Game ID
          </label>
          <input
            id="gameId"
            v-model="gameId"
            type="text"
            class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
            placeholder="Enter game code"
            @keyup.enter="joinGame"
          />
        </div>
        
        <div class="mb-6">
          <label class="block text-gray-700 mb-2" for="playerName">
            Your Name
          </label>
          <input
            id="playerName"
            v-model="playerName"
            type="text"
            class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your name"
            @keyup.enter="joinGame"
          />
        </div>
        
        <div class="flex justify-end space-x-4">
          <router-link 
            to="/" 
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </router-link>
          <button 
            @click="joinGame"
            :disabled="!canJoin"
            class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Game
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'JoinGameView',
  setup() {
    const router = useRouter();
    const gameId = ref('');
    const playerName = ref('');
    
    const canJoin = computed(() => 
      gameId.value.trim().length > 0 && 
      playerName.value.trim().length > 0
    );
    
    const joinGame = () => {
      if (!canJoin.value) return;
      // TODO: Implement actual game joining logic
      router.push(`/game/${gameId.value.trim().toUpperCase()}`);
    };
    
    return {
      gameId,
      playerName,
      canJoin,
      joinGame,
    };
  },
});
</script>
