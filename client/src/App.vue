<template>
  <Page :full-screen="inGame">
    <ContentArea :full-screen="inGame">
      <router-view></router-view>
    </ContentArea>
  </Page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Page from './components/layout/Page.vue';
import TopNav from './components/layout/TopNav.vue';
import ContentArea from './components/layout/ContentArea.vue';
import { t } from './i18n';

export default defineComponent({
  name: 'App',
  components: {
    ContentArea,
    Page,
    TopNav,
  },
  computed: {
    inGame() {
      return ['room', 'home'].includes(this.$route?.name);
    },
  },
  methods: {
    t,
  },
});
</script>

<style lang="scss" scoped>
.brand {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  align-items: center;
  text-align: center;

  &__link {
    color: var(--color-text);
    text-decoration: none;
  }

  &__title {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-weight: 700;

    &--compact {
      font-size: var(--font-size-lg);
    }
  }

  &__subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);

  &__link {
    color: var(--color-text);
    text-decoration: none;
    font-weight: 600;
    padding: var(--space-2xs) var(--space-xs);
    border-radius: var(--radius-md);
    transition: color 120ms ease, background-color 120ms ease;

    &:hover,
    &:focus {
      color: var(--color-accent-strong);
      background-color: var(--color-overlay);
      text-decoration: none;
    }
  }
}
</style>
