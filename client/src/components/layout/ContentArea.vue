<template>
  <main class="content-area" :class="{ 'content-area--full-screen': fullScreen }">
    <div class="content-area__inner">
      <slot />
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ContentArea',
  props: {
    fullScreen: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style scoped lang="scss">
.content-area {
  flex: 1;
  padding: var(--space-lg) var(--space-md) var(--space-xl);
  display: flex;
  align-items: stretch;
  justify-content: center;

  &__inner {
    width: 100%;
    max-width: var(--content-max-width);
  }

  &--full-screen {
    padding: 0;
    height: 100vh;
    overflow: hidden;

    .content-area__inner {
      max-width: 100%;
      height: 100%;
    }
  }
}
</style>
