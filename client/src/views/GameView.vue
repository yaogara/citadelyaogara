<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Game Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 class="text-xl font-semibold text-gray-900">
          Game Room: {{ gameId }}
        </h1>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-600">
            Players: {{ playerCount }}
          </span>
          <button 
            @click="showGameMenu = !showGameMenu"
            class="p-2 rounded-full hover:bg-gray-100"
            aria-label="Game menu"
          >
            <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Game Area -->
    <main class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="p-6">
          <!-- Game board will go here -->
          <div class="text-center py-12">
            <h2 class="text-2xl font-semibold text-gray-900 mb-4">Game in Progress</h2>
            <p class="text-gray-600">Game UI will be implemented here</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Game Menu Modal -->
    <Modal :isOpen="showGameMenu" @close="showGameMenu = false">
      <div class="p-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Game Menu</h3>
        <div class="space-y-2">
          <button 
            @click="showRules = true"
            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            View Rules
          </button>
          <button 
            @click="leaveGame"
            class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
          >
            Leave Game
          </button>
        </div>
      </div>
    </Modal>

    <!-- Rules Modal -->
    <Modal :isOpen="showRules" @close="showRules = false">
      <div class="p-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Game Rules</h3>
        <div class="prose max-w-none">
          <p>Game rules will be displayed here.</p>
        </div>
        <div class="mt-6">
          <button 
            @click="showRules = false"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Modal from '@/components/ui/Modal.vue';

export default defineComponent({
  name: 'GameView',
  components: {
    Modal,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const route = useRoute();
    const router = useRouter();
    
    const gameId = ref(props.id);
    const playerCount = ref(1);
    const showGameMenu = ref(false);
    const showRules = ref(false);
    
    const leaveGame = () => {
      // TODO: Implement actual leave game logic
      router.push('/');
    };
    
    onMounted(() => {
      // TODO: Initialize game connection
      console.log('Game ID:', gameId.value);
    });
    
    return {
      gameId,
      playerCount,
      showGameMenu,
      showRules,
      leaveGame,
    };
  },
});
</script>
