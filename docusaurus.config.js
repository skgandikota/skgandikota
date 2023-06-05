// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Sai.Gandikota',
  tagline: 'A Passionate Full Stack Engineer',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://saikoushikg.in',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'skgandikota', // Usually your GitHub org/user name.
  projectName: 'skgandikota', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          feedOptions: {
              type: 'all',
              copyright: `Copyright © ${new Date().getFullYear()} Sai Koushik Gandikota, Inc.`,
              createFeedItems: async (params) => {
                const {blogPosts, defaultCreateFeedItems, ...rest} = params;
                return defaultCreateFeedItems({
                  // keep only the 10 most recent blog posts in the feed
                  blogPosts: blogPosts.filter((item, index) => index < 10),
                  ...rest,
                });
              },
            },
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'Sai Koushik Gandikota',
        logo: {
          alt: 'Sai Koushik Gandikota',
          src: 'img/favicon.ico',
        },
        items: [
          // {
          //   type: 'docSidebar',
          //   sidebarId: 'tutorialSidebar',
          //   position: 'right',
          //   label: 'Tutorial',
          // },
          // {to: '/blog', label: 'Blog', position: 'right'},
          // {
          //   href: 'https://github.com/skgandikota',
          //   label: 'GitHub',
          //   position: 'right',
          // },
        ],
      },
      footer: {
        style: 'light',
        copyright: `Copyright © ${new Date().getFullYear()} <a href="https://saikoushikg.in">Sai Koushik Gandikota</a>, Inc.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
