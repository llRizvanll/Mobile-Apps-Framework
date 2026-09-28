import { defineConfig, type HeadConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

const REPO = 'https://github.com/llRizvanll/Mobile-Apps-Framework';
const SITE = 'https://llrizvanll.github.io/Mobile-Apps-Framework';
const BASE = '/Mobile-Apps-Framework/';
const TITLE = 'Mobile App Framework';
const DESCRIPTION =
  'Open-source, AI-native, white-label React Native framework in strict TypeScript: clean architecture, MVVM & MVI, dependency injection, Redux Toolkit, REST/GraphQL/WebSocket, i18n & RTL, design tokens, observability and AI tool calling.';
const KEYWORDS = [
  'react native framework',
  'react native boilerplate',
  'white label react native',
  'multi brand mobile app',
  'expo monorepo',
  'typescript strict',
  'clean architecture react native',
  'mvvm react native',
  'mvi react native',
  'dependency injection typescript',
  'redux toolkit',
  'graphql subscriptions react native',
  'websocket reconnect',
  'react native i18n rtl',
  'design tokens',
  'ai native mobile app',
  'llm tool calling mobile',
].join(', ');

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareSourceCode',
  name: TITLE,
  description: DESCRIPTION,
  codeRepository: REPO,
  programmingLanguage: ['TypeScript', 'React Native'],
  runtimePlatform: ['iOS', 'Android', 'Expo'],
  keywords: KEYWORDS,
  url: `${SITE}/`,
};

export default withMermaid(
  defineConfig({
    lang: 'en-US',
    title: TITLE,
    titleTemplate: ':title · Mobile App Framework',
    description: DESCRIPTION,
    base: BASE,
    cleanUrls: true,
    lastUpdated: true,
    // README.md files keep folders browsable on GitHub; serve them as index pages on the site.
    // Files outside docs/ are linked with absolute GitHub URLs.
    rewrites: {
      'adr/README.md': 'adr/index.md',
      'workflows/README.md': 'workflows/index.md',
      'reference/README.md': 'reference/index.md',
    },
    sitemap: { hostname: `${SITE}/` },
    head: [
      ['link', { rel: 'icon', type: 'image/svg+xml', href: `${BASE}logo.svg` }],
      ['meta', { name: 'theme-color', content: '#3D5AFE' }],
      ['meta', { name: 'keywords', content: KEYWORDS }],
      ['meta', { name: 'author', content: 'llRizvanll' }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:site_name', content: TITLE }],
      ['meta', { property: 'og:image', content: `${SITE}/og.png` }],
      ['meta', { property: 'og:image:width', content: '1200' }],
      ['meta', { property: 'og:image:height', content: '630' }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:image', content: `${SITE}/og.png` }],
      ['script', { type: 'application/ld+json' }, JSON.stringify(jsonLd)],
    ],
    // Per-page canonical URL + OG title/description/url from frontmatter.
    transformPageData(page) {
      const path = page.relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '');
      const url = `${SITE}/${path}`;
      const title = page.frontmatter.title ?? page.title ?? TITLE;
      const description = page.frontmatter.description ?? page.description ?? DESCRIPTION;
      const head: HeadConfig[] = [
        ['link', { rel: 'canonical', href: url }],
        ['meta', { property: 'og:url', content: url }],
        ['meta', { property: 'og:title', content: `${title} · ${TITLE}` }],
        ['meta', { property: 'og:description', content: description }],
        ['meta', { name: 'twitter:title', content: `${title} · ${TITLE}` }],
        ['meta', { name: 'twitter:description', content: description }],
      ];
      page.frontmatter.head = [...(page.frontmatter.head ?? []), ...head];
    },
    themeConfig: {
      logo: '/logo.svg',
      search: { provider: 'local' },
      socialLinks: [{ icon: 'github', link: REPO }],
      editLink: { pattern: `${REPO}/edit/main/docs/:path`, text: 'Edit this page on GitHub' },
      footer: {
        message: 'White-label, AI-native React Native framework.',
        copyright: `<a href="${REPO}">llRizvanll/Mobile-Apps-Framework</a>`,
      },
      nav: [
        { text: 'Guide', link: '/guide/introduction', activeMatch: '/guide/' },
        { text: 'Workflows', link: '/workflows/', activeMatch: '/workflows/' },
        { text: 'Architecture', link: '/architecture' },
        { text: 'Packages', link: '/reference/', activeMatch: '/reference/' },
        { text: 'ADRs', link: '/adr/', activeMatch: '/adr/' },
        { text: 'FAQ', link: '/faq' },
      ],
      sidebar: {
        '/': [
          {
            text: 'Getting started',
            items: [
              { text: 'Introduction', link: '/guide/introduction' },
              { text: 'Quick start', link: '/guide/getting-started' },
              { text: 'Project structure', link: '/guide/project-structure' },
              { text: 'Repo tour (learning path)', link: '/guide/learning-path' },
              { text: 'Core concepts', link: '/guide/core-concepts' },
            ],
          },
          {
            text: 'Building',
            items: [
              { text: 'Architecture', link: '/architecture' },
              { text: 'Building features', link: '/features' },
              { text: 'Brands (white-label)', link: '/brands' },
              { text: 'AI-native development', link: '/guide/ai-native' },
            ],
          },
          {
            text: 'Workflows',
            collapsed: false,
            items: [
              { text: 'Overview', link: '/workflows/' },
              { text: 'App boot', link: '/workflows/app-boot' },
              { text: 'Request lifecycle', link: '/workflows/request-lifecycle' },
              { text: 'State & persistence', link: '/workflows/state-and-persistence' },
              { text: 'AI agent loop', link: '/workflows/ai-agent' },
              { text: 'Feature development', link: '/workflows/feature-development' },
              { text: 'White-label release', link: '/workflows/white-label-release' },
              { text: 'Testing strategy', link: '/workflows/testing' },
              { text: 'CI/CD', link: '/workflows/ci-cd' },
            ],
          },
          {
            text: 'Reference',
            items: [
              { text: 'Packages', link: '/reference/' },
              { text: 'Architecture decisions', link: '/adr/' },
              { text: 'Glossary', link: '/glossary' },
              { text: 'FAQ', link: '/faq' },
              { text: 'Troubleshooting', link: '/troubleshooting' },
              { text: 'Maintainer guide', link: '/maintainers' },
            ],
          },
        ],
      },
    },
    mermaid: { theme: 'default' },
  }),
);
