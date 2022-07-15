import {defineNuxtConfig} from 'nuxt';
import rssFeedPodcasts from '..';

export default defineNuxtConfig({
  modules: [rssFeedPodcasts],
  myModule: {
    addPlugin: true,
  },
});
