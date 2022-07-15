import {resolve} from 'path';
import {fileURLToPath} from 'url';
import {defu} from 'defu';
import {defineNuxtModule, addPlugin, addServerHandler} from '@nuxt/kit';
import {PodcastGlobalInfosType} from './declarations';

export interface ModuleOptions {
  /** url of feed (with .xml) */
  feedName: string;
  /** path for podcast content */
  podcastsSource: string;
  podcastGlobalInfos: PodcastGlobalInfosType;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'rss-feed-podcasts',
    configKey: 'rssFeedPodcasts',
    compatibility: {
      nuxt: '^3.0.0',
    },
    feedName: '/podcast-rss-feed.xml',
    podcastsSource: '',
    podcastGlobalInfos: {},
  },
  defaults: {
    feedName: '/podcast-rss-feed.xml',
    podcastsSource: '/podcasts',
    podcastGlobalInfos: {
      title: '',
      subtitle: '',
      summary: '',
      description: '',
      podcastType: '',
      siteUrl: '',
      imageUrl: '',
      feedUrl: '',
      language: '',
      copyright: '',
      authorName: '',
      ownerName: '',
      ownerEmail: '',
      managingEditor: '',
      webMaster: '',
      explicit: '',
      publicationDate: '',
      category1: '',
      timeToLive: '',
    },
  },
  setup(options, nuxt) {
    // push the plugin
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url));
    nuxt.options.build.transpile.push(runtimeDir);
    addPlugin(resolve(runtimeDir, 'plugin'));

    // Default runtimeConfig
    nuxt.options.runtimeConfig.public.rssFeedPodcasts = defu(
      nuxt.options.runtimeConfig.public.rssFeedPodcasts,
      {
        podcastsSource: options.podcastsSource,
        podcastGlobalInfos: options.podcastGlobalInfos,
      },
    );

    // add handler for xml rss file
    addServerHandler({
      route: options.feedName,
      handler: resolve(runtimeDir, 'server/generate'),
    });
  },
});
