const {themes} = require('prism-react-renderer');
// oneLight/oneDark have higher token contrast than github/dracula (whose comment
// tokens fail WCAG AA), so syntax-highlighted code meets contrast requirements.
const lightTheme = themes.oneLight;
const darkTheme = themes.oneDark;

// A11y: label GFM task-list checkboxes (else axe/WCAG "label" rule fails).
const rehypeTaskListLabels = require('./plugins/rehype-task-list-labels');

// Premium hard-gate: encrypt `premium: true` doc bodies at MDX-compile time (rehype stage)
// so plaintext is in NEITHER the built HTML NOR the JS bundle. No-ops without
// STATICRYPT_PASSPHRASE (dev/authoring). See the premium-content-gating design.
const rehypePremiumEncrypt = require('./plugins/rehype-premium-encrypt');

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
    // onBrokenAnchors stays 'warn' (default) for a SECOND intentional reason: the
    // premium-gating-demo page (premium: true) has its body encrypted at MDX-compile,
    // which removes the "The gated body" heading from the public HTML while its
    // auto-generated table-of-contents anchor (#the-gated-body) remains. That is the
    // gate working as designed (the heading returns once a signed-in reader decrypts),
    // so it surfaces ONLY in the encrypted (build-premium) build and must not be
    // "fixed" by editing the doc — a stray comment/word in a premium body leaks into
    // the JS bundle and trips the V5 leak gate. Left as a known, expected warning.
    onBrokenAnchors: 'warn',
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
    // gtag-guard MUST come before posthog (and before the gtag plugin's own
    // client module): it stubs window.gtag so the plugin's unguarded route-change
    // call can't throw when an ad-blocker blocks Google Tag, AND it detects that
    // block + reports it to PostHog ($adblock_detected). See src/gtag-guard.js.
    clientModules: [
      require.resolve('./src/gtag-guard.js'),
      require.resolve('./src/posthog.js'),
      // Traveling flow-dot for opt-in `.mermaid-animated` diagrams (system-design posts).
      require.resolve('./src/mermaid-flow-dot.js'),
    ],
    // Editorial type system, mirroring the portfolio (bytesofpurpose.com):
    //   Fraunces — display serif for headings (optical-size axis + italic)
    //   Geist    — sans for UI/body text
    // See --ifm-heading-font-family / --ifm-font-family-base in src/css/custom.css.
    // Preconnect first so the stylesheet fetch is not blocked.
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
          href: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,600&family=Geist:wght@400;500;600;700&display=swap',
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
            // The docs are TWO independent instances — `craft` and `self` (registered
            // as standalone plugin-content-docs in `plugins` below), each with its OWN
            // route root (/craft, /self) and OWN sidebar, so the Craft sidebar never
            // shows Self and vice-versa. The preset's default docs instance is disabled.
            docs: false,
            blog: {
              // Served at /thoughts (matches the 'Thoughts' navbar item + the
              // homepage "Browse My Thoughts" card). Old /blog/* URLs 301 → /thoughts/*
              // via client-redirects below.
              routeBasePath: 'thoughts',
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
      // DEV ONLY: proxy /api/* → the real prod Worker so localhost behaves like
      // prod for premium gating (the Worker vends the unlock key). No-op in
      // `yarn build` (see plugins/dev-api-proxy).
      require.resolve('./plugins/dev-api-proxy'),
      // 🛠️ Craft — its OWN docs instance (outrospective: the professional topics).
      // Separate instance + route root (/craft) + sidebar so clicking Craft shows ONLY
      // craft topics; Self is a different instance entirely.
      [
        '@docusaurus/plugin-content-docs',
        {
          id: 'craft',
          path: 'docs/craft',
          routeBasePath: 'craft',
          sidebarPath: require.resolve('./sidebars-craft.js'),
          rehypePlugins: [rehypeTaskListLabels, rehypePremiumEncrypt],
          editUrl:
            'https://github.com/omars-lab/omars-lab.github.io/edit/master/bytesofpurpose-blog/',
        },
      ],
      // 🪞 Journey — its OWN docs instance (introspective: faith + personal growth).
      // Served at /journey (folder docs/journey). The plugin `id` stays 'self'
      // internally so sidebarId/docsPluginId references don't churn; only the
      // reader-facing path + route are 'journey'. Old /self/* URLs 301 → /journey/*
      // via client-redirects below.
      [
        '@docusaurus/plugin-content-docs',
        {
          id: 'self',
          path: 'docs/journey',
          routeBasePath: 'journey',
          sidebarPath: require.resolve('./sidebars-self.js'),
          rehypePlugins: [rehypeTaskListLabels, rehypePremiumEncrypt],
          editUrl:
            'https://github.com/omars-lab/omars-lab.github.io/edit/master/bytesofpurpose-blog/',
        },
      ],
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
      // Preserve old URLs after the mental-models IA migration. The cross-cutting
      // /mental-models/* slug namespace was dissolved into per-topic mental-models/
      // subdirs; docs are served under the /docs route prefix, so the live old URLs
      // are /docs/mental-models/... — redirect each to its new topic-first slug. Also
      // redirects the Docs-vs-Blogs post that moved from /blog/ into the blogging docs.
      // (Keep this list in lockstep with the slug edits; the legacy-namespace validator
      // rule prevents NEW /mental-models/* slugs from reappearing.)
      [
        '@docusaurus/plugin-client-redirects',
        {
          redirects: [
            {from: "/welcome", to: "/"},
            // Two-instance split (craft @ /craft, self @ /self): preserve BOTH prior URL
            // generations (original themed slugs AND interim /docs/craft|self/* slugs) →
            // final /craft|self/* permalinks. draft:true targets omitted (prod-excluded).
            {from: "/blog/docs-vs-blog-posts", to: "/craft/blogging/docs-vs-blog-posts"},
            {from: "/docs/blogging", to: "/craft/blogging"},
            {from: "/docs/companies", to: "/craft/companies"},
            {from: "/docs/companies/mental-models", to: "/craft/companies/mental-models"},
            {from: "/docs/companies/mental-models/career-levels/staff-engineer-traits", to: "/craft/companies/mental-models/career-levels/2025-10-02-staff-engineer-traits"},
            {from: "/docs/companies/mental-models/career-levels/understanding-sde-levels", to: "/craft/companies/mental-models/career-levels/understanding-differences-in-skills"},
            {from: "/docs/companies/mental-models/cultural-values/understanding-tech-company-culture", to: "/craft/companies/mental-models/cultural-values/2025-09-25-understanding-cultural-values"},
            {from: "/docs/companies/mental-models/cultural-values/understanding-zapier-values", to: "/craft/companies/mental-models/cultural-values/2025-09-25-understanding-zapier-values"},
            {from: "/docs/companies/mental-models/skills/leadership-principles-companies-look-for", to: "/craft/companies/mental-models/skills/understanding-desireable-leadership-skills"},
            {from: "/docs/companies/mental-models/skills/soft-skills-interview-evaluation", to: "/craft/companies/mental-models/skills/understanding-desireable-soft-skills"},
            {from: "/docs/companies/mental-models/skills/technical-skills-interview-evaluation", to: "/craft/companies/mental-models/skills/understanding-desireable-tech-skills"},
            {from: "/docs/companies/terminology", to: "/craft/companies/terminology"},
            {from: "/docs/craft", to: "/craft"},
            {from: "/docs/craft/blogging", to: "/craft/blogging"},
            {from: "/docs/craft/blogging/adding-content", to: "/craft/blogging/adding-content"},
            {from: "/docs/craft/blogging/adding-content/adding-blog-posts", to: "/craft/blogging/adding-content/adding-blog-posts"},
            {from: "/docs/craft/blogging/adding-content/adding-changelog-entries", to: "/craft/blogging/adding-content/adding-changelog-entries"},
            {from: "/docs/craft/blogging/adding-content/adding-designs", to: "/craft/blogging/adding-content/adding-designs"},
            {from: "/docs/craft/blogging/adding-content/adding-docs", to: "/craft/blogging/adding-content/adding-docs"},
            {from: "/docs/craft/blogging/automation", to: "/craft/blogging/automation"},
            {from: "/docs/craft/blogging/automation/http-to-xcallback", to: "/craft/blogging/automation/http-to-xcallback"},
            {from: "/docs/craft/blogging/blog-post-triggers", to: "/craft/blogging/blog-post-triggers"},
            {from: "/docs/craft/blogging/changelog-system", to: "/craft/blogging/changelog-system"},
            {from: "/docs/craft/blogging/diagramming", to: "/craft/blogging/diagramming"},
            {from: "/docs/craft/blogging/diagramming/diagramming-with-plantuml", to: "/craft/blogging/diagramming/diagramming-with-plantuml"},
            {from: "/docs/craft/blogging/diagramming/diagrams-as-text", to: "/craft/blogging/diagramming/diagrams-as-text"},
            {from: "/docs/craft/blogging/diagramming/getting-icons", to: "/craft/blogging/diagramming/getting-icons"},
            {from: "/docs/craft/blogging/docs-vs-blog-posts", to: "/craft/blogging/docs-vs-blog-posts"},
            {from: "/docs/craft/blogging/embed-code", to: "/craft/blogging/embed-code"},
            {from: "/docs/craft/blogging/embed-code/code-cells", to: "/craft/blogging/embed-code/code-cells"},
            {from: "/docs/craft/blogging/embed-code/code-gists", to: "/craft/blogging/embed-code/code-gists"},
            {from: "/docs/craft/blogging/embed-code/code-jupyter-notebooks", to: "/craft/blogging/embed-code/code-jupyter-notebooks"},
            {from: "/docs/craft/blogging/embed-diagrams", to: "/craft/blogging/embed-diagrams"},
            {from: "/docs/craft/blogging/embed-diagrams/diagrams-figma", to: "/craft/blogging/embed-diagrams/diagrams-figma"},
            {from: "/docs/craft/blogging/embed-diagrams/diagrams-flow-charts", to: "/craft/blogging/embed-diagrams/diagrams-flow-charts"},
            {from: "/docs/craft/blogging/embed-diagrams/diagrams-google-drawing", to: "/craft/blogging/embed-diagrams/diagrams-google-drawing"},
            {from: "/docs/craft/blogging/embed-diagrams/diagrams-kanban-customization", to: "/craft/blogging/embed-diagrams/diagrams-kanban-customization"},
            {from: "/docs/craft/blogging/embed-diagrams/diagrams-mermaid", to: "/craft/blogging/embed-diagrams/diagrams-mermaid"},
            {from: "/docs/craft/blogging/embed-diagrams/diagrams-puml-sequence", to: "/craft/blogging/embed-diagrams/diagrams-puml-sequence"},
            {from: "/docs/craft/blogging/embed-external-components", to: "/craft/blogging/embed-external-components"},
            {from: "/docs/craft/blogging/embed-external-components/html-react-elements", to: "/craft/blogging/embed-external-components/html-react-elements"},
            {from: "/docs/craft/blogging/embed-external-components/images-svgs", to: "/craft/blogging/embed-external-components/images-svgs"},
            {from: "/docs/craft/blogging/embed-external-components/tips", to: "/craft/blogging/embed-external-components/tips"},
            {from: "/docs/craft/blogging/embed-external-components/videos-youtube", to: "/craft/blogging/embed-external-components/videos-youtube"},
            {from: "/docs/craft/blogging/embed-structural-components", to: "/craft/blogging/embed-structural-components"},
            {from: "/docs/craft/blogging/embed-structural-components/adding-truncate-sections", to: "/craft/blogging/embed-structural-components/adding-truncate-sections"},
            {from: "/docs/craft/blogging/embed-structural-components/card", to: "/craft/blogging/embed-structural-components/card"},
            {from: "/docs/craft/blogging/embed-structural-components/details", to: "/craft/blogging/embed-structural-components/details"},
            {from: "/docs/craft/blogging/embed-structural-components/fancy-button", to: "/craft/blogging/embed-structural-components/fancy-button"},
            {from: "/docs/craft/blogging/embed-structural-components/footer", to: "/craft/blogging/embed-structural-components/footer"},
            {from: "/docs/craft/blogging/embed-structural-components/graph", to: "/craft/blogging/embed-structural-components/graph"},
            {from: "/docs/craft/blogging/embed-structural-components/header", to: "/craft/blogging/embed-structural-components/header"},
            {from: "/docs/craft/blogging/embed-structural-components/highlight", to: "/craft/blogging/embed-structural-components/highlight"},
            {from: "/docs/craft/blogging/embed-structural-components/links", to: "/craft/blogging/embed-structural-components/links"},
            {from: "/docs/craft/blogging/embed-structural-components/table-of-content", to: "/craft/blogging/embed-structural-components/table-of-content"},
            {from: "/docs/craft/blogging/embed-structural-components/timeline", to: "/craft/blogging/embed-structural-components/timeline"},
            {from: "/docs/craft/blogging/prompts", to: "/craft/blogging/prompts"},
            {from: "/docs/craft/blogging/prompts/blog-post-author", to: "/craft/blogging/prompts/blog-post-author"},
            {from: "/docs/craft/blogging/prompts/docusaurus-maintenance-system", to: "/craft/blogging/prompts/docusaurus-maintenance-system"},
            {from: "/docs/craft/blogging/prompts/evals", to: "/craft/blogging/prompts/evals"},
            {from: "/docs/craft/blogging/prompts/evals/all-posts/audience-impression-check", to: "/craft/blogging/prompts/evals/all-posts/audience-impression-check"},
            {from: "/docs/craft/blogging/prompts/evals/all-posts/evaluating-blog-personality", to: "/craft/blogging/prompts/evals/all-posts/evaluating-blog-personality"},
            {from: "/docs/craft/blogging/prompts/evals/all-posts/evaluating-content-quality", to: "/craft/blogging/prompts/evals/all-posts/evaluating-content-quality"},
            {from: "/docs/craft/blogging/prompts/evals/all-posts/general-blog-evaluation", to: "/craft/blogging/prompts/evals/all-posts/general-blog-evaluation"},
            {from: "/docs/craft/blogging/prompts/evals/specific-posts/evaluating-docs-vs-blogs", to: "/craft/blogging/prompts/evals/specific-posts/evaluating-docs-vs-blogs"},
            {from: "/docs/craft/blogging/prompts/evals/specific-posts/evaluating-my-approach", to: "/craft/blogging/prompts/evals/specific-posts/evaluating-my-approach"},
            {from: "/docs/craft/blogging/prompts/evals/specific-posts/evaluating-my-contributions", to: "/craft/blogging/prompts/evals/specific-posts/evaluating-my-contributions"},
            {from: "/docs/craft/blogging/prompts/evals/specific-posts/evaluating-zapier-values", to: "/craft/blogging/prompts/evals/specific-posts/evaluating-zapier-values"},
            {from: "/docs/craft/blogging/prompts/prompt-maturity-framework", to: "/craft/blogging/prompts/prompt-maturity-framework"},
            {from: "/docs/craft/blogging/prompts/role-refactoring-system", to: "/craft/blogging/prompts/role-refactoring-system"},
            {from: "/docs/craft/companies", to: "/craft/companies"},
            {from: "/docs/craft/companies/mental-models", to: "/craft/companies/mental-models"},
            {from: "/docs/craft/companies/mental-models/career-levels/2025-10-02-staff-engineer-traits", to: "/craft/companies/mental-models/career-levels/2025-10-02-staff-engineer-traits"},
            {from: "/docs/craft/companies/mental-models/career-levels/understanding-differences-in-skills", to: "/craft/companies/mental-models/career-levels/understanding-differences-in-skills"},
            {from: "/docs/craft/companies/mental-models/cultural-values/2025-09-25-understanding-cultural-values", to: "/craft/companies/mental-models/cultural-values/2025-09-25-understanding-cultural-values"},
            {from: "/docs/craft/companies/mental-models/cultural-values/2025-09-25-understanding-zapier-values", to: "/craft/companies/mental-models/cultural-values/2025-09-25-understanding-zapier-values"},
            {from: "/docs/craft/companies/mental-models/skills/understanding-desireable-leadership-skills", to: "/craft/companies/mental-models/skills/understanding-desireable-leadership-skills"},
            {from: "/docs/craft/companies/mental-models/skills/understanding-desireable-soft-skills", to: "/craft/companies/mental-models/skills/understanding-desireable-soft-skills"},
            {from: "/docs/craft/companies/mental-models/skills/understanding-desireable-tech-skills", to: "/craft/companies/mental-models/skills/understanding-desireable-tech-skills"},
            {from: "/docs/craft/companies/skills", to: "/craft/companies/skills"},
            {from: "/docs/craft/companies/skills/dealing-with-ambiguity", to: "/craft/companies/skills/dealing-with-ambiguity"},
            {from: "/docs/craft/companies/skills/dealing-with-challenges", to: "/craft/companies/skills/dealing-with-challenges"},
            {from: "/docs/craft/companies/skills/managing-complexity", to: "/craft/companies/skills/managing-complexity"},
            {from: "/docs/craft/companies/skills/my-problem-solving-approach", to: "/craft/companies/skills/my-problem-solving-approach"},
            {from: "/docs/craft/companies/terminology", to: "/craft/companies/terminology"},
            {from: "/docs/craft/entrepreneurship", to: "/craft/entrepreneurship"},
            {from: "/docs/craft/generative-ai", to: "/craft/generative-ai"},
            {from: "/docs/craft/generative-ai/building-systems/approach-in-building-systems", to: "/craft/generative-ai/building-systems/approach-in-building-systems"},
            {from: "/docs/craft/generative-ai/building-systems/capabilities-of-agentic-systems", to: "/craft/generative-ai/building-systems/capabilities-of-agentic-systems"},
            {from: "/docs/craft/generative-ai/building-systems/designing-genai-systems", to: "/craft/generative-ai/building-systems/designing-genai-systems"},
            {from: "/docs/craft/generative-ai/building-systems/example-genai-system-customer-support", to: "/craft/generative-ai/building-systems/example-genai-system-customer-support"},
            {from: "/docs/craft/generative-ai/building-systems/example-genai-system-financial-services", to: "/craft/generative-ai/building-systems/example-genai-system-financial-services"},
            {from: "/docs/craft/generative-ai/building-systems/example-poc-to-prod-execution-plan", to: "/craft/generative-ai/building-systems/example-poc-to-prod-execution-plan"},
            {from: "/docs/craft/generative-ai/building-systems/preparing-genai-systems-for-production", to: "/craft/generative-ai/building-systems/preparing-genai-systems-for-production"},
            {from: "/docs/craft/generative-ai/mental-models", to: "/craft/generative-ai/mental-models"},
            {from: "/docs/craft/generative-ai/mental-models/2025-06-15-ai-engineer-world-fair", to: "/craft/generative-ai/mental-models/2025-06-15-ai-engineer-world-fair"},
            {from: "/docs/craft/generative-ai/mental-models/2025-07-30-understanding-the-fundamentals-of-genai", to: "/craft/generative-ai/mental-models/2025-07-30-understanding-the-fundamentals-of-genai"},
            {from: "/docs/craft/generative-ai/mental-models/2025-10-04-learning-about-genai", to: "/craft/generative-ai/mental-models/2025-10-04-learning-about-genai"},
            {from: "/docs/craft/generative-ai/mental-models/2025-11-10-ai-framework-landscape", to: "/craft/generative-ai/mental-models/2025-11-10-ai-framework-landscape"},
            {from: "/docs/craft/generative-ai/my-genai-workflow/running-llms-locally", to: "/craft/generative-ai/my-genai-workflow/running-llms-locally"},
            {from: "/docs/craft/interview-prep", to: "/craft/interview-prep"},
            {from: "/docs/craft/interview-prep/coding-challenges", to: "/craft/interview-prep/coding-challenges"},
            {from: "/docs/craft/interview-prep/coding-challenges/algorithm-patterns", to: "/craft/interview-prep/coding-challenges/algorithm-patterns"},
            {from: "/docs/craft/interview-prep/coding-challenges/algorithm-patterns/bitwise-operations", to: "/craft/interview-prep/coding-challenges/algorithm-patterns/bitwise-operations"},
            {from: "/docs/craft/interview-prep/coding-challenges/algorithm-patterns/cycle-detection", to: "/craft/interview-prep/coding-challenges/algorithm-patterns/cycle-detection"},
            {from: "/docs/craft/interview-prep/coding-challenges/algorithm-patterns/look-ahead", to: "/craft/interview-prep/coding-challenges/algorithm-patterns/look-ahead"},
            {from: "/docs/craft/interview-prep/coding-challenges/algorithm-patterns/path-traversal", to: "/craft/interview-prep/coding-challenges/algorithm-patterns/path-traversal"},
            {from: "/docs/craft/interview-prep/coding-challenges/algorithm-patterns/subsets", to: "/craft/interview-prep/coding-challenges/algorithm-patterns/subsets"},
            {from: "/docs/craft/interview-prep/coding-challenges/solutions/longest-palindromic-substring", to: "/craft/interview-prep/coding-challenges/solutions/longest-palindromic-substring"},
            {from: "/docs/craft/interview-prep/mental-models", to: "/craft/interview-prep/mental-models"},
            {from: "/docs/craft/interview-prep/mental-models/data-structures-and-algorithms/understanding-dynamic-programming", to: "/craft/interview-prep/mental-models/data-structures-and-algorithms/understanding-dynamic-programming"},
            {from: "/docs/craft/interview-prep/mental-models/data-structures-and-algorithms/understanding-graphs", to: "/craft/interview-prep/mental-models/data-structures-and-algorithms/understanding-graphs"},
            {from: "/docs/craft/interview-prep/mental-models/data-structures-and-algorithms/understanding-heaps", to: "/craft/interview-prep/mental-models/data-structures-and-algorithms/understanding-heaps"},
            {from: "/docs/craft/interview-prep/mental-models/data-structures-and-algorithms/understanding-lists", to: "/craft/interview-prep/mental-models/data-structures-and-algorithms/understanding-lists"},
            {from: "/docs/craft/interview-prep/mental-models/data-structures-and-algorithms/understanding-trees", to: "/craft/interview-prep/mental-models/data-structures-and-algorithms/understanding-trees"},
            {from: "/docs/craft/interview-prep/mental-models/understanding-the-interview-process", to: "/craft/interview-prep/mental-models/understanding-the-interview-process"},
            {from: "/docs/craft/interview-prep/preparing", to: "/craft/interview-prep/preparing"},
            {from: "/docs/craft/interview-prep/preparing/personal-story-bank", to: "/craft/interview-prep/preparing/personal-story-bank"},
            {from: "/docs/craft/interview-prep/preparing/pre-meditating-responses-for-leadership-questions", to: "/craft/interview-prep/preparing/pre-meditating-responses-for-leadership-questions"},
            {from: "/docs/craft/interview-prep/preparing/preparing-for-coding-questions", to: "/craft/interview-prep/preparing/preparing-for-coding-questions"},
            {from: "/docs/craft/interview-prep/preparing/preparing-for-system-design-questions", to: "/craft/interview-prep/preparing/preparing-for-system-design-questions"},
            {from: "/docs/craft/interview-prep/preparing/preparing-for-tech-questions", to: "/craft/interview-prep/preparing/preparing-for-tech-questions"},
            {from: "/docs/craft/interview-prep/preparing/prepraring-questions-to-ask-interviewers", to: "/craft/interview-prep/preparing/prepraring-questions-to-ask-interviewers"},
            {from: "/docs/craft/interview-prep/understanding-what-companies-expect", to: "/craft/interview-prep/understanding-what-companies-expect"},
            {from: "/docs/craft/product-management", to: "/craft/product-management"},
            {from: "/docs/craft/product-management/experiments", to: "/craft/product-management/experiments"},
            {from: "/docs/craft/product-management/ideas/hello-worlds", to: "/craft/product-management/ideas/hello-worlds"},
            {from: "/docs/craft/product-management/initiatives", to: "/craft/product-management/initiatives"},
            {from: "/docs/craft/product-management/pocs", to: "/craft/product-management/pocs"},
            {from: "/docs/craft/product-management/pocs/enhancing-the-google-search-experience", to: "/craft/product-management/pocs/enhancing-the-google-search-experience"},
            {from: "/docs/craft/product-management/projects", to: "/craft/product-management/projects"},
            {from: "/docs/craft/product-management/research", to: "/craft/product-management/research"},
            {from: "/docs/craft/product-management/roadmaps/1-blog-roadmap", to: "/craft/product-management/roadmaps/1-blog-roadmap"},
            {from: "/docs/craft/product-management/roadmaps/2-portfolio-roadmap", to: "/craft/product-management/roadmaps/2-portfolio-roadmap"},
            {from: "/docs/craft/product-management/tinkering", to: "/craft/product-management/tinkering"},
            {from: "/docs/craft/productivity", to: "/craft/productivity"},
            {from: "/docs/craft/productivity/analyzing", to: "/craft/productivity/analyzing"},
            {from: "/docs/craft/productivity/analyzing/leveraging-google-analytics", to: "/craft/productivity/analyzing/leveraging-google-analytics"},
            {from: "/docs/craft/productivity/automating", to: "/craft/productivity/automating"},
            {from: "/docs/craft/productivity/automating/leveraging-shortcuts", to: "/craft/productivity/automating/leveraging-shortcuts"},
            {from: "/docs/craft/productivity/discovering", to: "/craft/productivity/discovering"},
            {from: "/docs/craft/productivity/habits-automating", to: "/craft/productivity/habits-automating"},
            {from: "/docs/craft/productivity/organizing", to: "/craft/productivity/organizing"},
            {from: "/docs/craft/productivity/processes/process-execution", to: "/craft/productivity/processes/process-execution"},
            {from: "/docs/craft/productivity/processes/process-interview", to: "/craft/productivity/processes/process-interview"},
            {from: "/docs/craft/productivity/prompts/daily-todo-carry-over", to: "/craft/productivity/prompts/daily-todo-carry-over"},
            {from: "/docs/craft/productivity/prompts/kanban-board-customization", to: "/craft/productivity/prompts/kanban-board-customization"},
            {from: "/docs/craft/productivity/terminology", to: "/craft/productivity/terminology"},
            {from: "/docs/craft/productivity/terminology/emojis", to: "/craft/productivity/terminology/emojis"},
            {from: "/docs/craft/productivity/terminology/terminology-cli", to: "/craft/productivity/terminology/terminology-cli"},
            {from: "/docs/craft/productivity/terminology/terminology-development", to: "/craft/productivity/terminology/terminology-development"},
            {from: "/docs/craft/productivity/terminology/terminology-project-management", to: "/craft/productivity/terminology/terminology-project-management"},
            {from: "/docs/craft/productivity/tool-usage", to: "/craft/productivity/tool-usage"},
            {from: "/docs/craft/productivity/tool-usage/establishing-tool-usage-patterns", to: "/craft/productivity/tool-usage/establishing-tool-usage-patterns"},
            {from: "/docs/craft/software-development", to: "/craft/software-development"},
            {from: "/docs/craft/software-development/backend-development/techniques", to: "/craft/software-development/backend-development/techniques"},
            {from: "/docs/craft/software-development/backend-development/techniques/ci-cd-techniques", to: "/craft/software-development/backend-development/techniques/ci-cd-techniques"},
            {from: "/docs/craft/software-development/backend-development/techniques/security-techniques", to: "/craft/software-development/backend-development/techniques/security-techniques"},
            {from: "/docs/craft/software-development/frontend-development/projects/website-blog", to: "/craft/software-development/frontend-development/projects/website-blog"},
            {from: "/docs/craft/software-development/frontend-development/projects/website-portfolio", to: "/craft/software-development/frontend-development/projects/website-portfolio"},
            {from: "/docs/craft/software-development/frontend-development/techniques/common-pitfalls", to: "/craft/software-development/frontend-development/techniques/common-pitfalls"},
            {from: "/docs/craft/software-development/frontend-development/techniques/development-process", to: "/craft/software-development/frontend-development/techniques/development-process"},
            {from: "/docs/craft/software-development/frontend-development/techniques/setup-overview", to: "/craft/software-development/frontend-development/techniques/setup-overview"},
            {from: "/docs/craft/software-development/frontend-development/techniques/storybook-typescript-babel", to: "/craft/software-development/frontend-development/techniques/storybook-typescript-babel"},
            {from: "/docs/craft/software-development/frontend-development/techniques/tool-composition", to: "/craft/software-development/frontend-development/techniques/tool-composition"},
            {from: "/docs/craft/software-development/frontend-development/techniques/understanding-tools", to: "/craft/software-development/frontend-development/techniques/understanding-tools"},
            {from: "/docs/craft/software-development/prompts/sql-query-analyzer", to: "/craft/software-development/prompts/sql-query-analyzer"},
            {from: "/docs/craft/software-development/scripting", to: "/craft/software-development/scripting"},
            {from: "/docs/craft/software-development/scripting/projects/leveraging-terminal-shortcuts", to: "/craft/software-development/scripting/projects/leveraging-terminal-shortcuts"},
            {from: "/docs/craft/software-development/scripting/projects/parsing-json", to: "/craft/software-development/scripting/projects/parsing-json"},
            {from: "/docs/craft/software-development/scripting/projects/terminal-calendar", to: "/craft/software-development/scripting/projects/terminal-calendar"},
            {from: "/docs/craft/software-development/scripting/projects/terminal-links", to: "/craft/software-development/scripting/projects/terminal-links"},
            {from: "/docs/craft/software-development/terminology", to: "/craft/software-development/terminology"},
            {from: "/docs/craft/software-development/terminology/terminology-portfolio", to: "/craft/software-development/terminology/terminology-portfolio"},
            {from: "/docs/craft/software-development/workspace/bookmarks/setup-machine", to: "/craft/software-development/workspace/bookmarks/setup-machine"},
            {from: "/docs/craft/software-development/workspace/setup/running-ha-on-mac-mini", to: "/craft/software-development/workspace/setup/running-ha-on-mac-mini"},
            {from: "/docs/craft/software-development/workspace/tips", to: "/craft/software-development/workspace/tips"},
            {from: "/docs/craft/software-development/workspace/tools", to: "/craft/software-development/workspace/tools"},
            {from: "/docs/craftsmanship/bookmarks/setup-machine", to: "/craft/software-development/workspace/bookmarks/setup-machine"},
            {from: "/docs/craftsmanship/processes/my-personal-execution-process", to: "/craft/productivity/processes/process-execution"},
            {from: "/docs/craftsmanship/processes/technical-interview-process-complete-guide", to: "/craft/productivity/processes/process-interview"},
            {from: "/docs/craftsmanship/tips/tips", to: "/craft/software-development/workspace/tips"},
            {from: "/docs/craftsmanship/tools/tools", to: "/craft/software-development/workspace/tools"},
            {from: "/docs/craftsmanship/workspace/autom8-ha-on-mac-mini", to: "/craft/software-development/workspace/setup/running-ha-on-mac-mini"},
            {from: "/docs/craftsmanship/workspace/running-llms-locally", to: "/craft/generative-ai/my-genai-workflow/running-llms-locally"},
            {from: "/docs/definitions/development-terminology", to: "/craft/productivity/terminology/terminology-development"},
            {from: "/docs/definitions/emojis-for-activities", to: "/craft/productivity/terminology/emojis"},
            {from: "/docs/definitions/terminology-cli", to: "/craft/productivity/terminology/terminology-cli"},
            {from: "/docs/definitions/terminology-portfolio", to: "/craft/software-development/terminology/terminology-portfolio"},
            {from: "/docs/definitions/terminology-project-management", to: "/craft/productivity/terminology/terminology-project-management"},
            {from: "/docs/development", to: "/craft/software-development"},
            {from: "/docs/development/initiatives/initiatives", to: "/craft/product-management/initiatives"},
            {from: "/docs/development/pocs/enhancing-the-google-search-experience", to: "/craft/product-management/pocs/enhancing-the-google-search-experience"},
            {from: "/docs/development/pocs/pocs", to: "/craft/product-management/pocs"},
            {from: "/docs/development/projects/experiments/experiments", to: "/craft/product-management/experiments"},
            {from: "/docs/development/projects/frontend-projects/sites/website-blog", to: "/craft/software-development/frontend-development/projects/website-blog"},
            {from: "/docs/development/projects/frontend-projects/sites/website-portfolio", to: "/craft/software-development/frontend-development/projects/website-portfolio"},
            {from: "/docs/development/projects/projects", to: "/craft/product-management/projects"},
            {from: "/docs/development/research/research", to: "/craft/product-management/research"},
            {from: "/docs/development/roadmaps/blog-roadmap", to: "/craft/product-management/roadmaps/1-blog-roadmap"},
            {from: "/docs/development/roadmaps/portfolio-roadmap", to: "/craft/product-management/roadmaps/2-portfolio-roadmap"},
            {from: "/docs/development/terminology", to: "/craft/software-development/terminology"},
            {from: "/docs/development/tinkering/my-firsts/hello-worlds", to: "/craft/product-management/ideas/hello-worlds"},
            {from: "/docs/development/tinkering/tinkering", to: "/craft/product-management/tinkering"},
            {from: "/docs/entrepreneurship", to: "/craft/entrepreneurship"},
            {from: "/docs/faith", to: "/journey/faith"},
            {from: "/docs/generative-ai", to: "/craft/generative-ai"},
            {from: "/docs/generative-ai/mental-models", to: "/craft/generative-ai/mental-models"},
            {from: "/docs/generative-ai/mental-models/ai-engineer-world-fair-2025", to: "/craft/generative-ai/mental-models/2025-06-15-ai-engineer-world-fair"},
            {from: "/docs/generative-ai/mental-models/ai-framework-landscape", to: "/craft/generative-ai/mental-models/2025-11-10-ai-framework-landscape"},
            {from: "/docs/generative-ai/mental-models/learning-about-genai", to: "/craft/generative-ai/mental-models/2025-10-04-learning-about-genai"},
            {from: "/docs/generative-ai/mental-models/understanding-fundamentals-of-genai-systems", to: "/craft/generative-ai/mental-models/2025-07-30-understanding-the-fundamentals-of-genai"},
            {from: "/docs/habits/habits-automating", to: "/craft/productivity/habits-automating"},
            {from: "/docs/habits/habits-ideation", to: "/journey/personal-growth/habits-ideation"},
            {from: "/docs/interview-prep", to: "/craft/interview-prep"},
            {from: "/docs/interview-prep/mental-models", to: "/craft/interview-prep/mental-models"},
            {from: "/docs/interview-prep/mental-models/data-structures-and-algorithms/understanding-dynamic-programming", to: "/craft/interview-prep/mental-models/data-structures-and-algorithms/understanding-dynamic-programming"},
            {from: "/docs/interview-prep/mental-models/data-structures-and-algorithms/understanding-graphs", to: "/craft/interview-prep/mental-models/data-structures-and-algorithms/understanding-graphs"},
            {from: "/docs/interview-prep/mental-models/data-structures-and-algorithms/understanding-heaps", to: "/craft/interview-prep/mental-models/data-structures-and-algorithms/understanding-heaps"},
            {from: "/docs/interview-prep/mental-models/data-structures-and-algorithms/understanding-lists", to: "/craft/interview-prep/mental-models/data-structures-and-algorithms/understanding-lists"},
            {from: "/docs/interview-prep/mental-models/data-structures-and-algorithms/understanding-trees", to: "/craft/interview-prep/mental-models/data-structures-and-algorithms/understanding-trees"},
            {from: "/docs/interview-prep/mental-models/understanding-the-interview-process", to: "/craft/interview-prep/mental-models/understanding-the-interview-process"},
            {from: "/docs/interview-prep/understanding-what-companies-expect", to: "/craft/interview-prep/understanding-what-companies-expect"},
            {from: "/docs/mental-models/understanding-career-levels/staff-engineer-traits", to: "/craft/companies/mental-models/career-levels/2025-10-02-staff-engineer-traits"},
            {from: "/docs/mental-models/understanding-career-levels/understanding-sde-levels", to: "/craft/companies/mental-models/career-levels/understanding-differences-in-skills"},
            {from: "/docs/mental-models/understanding-cultural-values/understanding-tech-company-culture", to: "/craft/companies/mental-models/cultural-values/2025-09-25-understanding-cultural-values"},
            {from: "/docs/mental-models/understanding-cultural-values/understanding-zapier-values", to: "/craft/companies/mental-models/cultural-values/2025-09-25-understanding-zapier-values"},
            {from: "/docs/mental-models/understanding-data-structs-and-algos/understanding-dynamic-programming", to: "/craft/interview-prep/mental-models/data-structures-and-algorithms/understanding-dynamic-programming"},
            {from: "/docs/mental-models/understanding-data-structs-and-algos/understanding-graphs", to: "/craft/interview-prep/mental-models/data-structures-and-algorithms/understanding-graphs"},
            {from: "/docs/mental-models/understanding-data-structs-and-algos/understanding-heaps", to: "/craft/interview-prep/mental-models/data-structures-and-algorithms/understanding-heaps"},
            {from: "/docs/mental-models/understanding-data-structs-and-algos/understanding-lists", to: "/craft/interview-prep/mental-models/data-structures-and-algorithms/understanding-lists"},
            {from: "/docs/mental-models/understanding-data-structs-and-algos/understanding-trees", to: "/craft/interview-prep/mental-models/data-structures-and-algorithms/understanding-trees"},
            {from: "/docs/mental-models/understanding-processes/understanding-the-interview-process", to: "/craft/interview-prep/mental-models/understanding-the-interview-process"},
            {from: "/docs/mental-models/understanding-skills/leadership-principles-companies-look-for", to: "/craft/companies/mental-models/skills/understanding-desireable-leadership-skills"},
            {from: "/docs/mental-models/understanding-skills/soft-skills-interview-evaluation", to: "/craft/companies/mental-models/skills/understanding-desireable-soft-skills"},
            {from: "/docs/mental-models/understanding-skills/technical-skills-interview-evaluation", to: "/craft/companies/mental-models/skills/understanding-desireable-tech-skills"},
            {from: "/docs/mental-models/understanding-the-genai-domain/ai-engineer-world-fair-2025", to: "/craft/generative-ai/mental-models/2025-06-15-ai-engineer-world-fair"},
            {from: "/docs/mental-models/understanding-the-genai-domain/ai-framework-landscape", to: "/craft/generative-ai/mental-models/2025-11-10-ai-framework-landscape"},
            {from: "/docs/mental-models/understanding-the-genai-domain/learning-about-genai", to: "/craft/generative-ai/mental-models/2025-10-04-learning-about-genai"},
            {from: "/docs/mental-models/understanding-the-genai-domain/understanding-fundamentals-of-genai-systems", to: "/craft/generative-ai/mental-models/2025-07-30-understanding-the-fundamentals-of-genai"},
            {from: "/docs/personal-growth", to: "/journey/personal-growth"},
            {from: "/docs/personal-growth/my-contributions", to: "/journey/personal-growth/my-contributions"},
            {from: "/docs/product-management", to: "/craft/product-management"},
            {from: "/docs/productivity", to: "/craft/productivity"},
            {from: "/docs/productivity/terminology", to: "/craft/productivity/terminology"},
            {from: "/docs/prompts/analyze/sql-query-analyzer", to: "/craft/software-development/prompts/sql-query-analyzer"},
            {from: "/docs/prompts/author/blog-post-author", to: "/craft/blogging/prompts/blog-post-author"},
            {from: "/docs/prompts/draw/kanban-board-customization", to: "/craft/productivity/prompts/kanban-board-customization"},
            {from: "/docs/prompts/evals/all-posts/audience-impression-check", to: "/craft/blogging/prompts/evals/all-posts/audience-impression-check"},
            {from: "/docs/prompts/evals/all-posts/evaluating-blog-personality", to: "/craft/blogging/prompts/evals/all-posts/evaluating-blog-personality"},
            {from: "/docs/prompts/evals/all-posts/evaluating-content-quality", to: "/craft/blogging/prompts/evals/all-posts/evaluating-content-quality"},
            {from: "/docs/prompts/evals/all-posts/general-blog-evaluation", to: "/craft/blogging/prompts/evals/all-posts/general-blog-evaluation"},
            {from: "/docs/prompts/evals/blog-post-evaluation-system", to: "/craft/blogging/prompts/evals"},
            {from: "/docs/prompts/evals/specific-posts/evaluating-docs-vs-blogs", to: "/craft/blogging/prompts/evals/specific-posts/evaluating-docs-vs-blogs"},
            {from: "/docs/prompts/evals/specific-posts/evaluating-my-approach", to: "/craft/blogging/prompts/evals/specific-posts/evaluating-my-approach"},
            {from: "/docs/prompts/evals/specific-posts/evaluating-my-contributions", to: "/craft/blogging/prompts/evals/specific-posts/evaluating-my-contributions"},
            {from: "/docs/prompts/evals/specific-posts/evaluating-zapier-values", to: "/craft/blogging/prompts/evals/specific-posts/evaluating-zapier-values"},
            {from: "/docs/prompts/heal/docusaurus-maintenance-system", to: "/craft/blogging/prompts/docusaurus-maintenance-system"},
            {from: "/docs/prompts/meta/prompt-maturity-framework", to: "/craft/blogging/prompts/prompt-maturity-framework"},
            {from: "/docs/prompts/organize/daily-todo-carry-over", to: "/craft/productivity/prompts/daily-todo-carry-over"},
            {from: "/docs/prompts/organize/personal-life-content-organizer", to: "/journey/personal-growth/prompts/personal-life-content-organizer"},
            {from: "/docs/prompts/readme", to: "/craft/blogging/prompts"},
            {from: "/docs/prompts/refactor/role-refactoring-system", to: "/craft/blogging/prompts/role-refactoring-system"},
            {from: "/docs/scripting", to: "/craft/software-development/scripting"},
            {from: "/docs/self", to: "/journey"},
            {from: "/docs/self/faith", to: "/journey/faith"},
            {from: "/docs/self/personal-growth", to: "/journey/personal-growth"},
            {from: "/docs/self/personal-growth/habits-ideation", to: "/journey/personal-growth/habits-ideation"},
            {from: "/docs/self/personal-growth/my-contributions", to: "/journey/personal-growth/my-contributions"},
            {from: "/docs/self/personal-growth/prompts/personal-life-content-organizer", to: "/journey/personal-growth/prompts/personal-life-content-organizer"},
            {from: "/docs/skills/preparing-for-interviews/interview-preparation-guide", to: "/craft/interview-prep/preparing"},
            {from: "/docs/skills/preparing-for-interviews/personal-story-bank", to: "/craft/interview-prep/preparing/personal-story-bank"},
            {from: "/docs/skills/preparing-for-interviews/pre-meditating-responses-for-leadership-questions", to: "/craft/interview-prep/preparing/pre-meditating-responses-for-leadership-questions"},
            {from: "/docs/skills/preparing-for-interviews/preparing-for-coding-questions", to: "/craft/interview-prep/preparing/preparing-for-coding-questions"},
            {from: "/docs/skills/preparing-for-interviews/preparing-for-system-design-questions", to: "/craft/interview-prep/preparing/preparing-for-system-design-questions"},
            {from: "/docs/skills/preparing-for-interviews/preparing-for-tech-questions", to: "/craft/interview-prep/preparing/preparing-for-tech-questions"},
            {from: "/docs/skills/preparing-for-interviews/prepraring-questions-to-ask-interviewers", to: "/craft/interview-prep/preparing/prepraring-questions-to-ask-interviewers"},
            {from: "/docs/skills/refining-soft-skills/dealing-with-ambiguity", to: "/craft/companies/skills/dealing-with-ambiguity"},
            {from: "/docs/skills/refining-soft-skills/dealing-with-challenges", to: "/craft/companies/skills/dealing-with-challenges"},
            {from: "/docs/skills/refining-soft-skills/managing-complexity", to: "/craft/companies/skills/managing-complexity"},
            {from: "/docs/skills/refining-soft-skills/my-problem-solving-approach", to: "/craft/companies/skills/my-problem-solving-approach"},
            {from: "/docs/skills/refining-soft-skills/refining-soft-skills", to: "/craft/companies/skills"},
            {from: "/docs/skills/solving-coding-challenges/coding-challenges", to: "/craft/interview-prep/coding-challenges"},
            {from: "/docs/skills/solving-coding-challenges/problem-solving-techniques/bitwise-ops", to: "/craft/interview-prep/coding-challenges/algorithm-patterns/bitwise-operations"},
            {from: "/docs/skills/solving-coding-challenges/problem-solving-techniques/cycle-detection", to: "/craft/interview-prep/coding-challenges/algorithm-patterns/cycle-detection"},
            {from: "/docs/skills/solving-coding-challenges/problem-solving-techniques/look-ahead", to: "/craft/interview-prep/coding-challenges/algorithm-patterns/look-ahead"},
            {from: "/docs/skills/solving-coding-challenges/problem-solving-techniques/path-traversal", to: "/craft/interview-prep/coding-challenges/algorithm-patterns/path-traversal"},
            {from: "/docs/skills/solving-coding-challenges/problem-solving-techniques/problem-solving-techniques", to: "/craft/interview-prep/coding-challenges/algorithm-patterns"},
            {from: "/docs/skills/solving-coding-challenges/problem-solving-techniques/subsets", to: "/craft/interview-prep/coding-challenges/algorithm-patterns/subsets"},
            {from: "/docs/skills/solving-coding-challenges/solutions/longest-palindromic-substring", to: "/craft/interview-prep/coding-challenges/solutions/longest-palindromic-substring"},
            {from: "/docs/skills/solving-system-design/ai-financial-advisory-system", to: "/craft/generative-ai/building-systems/example-genai-system-financial-services"},
            {from: "/docs/skills/solving-system-design/approach-in-building-systems", to: "/craft/generative-ai/building-systems/approach-in-building-systems"},
            {from: "/docs/skills/solving-system-design/capabilities-of-agentic-systems", to: "/craft/generative-ai/building-systems/capabilities-of-agentic-systems"},
            {from: "/docs/skills/solving-system-design/enterprise-customer-support-agent", to: "/craft/generative-ai/building-systems/example-genai-system-customer-support"},
            {from: "/docs/skills/solving-system-design/framework-for-designing-genai-systems", to: "/craft/generative-ai/building-systems/designing-genai-systems"},
            {from: "/docs/skills/solving-system-design/poc-to-production-execution-plan", to: "/craft/generative-ai/building-systems/example-poc-to-prod-execution-plan"},
            {from: "/docs/skills/solving-system-design/preparing-genai-systems-for-production", to: "/craft/generative-ai/building-systems/preparing-genai-systems-for-production"},
            {from: "/docs/techniques/analysis-techniques/analysis-techniques", to: "/craft/productivity/analyzing"},
            {from: "/docs/techniques/analysis-techniques/leveraging-google-analytics", to: "/craft/productivity/analyzing/leveraging-google-analytics"},
            {from: "/docs/techniques/automation-techniques/automation-techniques", to: "/craft/productivity/automating"},
            {from: "/docs/techniques/automation-techniques/leveraging-shortcuts", to: "/craft/productivity/automating/leveraging-shortcuts"},
            {from: "/docs/techniques/automation/automation", to: "/craft/blogging/automation"},
            {from: "/docs/techniques/blogging-techniques/adding-content/adding-changelog-entries", to: "/craft/blogging/adding-content/adding-changelog-entries"},
            {from: "/docs/techniques/blogging-techniques/adding-content/adding-content", to: "/craft/blogging/adding-content"},
            {from: "/docs/techniques/blogging-techniques/adding-content/adding-designs", to: "/craft/blogging/adding-content/adding-designs"},
            {from: "/docs/techniques/blogging-techniques/adding-content/adding-docs", to: "/craft/blogging/adding-content/adding-docs"},
            {from: "/docs/techniques/blogging-techniques/adding-content/mx-docx-blog-posts", to: "/craft/blogging/adding-content/adding-blog-posts"},
            {from: "/docs/techniques/blogging-techniques/blog-post-triggers", to: "/craft/blogging/blog-post-triggers"},
            {from: "/docs/techniques/blogging-techniques/changelog-system", to: "/craft/blogging/changelog-system"},
            {from: "/docs/techniques/blogging-techniques/docs-vs-blog-posts", to: "/craft/blogging/docs-vs-blog-posts"},
            {from: "/docs/techniques/blogging-techniques/embed-code/embed-code", to: "/craft/blogging/embed-code"},
            {from: "/docs/techniques/blogging-techniques/embed-code/mx-docx-embedd-code-cells", to: "/craft/blogging/embed-code/code-cells"},
            {from: "/docs/techniques/blogging-techniques/embed-code/mx-docx-embedd-gist", to: "/craft/blogging/embed-code/code-gists"},
            {from: "/docs/techniques/blogging-techniques/embed-code/mx-docx-embedd-jupyter-notebooks", to: "/craft/blogging/embed-code/code-jupyter-notebooks"},
            {from: "/docs/techniques/blogging-techniques/embed-diagrams/diagrams-mermaid", to: "/craft/blogging/embed-diagrams/diagrams-mermaid"},
            {from: "/docs/techniques/blogging-techniques/embed-diagrams/embed-diagrams", to: "/craft/blogging/embed-diagrams"},
            {from: "/docs/techniques/blogging-techniques/embed-diagrams/mx-docx-embedd-figma", to: "/craft/blogging/embed-diagrams/diagrams-figma"},
            {from: "/docs/techniques/blogging-techniques/embed-diagrams/mx-docx-embedd-flow-charts", to: "/craft/blogging/embed-diagrams/diagrams-flow-charts"},
            {from: "/docs/techniques/blogging-techniques/embed-diagrams/mx-docx-embedd-google-drawings", to: "/craft/blogging/embed-diagrams/diagrams-google-drawing"},
            {from: "/docs/techniques/blogging-techniques/embed-diagrams/mx-docx-embedd-kanban-customization", to: "/craft/blogging/embed-diagrams/diagrams-kanban-customization"},
            {from: "/docs/techniques/blogging-techniques/embed-diagrams/mx-docx-embedd-sequence-diagrams", to: "/craft/blogging/embed-diagrams/diagrams-puml-sequence"},
            {from: "/docs/techniques/blogging-techniques/embed-external-components/external-components", to: "/craft/blogging/embed-external-components"},
            {from: "/docs/techniques/blogging-techniques/embed-external-components/mx-docx-embedd-react-elems", to: "/craft/blogging/embed-external-components/html-react-elements"},
            {from: "/docs/techniques/blogging-techniques/embed-external-components/mx-docx-embedd-svg", to: "/craft/blogging/embed-external-components/images-svgs"},
            {from: "/docs/techniques/blogging-techniques/embed-external-components/mx-docx-embedd-youtube-videos", to: "/craft/blogging/embed-external-components/videos-youtube"},
            {from: "/docs/techniques/blogging-techniques/embed-external-components/tips", to: "/craft/blogging/embed-external-components/tips"},
            {from: "/docs/techniques/blogging-techniques/embed-structural-components/card", to: "/craft/blogging/embed-structural-components/card"},
            {from: "/docs/techniques/blogging-techniques/embed-structural-components/details", to: "/craft/blogging/embed-structural-components/details"},
            {from: "/docs/techniques/blogging-techniques/embed-structural-components/fancy-button", to: "/craft/blogging/embed-structural-components/fancy-button"},
            {from: "/docs/techniques/blogging-techniques/embed-structural-components/footer", to: "/craft/blogging/embed-structural-components/footer"},
            {from: "/docs/techniques/blogging-techniques/embed-structural-components/graph", to: "/craft/blogging/embed-structural-components/graph"},
            {from: "/docs/techniques/blogging-techniques/embed-structural-components/header", to: "/craft/blogging/embed-structural-components/header"},
            {from: "/docs/techniques/blogging-techniques/embed-structural-components/highlight", to: "/craft/blogging/embed-structural-components/highlight"},
            {from: "/docs/techniques/blogging-techniques/embed-structural-components/mechanics-docusaurus-linking", to: "/craft/blogging/embed-structural-components/links"},
            {from: "/docs/techniques/blogging-techniques/embed-structural-components/table-of-content", to: "/craft/blogging/embed-structural-components/table-of-content"},
            {from: "/docs/techniques/blogging-techniques/embed-structural-components/timeline", to: "/craft/blogging/embed-structural-components/timeline"},
            {from: "/docs/techniques/blogging-techniques/embed-structural-components/truncate", to: "/craft/blogging/embed-structural-components/adding-truncate-sections"},
            {from: "/docs/techniques/development-techniques/ci-cd-techniques", to: "/craft/software-development/backend-development/techniques/ci-cd-techniques"},
            {from: "/docs/techniques/development-techniques/development-techniques", to: "/craft/software-development/backend-development/techniques"},
            {from: "/docs/techniques/development-techniques/tool-composition-techniques/readme", to: "/craft/software-development/frontend-development/techniques/tool-composition"},
            {from: "/docs/techniques/development-techniques/tool-composition-techniques/storybook-typescript-babel/common-pitfalls", to: "/craft/software-development/frontend-development/techniques/common-pitfalls"},
            {from: "/docs/techniques/development-techniques/tool-composition-techniques/storybook-typescript-babel/development-process", to: "/craft/software-development/frontend-development/techniques/development-process"},
            {from: "/docs/techniques/development-techniques/tool-composition-techniques/storybook-typescript-babel/readme", to: "/craft/software-development/frontend-development/techniques/storybook-typescript-babel"},
            {from: "/docs/techniques/development-techniques/tool-composition-techniques/storybook-typescript-babel/setup-overview", to: "/craft/software-development/frontend-development/techniques/setup-overview"},
            {from: "/docs/techniques/development-techniques/tool-composition-techniques/storybook-typescript-babel/understanding-tools", to: "/craft/software-development/frontend-development/techniques/understanding-tools"},
            {from: "/docs/techniques/diagramming/diagramming", to: "/craft/blogging/diagramming"},
            {from: "/docs/techniques/discovery-techniques/discovery-techniques", to: "/craft/productivity/discovering"},
            {from: "/docs/techniques/documentation-techniques/diagramming-with-plantuml", to: "/craft/blogging/diagramming/diagramming-with-plantuml"},
            {from: "/docs/techniques/documentation-techniques/diagrams-as-text", to: "/craft/blogging/diagramming/diagrams-as-text"},
            {from: "/docs/techniques/documentation-techniques/getting-icons", to: "/craft/blogging/diagramming/getting-icons"},
            {from: "/docs/techniques/documentation-techniques/http-to-xcallback", to: "/craft/blogging/automation/http-to-xcallback"},
            {from: "/docs/techniques/organization-techniques", to: "/craft/productivity/organizing"},
            {from: "/docs/techniques/scripting-techniques/jq-mechanics", to: "/craft/software-development/scripting/projects/parsing-json"},
            {from: "/docs/techniques/scripting-techniques/mechanic-terminal-links", to: "/craft/software-development/scripting/projects/terminal-links"},
            {from: "/docs/techniques/scripting-techniques/terminal-calendar", to: "/craft/software-development/scripting/projects/terminal-calendar"},
            {from: "/docs/techniques/scripting-techniques/terminal-shortcuts", to: "/craft/software-development/scripting/projects/leveraging-terminal-shortcuts"},
            {from: "/docs/techniques/security-techniques/security-techniques", to: "/craft/software-development/backend-development/techniques/security-techniques"},
            {from: "/docs/techniques/tool-usage-techniques/establishing-tool-usage-patterns", to: "/craft/productivity/tool-usage/establishing-tool-usage-patterns"},
            {from: "/docs/techniques/tool-usage-techniques/tool-usage-techniques", to: "/craft/productivity/tool-usage"},
          ],
          // Route renames (2026-06): the Self docs instance moved /self/* → /journey/*
          // and the blog moved /blog/* → /thoughts/*. createRedirects runs for EVERY
          // generated path, so every new /journey/* and /thoughts/* page gets a 301 from
          // its old /self/* or /blog/* URL — old links and shares never break (CLAUDE.md
          // tenet: a move is paired with a {from,to} redirect).
          createRedirects(existingPath) {
            if (existingPath.startsWith('/journey')) {
              return [existingPath.replace(/^\/journey/, '/self')];
            }
            if (existingPath.startsWith('/thoughts')) {
              return [existingPath.replace(/^\/thoughts/, '/blog')];
            }
            return undefined; // no redirect for other paths
          },
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
            src: 'img/logo-binary.svg',
            srcDark: 'img/logo-binary_dark.svg',
          },
          items: [
            {
              label: 'Craft',
              type: 'docSidebar', sidebarId: 'craftSidebar', docsPluginId: 'craft',
              position: 'left',
            },
            {
              // 'Journey' (the inward/personal docs instance, id 'self') — matches the
              // homepage "Discover My Journey" card. Served at /journey (old /self/* 301s).
              label: 'Journey',
              type: 'docSidebar', sidebarId: 'selfSidebar', docsPluginId: 'self',
              position: 'left',
            },
            {
              // 'Thoughts' (the blog, served at /thoughts) — matches the homepage
              // "Browse My Thoughts" card.
              label: 'Thoughts',
              to: '/thoughts',
              position: 'left'
            },
            {
              // 'Mindset' (the quotes-that-moved-me page) — matches the homepage
              // "Explore My Mindset" card. Sits right after Thoughts.
              label: 'Mindset',
              to: '/mindset',
              position: 'left'
            },
            {
              label: 'Designs',
              to: '/designs',
              position: 'left'
            },
            // 'Components' (Storybook) moved OUT of the navbar to the footer as
            // "Blob UI Kit Building Blocks" — a builder surface, not a primary
            // reader destination. See footer "Other Works".
            {
              // Reader-facing "Vote on Post Ideas" page (/vote) — lets readers
              // signal which upcoming posts they want next (PostHog 'idea_voted').
              label: 'Vote',
              to: '/vote',
              position: 'left'
            },
            {
              // "Support" tab → the dedicated /support page (headshot + the ways
              // to support: Shopify store, GitHub, LinkedIn, Buy Me a Coffee).
              // Replaces the old standalone "Buy Me a Coffee" navbar button; the
              // support-button-copy A/B experiment now lives on that page's coffee
              // CTA (see src/components/Support).
              label: 'Support',
              to: '/support',
              position: 'left'
            },
            // 'What's New' (/changelog) moved OUT of the navbar to the footer
            // ("More" column) — a secondary destination, not primary reader nav.
            // {
            //   label: 'Ideas',
            //   to: '/blog/process-blog-post-ideation',
            //   position: 'left'
            // },

            {
              // LinkedIn-via-Cloudflare-Access auth control: "Sign in" button
              // when anonymous, profile avatar + dropdown when signed in. A
              // position:'right' custom item lands next to the color-mode toggle
              // (Docusaurus places the toggle at the very end of the right
              // group). Component: src/components/AuthNavbarItem; registered as
              // 'custom-auth' in src/theme/NavbarItem/ComponentTypes.tsx.
              type: 'custom-auth',
              position: 'right',
            },

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
                  href: 'https://buymeacoffee.com/omareid',
                  position: 'right',
                },
              ]
            },
            {
              title: 'Other Works',
              items: [
                {
                  // "What's New" (changelog) — moved here from the navbar; a
                  // secondary destination rather than primary reader nav.
                  label: "What's New",
                  to: '/changelog',
                  position: 'right',
                },
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
          // Per-color-mode theme: Docusaurus theme-mermaid swaps these on the site's
          // light/dark toggle (this is the dark-mode adaptation — diagrams get a dark
          // surface + light text/edges automatically in dark mode). 'base' is the
          // themeable light theme we tune toward the brand below.
          theme: {light: 'base', dark: 'dark'},
          options: {
            // Editorial sans, matching the site body font (Geist), instead of mermaid's
            // default Trebuchet — so diagram text reads as part of the page.
            fontFamily:
              "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            htmlLabels: true,
            // Nudge the LIGHT ('base') theme toward the terracotta/cream palette so a
            // diagram with no per-node classDef still looks on-brand. Per-node classDef
            // fills in the source diagrams still win where present.
            themeVariables: {
              primaryColor: '#f4f0e8', // node fill = warm paper surface
              primaryBorderColor: '#b33e1e', // brand terracotta outline
              primaryTextColor: '#2b2622', // warm ink
              lineColor: '#9a8f80', // muted edge stroke (reads on cream)
              tertiaryColor: '#ece7df', // subgraph background = page bg
              fontSize: '15px',
            },
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
