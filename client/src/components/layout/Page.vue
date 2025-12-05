<template>
  <div class="page" :class="{ 'page--full-screen': fullScreen }">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Page',
  props: {
    fullScreen: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-muted) 100%);

  &--full-screen {
    height: 100vh;
    overflow: hidden;
  }
}
</style>
