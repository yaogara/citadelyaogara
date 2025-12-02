<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4">
    <h1 class="text-4xl font-bold mb-8">Welcome to Citadels</h1>
    <div class="flex flex-col space-y-4 w-full max-w-md">
      <router-link 
        to="/create" 
        class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors"
      >
        Create Game
      </router-link>
      <router-link 
        to="/join" 
        class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors"
      >
        Join Game
      </router-link>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'HomeView',
  setup() {
    return {};
  },
});
</script>
