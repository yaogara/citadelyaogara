<template>
  <header class="top-nav" :class="{ 'top-nav--compact': compact }">
    <div class="top-nav__inner">
      <div class="top-nav__brand">
        <slot name="brand" />
      </div>
      <div class="top-nav__actions">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'TopNav',
  props: {
    compact: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style scoped lang="scss">
.top-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--color-surface-strong);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-subtle);
  transition: padding 150ms ease, box-shadow 150ms ease;

  &__inner {
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: var(--space-sm) var(--space-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
  }

  &__brand {
    flex: 1;
    min-width: 0;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  &--compact {
    box-shadow: var(--shadow-soft);
  }
}

@media (max-width: 768px) {
  .top-nav__inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .top-nav__actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
