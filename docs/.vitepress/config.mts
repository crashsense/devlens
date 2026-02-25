import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'DevLens',
  description: 'Automatic runtime error detection for JavaScript, React, and Vue - null access, API failures, missing data - zero manual console.log.',
  base: '/devlens/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/devlens/favicon.svg' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/devlens/favicon-32x32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/devlens/favicon-16x16.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/devlens/apple-touch-icon.png' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'DevLens - Runtime Error Detection SDK' }],
    ['meta', { property: 'og:description', content: 'Stop adding console.log everywhere. DevLens auto-detects null access, API failures, and missing render data - with actionable fix suggestions.' }],
    ['meta', { property: 'og:image', content: 'https://crashsense.github.io/devlens/og-image.png' }],
    ['meta', { property: 'og:url', content: 'https://crashsense.github.io/devlens/' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: 'https://crashsense.github.io/devlens/og-image.png' }],
    ['meta', { name: 'theme-color', content: '#6366f1' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'DevLens',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Quick Start', link: '/quick-start' },
      {
        text: 'v2.1.0',
        items: [
          { text: 'Changelog', link: 'https://github.com/crashsense/devlens/blob/main/CHANGELOG.md' },
          { text: '@devlens/core', link: 'https://www.npmjs.com/package/@devlens/core' },
          { text: '@devlens/react', link: 'https://www.npmjs.com/package/@devlens/react' },
          { text: '@devlens/ui', link: 'https://www.npmjs.com/package/@devlens/ui' },
          { text: '@devlens/vue', link: 'https://www.npmjs.com/package/@devlens/vue' },
          { text: '@devlens/vite', link: 'https://www.npmjs.com/package/@devlens/vite' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/crashsense/devlens' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@devlens/core' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2026-present CrashSense',
    },

    search: {
      provider: 'local',
    },
  },
})
