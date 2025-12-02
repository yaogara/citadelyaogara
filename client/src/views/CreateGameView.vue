<template>
  <div class="min-h-screen p-4">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">Create New Game</h1>
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="playerName">
            Your Name
          </label>
          <input
            id="playerName"
            v-model="playerName"
            type="text"
            class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your name"
          />
        </div>
        
        <div class="mb-6">
          <label class="block text-gray-700 mb-2">
            Number of Players
          </label>
          <div class="flex items-center space-x-4">
            <button 
              v-for="num in [2,3,4,5,6,7,8]" 
              :key="num"
              @click="playerCount = num"
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :class="playerCount === num 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'"
            >
              {{ num }}
            </button>
          </div>
        </div>
        
        <div class="flex justify-end space-x-4">
          <router-link 
            to="/" 
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </router-link>
          <button 
            @click="createGame"
            :disabled="!canCreate"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Game
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
  name: 'CreateGameView',
  setup() {
    const router = useRouter();
    const playerName = ref('');
    const playerCount = ref(4);
    
    const canCreate = computed(() => playerName.value.trim().length > 0);
    
    const createGame = () => {
      if (!canCreate.value) return;
      // TODO: Implement actual game creation logic
      const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
      router.push(`/game/${gameId}`);
    };
    
    return {
      playerName,
      playerCount,
      canCreate,
      createGame,
    };
  },
});
</script>
