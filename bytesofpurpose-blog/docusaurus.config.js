const {themes} = require('prism-react-renderer');
const lightTheme = themes.github;
const darkTheme = themes.dracula;

// With JSDoc @type annotations, IDEs can provide config autocompletion
/** @type {import('@docusaurus/types').DocusaurusConfig} */
(
  module.exports = {
    title: 'Bytes of Purpose',
    tagline: 'Purposeful code, one byte at a time.',
    url: 'https://blog.bytesofpurpose.com',
    baseUrl: '/',
    // onBrokenLinks: 'throw',
    onBrokenLinks: 'warn',
    onBrokenMarkdownLinks: 'warn',
    favicon: 'img/favicon.ico',
    organizationName: 'omars-lab', // Usually your GitHub org/user name.
    projectName: 'omars-lab.github.io', // Usually your repo name.
    trailingSlash: false,
    staticDirectories: ['static'],
    markdown: {
      mermaid: true,
    },
    presets: [
      [
        '@docusaurus/preset-classic',
        /** @type {import('@docusaurus/preset-classic').Options} */
        (
          {
            docs: {
	            // remarkPlugins: [
              //   require('mdx-mermaid'),
                // in package.json: "remarkable-plantuml": "^1.1.0",
                // (md) => {
                //   require('remarkable-plantuml')(md, {base_path: './static'});
                // }
              // ],
              sidebarPath: require.resolve('./sidebars.js'),
              // Please change this to your repo.
              editUrl: 
                'https://github.com/omars-lab/omars-lab.github.io/edit/master/bytesofpurpose-blog/',
            },
            blog: {
              blogSidebarTitle: 'Posts',
              blogSidebarCount: 'ALL',
	            // remarkPlugins: [require('mdx-mermaid')],
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
              // remarkPlugins: [require('mdx-mermaid')],
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
      // https://docusaurus.io/docs/blog#multiple-blogs
      [
        '@docusaurus/plugin-content-blog',
        {
          /**
           * Required for any multi-instance plugin
           */
          id: 'designs',
          /**
           * URL route for the blog section of your site.
           * *DO NOT* include a trailing slash.
           */
          routeBasePath: 'designs',
          /**
           * Path to data on filesystem relative to site dir.
           */
          path: './designs',
          blogSidebarTitle: 'Posts',
          blogSidebarCount: 'ALL',
          // remarkPlugins: [require('mdx-mermaid')],
          showReadingTime: true,
          editUrl:
            'https://github.com/omars-lab/omars-lab.github.io/edit/master/bytesofpurpose-blog/designs/',
        },
      ],
    ],

    themes: [
      '@docusaurus/theme-live-codeblock',
      '@docusaurus/theme-mermaid'
    ],
    themeConfig: 
      /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
      ({
        navbar: {
          title: 'BytesOfPurpose',
          logo: {
            alt: 'BytesOfPurpose Logo',
            // https://docusaurus.io/docs/api/themes/configuration
            src: 'img/logo.svg',
            srcDark: 'img/logo_dark.svg',
          },
          items: [
            {
              label: 'Docs',
              type: 'doc', docId: 'welcome/README',
              position: 'left',
            },
            {
              label: 'Posts', 
              to: '/blog', 
              position: 'left'
            },
            {
              label: 'Designs', 
              to: '/designs', 
              position: 'left'
            },
            {
              label: 'Components', 
              to: '/storybook/', 
              position: 'left'
            },
            // {
            //   label: 'Ideas', 
            //   to: '/blog/process-blog-post-ideation', 
            //   position: 'left'
            // },
            {
              // label: 'Support',
              type: 'html',
              value: '<a class="navbar__brand" href="https://www.paypal.com/donate?business=UQ2SHCNPFYBJY&amount=1&no_recurring=0&item_name=Support+a+Developer&currency_code=USD"><div class="navbar__logo"><img src="/img/support.svg" class="themedImage_node_modules-@docusaurus-theme-classic-lib-next-theme-ThemedImage-styles-module themedImage--light_node_modules-@docusaurus-theme-classic-lib-next-theme-ThemedImage-styles-module"></img></div><b class="navbar__title text--truncate">Buy Me a Coffee?</b></a>',
              // href: 'https://www.paypal.com/donate?business=UQ2SHCNPFYBJY&amount=1&no_recurring=0&item_name=Support+a+Developer&currency_code=USD',
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
                  href: 'mailto:contact@rythome.com',
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
                {
                  label: 'Resume',
                  href: 'https://www.bytesofpurpose.com/resume.pdf',
                  position: 'right',
                },
              ],
            },
          ],
          copyright: `Copyright © ${new Date().getFullYear()} BytesOfPurpose, Inc. Built with Docusaurus.`,
        },
        prism: {
          theme: lightTheme,
          darkTheme: darkTheme,
        },
        metadata: [
          {name: 'twitter:card', content: 'summary_large_image'},
          {name: 'twitter:site', content: '@rythome'},
          {name: 'twitter:creator', content: '@rythome'},
          {property: 'og:type', content: 'website'},
          {property: 'og:site_name', content: 'Bytes of Purpose'},
          {property: 'og:locale', content: 'en_US'},
        ],
        mermaid: {
          options: {
            theme: 'forest',
            fontFamily: "Trebuchet MS, Verdana, Arial, Sans-Serif",
            htmlLabels: true,
          },
        },
        image: 'img/logo.svg',
      }),
  }
);
