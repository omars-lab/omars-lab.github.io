const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

// With JSDoc @type annotations, IDEs can provide config autocompletion
/** @type {import('@docusaurus/types').DocusaurusConfig} */
(
  module.exports = {
    title: 'Bytes of Purpose',
    tagline: 'Purposeful code, one byte at a time.',
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
	            remarkPlugins: [
                require('mdx-mermaid'),
                // in package.json: "remarkable-plantuml": "^1.1.0",
                // (md) => {
                //   require('remarkable-plantuml')(md, {base_path: './static'});
                // }
              ],
              sidebarPath: require.resolve('./sidebars.js'),
              // Please change this to your repo.
              editUrl: 'https://github.com/omars-lab/omars-lab.github.io/edit/master/bytesofpurpose-blog/',
            },
            blog: {
	            remarkPlugins: [require('mdx-mermaid')],
              showReadingTime: true,
              editUrl:
                'https://github.com/omars-lab/omars-lab.github.io/edit/master/bytesofpurpose-blog/blog/',
            },
            pages: {
              path: 'src/pages',
              routeBasePath: '/',
              include: ['**/*.{js,jsx,ts,tsx,md,mdx}'],
              exclude: [
                '**/_*.{js,jsx,ts,tsx,md,mdx}',
                '**/_*/**',
                '**/*.test.{js,jsx,ts,tsx}',
                '**/__tests__/**',
              ],
              mdxPageComponent: '@theme/MDXPage',
              remarkPlugins: [require('mdx-mermaid')],
              rehypePlugins: [],
              beforeDefaultRemarkPlugins: [],
              beforeDefaultRehypePlugins: [],
            },
            theme: {
              customCss: require.resolve('./src/css/custom.css'),
            },
            // gtag: {
            //   trackingID: 'G-79YSEH7T7X'
            // },
            gtag: {
              trackingID: 'G-79YSEH7T7X',
              anonymizeIP: false,
            },
            // googleAnalytics: {
            //   trackingID: 'G-79YSEH7T7X',
            //   anonymizeIP: true,
            // },
          }
        ),
      ],
    ],

    plugins: [
      // [
      //   '@docusaurus/plugin-sitemap',
      //   {
      //     changefreq: 'weekly',
      //     priority: 0.5,
      //   },
      // ],
      // [
      //   '@docusaurus/plugin-google-analytics',
      //   {
      //     trackingID: 'G-79YSEH7T7X',
      //     anonymizeIP: false,
      //   },
      // ],
    ],

    themes: ['@docusaurus/theme-live-codeblock'],
    
    themeConfig: 
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
              label: 'Docs',
              type: 'doc', docId: 'structure',
              position: 'left',
            },
            {
              label: 'Posts', 
              to: '/blog', 
              position: 'left'
            },
            {
              label: 'Ideas', 
              type: 'doc', docId: 'comming-soon/overview',
              position: 'left'
            },
            {
              label: 'Support',
              href: 'https://www.paypal.com/donate?business=UQ2SHCNPFYBJY&amount=1&no_recurring=0&item_name=Support+a+Developer&currency_code=USD',
              position: 'right',

            }
          ],
        },
        footer: {
          style: 'dark',
          links: [
            {
              title: 'Contact',
              items: [
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
                  label: 'Email',
                  href: 'mailto:contact@bytesofpurpose.com',
                  position: 'right',
                },
                {
                  label: 'Support',
                  href: 'https://www.paypal.com/donate?business=UQ2SHCNPFYBJY&amount=1&no_recurring=0&item_name=Support+a+Developer&currency_code=USD',
                  position: 'right',
                },
              ]
            },
            {
              title: 'Other Works',
              items: [
                {
                  label: 'Portfolio',
                  href: 'https://www.bytesofpurpose.com',
                  position: 'right',
                },
              ],
            },
          ],
          copyright: `Copyright © ${new Date().getFullYear()} BytesOfPurpose, Inc. Built with Docusaurus.`,
        },
        prism: {
          theme: lightCodeTheme,
          darkTheme: darkCodeTheme,
        },
      }),
  }
);
