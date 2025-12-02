<template>
  <div
    class="modal fade"
    id="aboutModal"
    tabindex="-1"
    aria-labelledby="exampleModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="exampleModalLabel">{{ $t('ui.about.title') }}</h5>
          <button type="button" class="close" data-dismiss="modal" :aria-label="$t('ui.close')">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <p v-html="$t('ui.about.text')"></p>
          <h6>{{ $t('ui.about.picture_credits') }}</h6>
          <ul>
            <li
              v-for="line, i in credits"
              :key="i"
            >
              <a :href="line[1]" target="_blank">{{ $t(`districts.${line[0]}.name`) }}</a>
              {{ $t('ui.about.by') }}
              <a v-if="line[3]" :href="line[3]" target="_blank">{{ line[2] }}</a>
              <span v-else>{{ line[2] }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <Page>
    <TopNav :compact="inGame">
      <template #brand>
        <div class="brand">
          <a href="/" class="brand__link">
            <span
              class="brand__title"
              :class="{ 'brand__title--compact': inGame }"
            >
              {{ $t('ui.title') }}
            </span>
          </a>
          <p v-if="!inGame" class="brand__subtitle">{{ $t('ui.subtitle2') }}</p>
        </div>
      </template>
      <template #actions>
        <div class="nav-actions">
          <LocaleSelector class="nav-actions__locale" />
          <a
            class="nav-actions__link"
            href="#"
            data-toggle="modal"
            data-target="#aboutModal"
          >
            {{ $t('ui.about.title') }}
          </a>
        </div>
      </template>
    </TopNav>

    <ContentArea>
      <router-view></router-view>
    </ContentArea>
  </Page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import LocaleSelector from './components/LocaleSelector.vue';
import Page from './components/layout/Page.vue';
import TopNav from './components/layout/TopNav.vue';
import ContentArea from './components/layout/ContentArea.vue';
import credits from './data/credits.json';

export default defineComponent({
  name: 'App',
  components: {
    ContentArea,
    LocaleSelector,
    Page,
    TopNav,
  },
  computed: {
    credits() {
      return credits;
    },
    inGame() {
      return this.$route.name === 'room';
    },
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
