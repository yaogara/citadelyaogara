<template>
  <main class="content-area">
    <div class="content-area__inner">
      <slot />
    </div>
  </main>
</template>

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
}
</style>
