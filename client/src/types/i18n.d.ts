import type { ComponentCustomProperties } from 'vue';
import type { Locale } from '../i18n';

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $t: (key: string, targetLocale?: Locale | string) => string;
  }
}
