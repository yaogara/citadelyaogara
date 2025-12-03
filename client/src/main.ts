import { createApp } from 'vue';
import $ from 'jquery';
import { Boundary } from 'popper.js';
import twemoji from 'twemoji';
import router from './router';
import { store } from './store';
import App from './App.vue';
import { t, setLocale } from './i18n';

import 'bootstrap';
import './scss/main.scss';
import './assets/tailwind.css';

const app = createApp(App);

// Input focus directive
app.directive('focus', {
  mounted(el) {
    el.focus();
  },
});

app.component('emoji', {
  data() {
    return {
      html: '',
    };
  },
  props: {
    emoji: {
      type: String,
      required: true,
    },
  },
  methods: {
    updateEmoji() {
      this.html = twemoji.parse(this.emoji, {
        base: '/',
        folder: 'svg',
        ext: '.svg',
      });
    },
  },
  mounted() {
    this.updateEmoji();
  },
  watch: {
    emoji() {
      this.updateEmoji();
    },
  },
  template: '<span v-html="html"></span>',
});

// Bootstrap tooltip directive
const tooltipOptions = { boundary: 'window' as Boundary };
app.directive('tooltip', {
  mounted(el, binding) {
    const title = binding.value ?? '';
    $(el).tooltip({ ...tooltipOptions, title });
  },
  updated(el, binding) {
    $(el).tooltip('dispose');
    const title = binding.value ?? '';
    $(el).tooltip({ ...tooltipOptions, title });
  },
  unmounted(el) {
    $(el).tooltip('dispose');
  },
});

app.use(store);
app.use(router);
app.config.globalProperties.$t = t;
setLocale('en');
app.mount('#app');
