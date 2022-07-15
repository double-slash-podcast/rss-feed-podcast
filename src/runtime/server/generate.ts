import RSS from 'rss';
import crypto from 'crypto';
import {defineEventHandler} from 'h3';
import {useRuntimeConfig} from '#imports';
import {PodcastContentType} from '../../declarations';

const {rssFeedPodcasts} = useRuntimeConfig().public;

export default defineEventHandler(async event => {
  const {podcastsSource, podcastGlobalInfos} = rssFeedPodcasts;
  const podcastsQuery: PodcastContentType[] = await $fetch(
    `/api/_content/query?without=body`,
  );
  // path and order don't work in query !
  // filter results start with podcastsSource
  const podcasts = podcastsQuery.filter(podcast =>
    podcast._path.startsWith(podcastsSource),
  );

  // order by date desc
  const podcastsSorted = podcasts.sort((a, b) =>
    a.publicationDate > b.publicationDate
      ? -1
      : a.publicationDate < b.publicationDate
      ? 1
      : 0,
  );

  // construct the xml
  console.log(podcastsSorted);

  // generate RSS
  // get the options for the podcast iteself
  const feedOptions = {
    title: podcastGlobalInfos.title,
    description: podcastGlobalInfos.description,
    site_url: podcastGlobalInfos.siteUrl,
    feed_url: podcastGlobalInfos.feedUrl,
    image_url: podcastGlobalInfos.imageUrl,
    language: podcastGlobalInfos.language,
    copyright: podcastGlobalInfos.copyright,
    docs: `https://help.apple.com/itc/podcasts_connect/#/itcb54353390`,
    author: podcastGlobalInfos.authorName,
    managingEditor: podcastGlobalInfos.managingEditor,
    webMaster: podcastGlobalInfos.webMaster,
    categories: [
      podcastGlobalInfos.category1,
      podcastGlobalInfos.category2,
      podcastGlobalInfos.category3,
    ],
    pubDate: podcastGlobalInfos.publicationDate,

    ttl: podcastGlobalInfos.timeToLive,
    // generator: `https://github.com/miller-productions/gatsby-plugin-podcast-feed-mdx`,
    custom_namespaces: {
      itunes: 'http://www.itunes.com/dtds/podcast-1.0.dtd',
      googleplay: 'http://www.google.com/schemas/play-podcasts/1.0',
    },
    custom_elements: [
      {'itunes:title': podcastGlobalInfos.title},
      {'itunes:subtitle': podcastGlobalInfos.subtitle},
      {'itunes:summary': podcastGlobalInfos.summary.substring(0, 3999)},
      {'itunes:type': podcastGlobalInfos.podcastType},
      {'itunes:explicit': podcastGlobalInfos.explicit},
      {'itunes:author': podcastGlobalInfos.authorName},
      {
        'itunes:owner': [
          {'itunes:name': podcastGlobalInfos.ownerName},
          {'itunes:email': podcastGlobalInfos.ownerEmail},
        ],
      },
      {
        'itunes:image': {
          _attr: {
            href: podcastGlobalInfos.imageUrl,
          },
        },
      },
      {
        'itunes:category': {
          _attr: {
            text: podcastGlobalInfos.category1,
          },
        },
      },
      //   {
      //     "itunes:category": [
      //       {
      //         _attr: {
      //           text: podcastGlobalInfos.category2,
      //         },
      //       },
      //       {
      //         "itunes:category": {
      //           _attr: {
      //             text: podcastGlobalInfos.subCategory2,
      //           },
      //         },
      //       },
      //     ],
      //   },
      //   {
      //     "itunes:category": [
      //       {
      //         _attr: {
      //           text: podcastGlobalInfos.category3,
      //         },
      //       },
      //       {
      //         "itunes:category": {
      //           _attr: {
      //             text: podcastGlobalInfos.subCategory3,
      //           },
      //         },
      //       },
      //     ],
      //   },
      {'googleplay:author': podcastGlobalInfos.authorName},
      {'googleplay:description': podcastGlobalInfos.summary.substring(0, 999)},
      {'googleplay:explicit': podcastGlobalInfos.explicit},
    ],
  };

  // create the rss feed
  const feed = new RSS(feedOptions);

  podcasts.forEach(podcast => {
    const {
      title,
      subtitle,
      url,
      duration,
      season,
      episodeNumber,
      episodeType,
      publicationDate,
      author,
      explicit,
      categories,
    } = podcast;

    // guid
    // #TODO use function in option
    const guid = crypto.createHash('md5').update(`${title}`).digest('hex');

    const custom_elements = [
      {'itunes:title': title},
      {'itunes:subtitle': subtitle},
      season && {'itunes:season': season},
      episodeNumber && {'itunes:episode': episodeNumber},
      {'itunes:episodeType': episodeType},
      {'itunes:explicit': explicit},
      // { "itunes:summary": summary },
      {'itunes:author': author},
      {
        'itunes:image': {
          _attr: {
            href: feedOptions.image_url,
          },
        },
      },
      // { "googleplay:description": summary },
      {'googleplay:explicit': explicit},
    ];

    // if (duration) {
    //   custom_elements.push({'itunes:duration': duration});
    // }
    // add an episode item to the feed using the options
    feed.item({
      guid,
      title,
      date: publicationDate,
      // description: html,
      // url: pluginOptions.siteUrl + slug,
      categories,
      author: author,
      custom_elements: custom_elements,
      enclosure: {
        url,
        // size,
        type: 'audio/mpeg',
      },
    });
  });

  // return xml type
  return event.res.setHeader('content-type', 'application/xml').end(feed.xml());
});
