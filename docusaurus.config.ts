import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Saikoushik Gandikota',
  tagline: 'Senior Platform Engineer — Azure · Kubernetes · Cloud Security',
  favicon: 'img/favicon.ico',

  url: 'https://saikoushikg.in',
  baseUrl: '/',

  organizationName: 'skgandikota',
  projectName: 'skgandikota',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  onBrokenAnchors: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: false,
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: '',
      logo: {
        alt: 'SK',
        src: 'img/logo.svg',
      },
      style: 'dark',
      items: [
        {href: '/#about', label: 'About', position: 'left'},
        {href: '/#experience', label: 'Experience', position: 'left'},
        {href: '/#skills', label: 'Skills', position: 'left'},
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://linkedin.com/in/saikoushikg',
          label: 'LinkedIn',
          position: 'right',
        },
        {
          href: 'https://github.com/skgandikota',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Connect',
          items: [
            {label: 'LinkedIn', href: 'https://linkedin.com/in/saikoushikg'},
            {label: 'GitHub', href: 'https://github.com/skgandikota'},
            {label: 'Email', href: 'mailto:saikoushikg@gmail.com'},
          ],
        },
        {
          title: 'Content',
          items: [
            {label: 'Blog', to: '/blog'},
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Saikoushik Gandikota`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;