<template>
<div class="input-group">
  <div class="input-group-prepend">
    <label class="input-group-text px-2" for="inputGroupLocale">
      <emoji :emoji="t('flag', currentLocale)"></emoji>
    </label>
  </div>
  <select class="custom-select" v-model="currentLocale" id="inputGroupLocale">
    <option v-for="locale in availableLocales" :key="`locale-${locale}`" :value="locale">
      {{ t('name', locale) }}
    </option>
  </select>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { availableLocales, getLocale, setLocale, updateTitle, t } from '../i18n';

export default defineComponent({
  name: 'LocaleSelector',
  setup() {
    const currentLocale = computed<ReturnType<typeof getLocale>>({
      get: () => getLocale(),
      set: (locale) => {
        setLocale(locale);
        updateTitle();
      },
    });

    return {
      availableLocales,
      currentLocale,
      t,
    };
  },
});
</script>
