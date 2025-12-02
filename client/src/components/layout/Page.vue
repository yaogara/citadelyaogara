<template>
  <div class="page">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-muted) 100%);
}
</style>
