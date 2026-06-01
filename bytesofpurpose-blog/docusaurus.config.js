const {themes} = require('prism-react-renderer');
// oneLight/oneDark have higher token contrast than github/dracula (whose comment
// tokens fail WCAG AA), so syntax-highlighted code meets contrast requirements.
const lightTheme = themes.oneLight;
const darkTheme = themes.oneDark;

// A11y: label GFM task-list checkboxes (else axe/WCAG "label" rule fails).
const rehypeTaskListLabels = require('./plugins/rehype-task-list-labels');

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
    // Left as 'warn' (the default) on purpose: src/pages/changelog.tsx deliberately
    // SHADOWS the changelog blog-instance's auto-generated index at /changelog (the
    // custom React page is the intended view; the blog plugin only exists to serve
    // the individual /changelog/<entry> pages, and Docusaurus has no flag to suppress
    // a blog instance's index route). That intentional page-over-blog shadow would
    // make 'throw' fail every build. Accidental DOC route collisions from the topic
    // reorg are caught instead by the per-phase route-manifest diff (find build
    // -name '*.html' vs baseline), which is exact and doesn't false-positive on this
    // intentional shadow. The genuinely-accidental dup this surfaced (a duplicate
    // content-docs-changelog-system-documentation .md AND .mdx) was removed.
    // onDuplicateRoutes: 'throw',
    favicon: 'img/favicon.ico',
    organizationName: 'omars-lab', // Usually your GitHub org/user name.
    projectName: 'omars-lab.github.io', // Usually your repo name.
    trailingSlash: false,
    staticDirectories: ['static'],
    // PostHog analytics: key is a public, write-only project key (safe to ship in
    // client bundle). Set POSTHOG_KEY / POSTHOG_HOST at build time to enable.
    customFields: {
      posthogKey: process.env.POSTHOG_KEY || '',
      posthogHost: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
      // Test-only: opt out of PostHog's bot/UA filter so e2e (Playwright) events
      // reach ingestion. Never set in production builds.
      posthogTestMode: process.env.POSTHOG_TEST_MODE === '1',
    },
    clientModules: [require.resolve('./src/posthog.js')],
    // Load the Inter variable font for UI/body text (see --ifm-font-family-base in
    // src/css/custom.css). Preconnect first so the stylesheet fetch is not blocked.
    headTags: [
      {
        tagName: 'link',
        attributes: {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
      },
      {
        tagName: 'link',
        attributes: {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: 'anonymous',
        },
      },
      {
        tagName: 'link',
        attributes: {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
        },
      },
    ],
    markdown: {
      mermaid: true,
      hooks: {
        onBrokenMarkdownLinks: 'warn',
      },
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
              rehypePlugins: [rehypeTaskListLabels],
              // Please change this to your repo.
              editUrl:
                'https://github.com/omars-lab/omars-lab.github.io/edit/master/bytesofpurpose-blog/',
            },
            blog: {
              blogSidebarTitle: 'Posts',
              blogSidebarCount: 'ALL',
              rehypePlugins: [rehypeTaskListLabels],
              // SEO: give the blog index a real title + meta description (the
              // default description was just "Blog" — ~4 chars, fails SEO checks).
              blogTitle: 'Bytes of Purpose — Blog',
              blogDescription:
                'Software engineering blog posts by Omar Eid: practical techniques, system design, GenAI, and lessons from building real-world software.',
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
      // Exposes the 3 most recent published blog posts as global data for the
      // homepage "Latest from the blog" strip (see plugins/recent-posts).
      [require.resolve('./plugins/recent-posts'), {count: 3}],
      // Exposes draft-doc permalinks as global data so the dev-only sidebar
      // swizzle can badge drafts (see plugins/draft-docs + theme/DocSidebarItem).
      require.resolve('./plugins/draft-docs'),
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
      // Serve changelog markdown files as blog posts
      // Similar to how designs blog plugin supports multiple instances with id
      [
        '@docusaurus/plugin-content-blog',
        {
          /**
           * Required for any multi-instance plugin
           */
          id: 'changelog',
          /**
           * URL route for the changelog section of your site.
           * *DO NOT* include a trailing slash.
           */
          routeBasePath: 'changelog',
          /**
           * Path to data on filesystem relative to site dir.
           */
          path: './changelog',
          blogSidebarTitle: 'Changelog Entries',
          blogSidebarCount: 'ALL',
          // remarkPlugins: [require('mdx-mermaid')],
          showReadingTime: true,
          editUrl:
            'https://github.com/omars-lab/omars-lab.github.io/edit/master/bytesofpurpose-blog/changelog/',
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
              label: 'Learn',
              type: 'doc', docId: 'welcome/README',
              position: 'left',
            },
            {
              label: 'Blog',
              to: '/blog',
              position: 'left'
            },
            {
              label: 'System Designs',
              to: '/designs',
              position: 'left'
            },
            // 'Components' (Storybook) moved OUT of the navbar to the footer as
            // "Blob UI Kit Building Blocks" — a builder surface, not a primary
            // reader destination. See footer "Other Works".
            {
              label: "What's New",
              to: '/changelog',
              position: 'left'
            },
            // {
            //   label: 'Ideas', 
            //   to: '/blog/process-blog-post-ideation', 
            //   position: 'left'
            // },
            {
              // Support / "Buy Me a Coffee" link, wired into the support-button-copy
              // A/B experiment so its copy varies site-wide (control "Buy me a
              // coffee ☕" / test "Support the dev 💜"). Backed by the NavbarCoffee
              // React component via the custom navbar item type registered in
              // src/theme/NavbarItem/ComponentTypes.tsx. Styling: .navbar-coffee in
              // custom.css. Emoji + text (no <img>) keeps it alt-text clean.
              type: 'custom-coffee',
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
                {
                  // Storybook component library — a builder surface, moved here
                  // from the navbar (reader-facing nav stays focused on Learn /
                  // Blog / System Designs / What's New).
                  label: 'Blob UI Kit Building Blocks',
                  to: '/storybook/',
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
        // Social/OG card — purpose-built 1200x630 landscape card (the standard
        // large-card size for OG/Twitter). Brand gradient + lightbulb mark +
        // wordmark/tagline. Source SVG: static/img/social-card.svg, rendered to
        // PNG via `rsvg-convert -w 1200 -h 630 social-card.svg -o social-card.png`.
        image: 'img/social-card.png',
      }),
  }
);
