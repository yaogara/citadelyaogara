<template>
  <div class="resolution-screen surface">
      <h2>Round Resolution</h2>
      <div class="log-container">
          <div v-for="(log, index) in logs" :key="index" class="log-entry">
              {{ log }}
          </div>
          <div v-if="logs.length === 0" class="waiting">
              Waiting for resolution...
          </div>
      </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapGetters } from 'vuex';

export default defineComponent({
  name: 'ResolutionScreen',
  computed: {
    ...mapGetters(['gameState']),
    logs() {
        return this.gameState?.board?.resolutionLog || [];
    }
  }
});
</script>

<style scoped>
.resolution-screen {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    max-width: 600px;
    height: 60vh;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    z-index: 100;
}
.log-container {
    flex: 1;
    overflow-y: auto;
    background: rgba(0,0,0,0.3);
    padding: 1rem;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
.log-entry {
    padding: 0.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}
.waiting {
    text-align: center;
    color: #888;
    margin-top: 2rem;
}
</style>
