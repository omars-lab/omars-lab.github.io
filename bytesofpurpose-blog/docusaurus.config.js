const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

// With JSDoc @type annotations, IDEs can provide config autocompletion
/** @type {import('@docusaurus/types').DocusaurusConfig} */
(
  module.exports = {
    title: 'BytesOfPurpose',
    tagline: 'Purpose code, one byte at a time.',
    url: 'https://blog.bytesofpurpose.com',
    baseUrl: '/',
    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',
    favicon: 'img/favicon.ico',
    organizationName: 'omars-lab', // Usually your GitHub org/user name.
    projectName: 'omars-lab.github.io', // Usually your repo name.
    trailingSlash: false,

    presets: [
      [
        '@docusaurus/preset-classic',
        /** @type {import('@docusaurus/preset-classic').Options} */
        (
          {
            docs: {
              sidebarPath: require.resolve('./sidebars.js'),
              // Please change this to your repo.
              editUrl: 'https://github.com/omars-lab/omars-lab.github.io/edit/master/bytesofpurpose-blog/',
            },
            blog: {
              showReadingTime: true,
              // Please change this to your repo.
              editUrl:
                'https://github.com/omars-lab/omars-lab.github.io/edit/master/bytesofpurpose-blog/blog/',
            },
            theme: {
              customCss: require.resolve('./src/css/custom.css'),
            },
          }
        ),
      ],
    ],

    plugins: [
      '@docusaurus/plugin-google-analytics',
      // '@docusaurus/plugin-google-gtag',
      [
        '@docusaurus/plugin-sitemap',
        {
          changefreq: 'weekly',
          priority: 0.5,
          trailingSlash: false,
        },
      ],
    ],

    themeConfig: (
      /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
      ({
        navbar: {
          title: 'BytesOfPurpose',
          logo: {
            alt: 'BytesOfPurpose Logo',
            src: 'img/logo.svg',
          },
          items: [
            {
              label: 'Tutorial',
              type: 'doc', docId: 'intro',
              position: 'left',
            },
            {
              label: 'Blog', 
              to: '/blog', 
              position: 'left'
            },
            {
              label: 'GitHub',
              href: 'https://github.com/omars-lab/omars-lab.github.io',
              position: 'right',
            },
            {
              label: 'LinkedIn',
              href: 'https://www.linkedin.com/in/oeid/',
              position: 'right',
            },
            {
              label: 'Portfolio',
              href: 'https://www.bytesofpurpose.com',
              position: 'right',
            },
          ],
        },
        footer: {
          style: 'dark',
          links: [
            {
              title: 'Docs',
              items: [
                {
                  label: 'Tutorial',
                  to: '/docs/intro',
                },
              ],
            },
            {
              title: 'Community',
              items: [
                {
                  label: 'Stack Overflow',
                  href: 'https://stackoverflow.com/questions/tagged/docusaurus',
                },
                {
                  label: 'Discord',
                  href: 'https://discordapp.com/invite/docusaurus',
                },
                {
                  label: 'Twitter',
                  href: 'https://twitter.com/docusaurus',
                },
              ],
            },
            {
              title: 'More',
              items: [
                {
                  label: 'Blog',
                  to: '/blog',
                },
                {
                  label: 'GitHub',
                  href: 'https://github.com/omars-lab/omars-lab.github.io',
                },
              ],
            },
          ],
          copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
        },
        prism: {
          theme: lightCodeTheme,
          darkTheme: darkCodeTheme,
        },
        /** @docusaurus/plugin-google-analytics */
        googleAnalytics: {
          trackingID: 'G-79YSEH7T7X'
        },
        /** @docusaurus/plugin-google-gtag */
        // gtag: {
        //   trackingID: 'G-79YSEH7T7X'
        // },
      })
    ),
  }
);
