// SINGLE SOURCE OF TRUTH for the Ideas/Experimentation board TAG glossary.
//
// Each board card shows its theme tags (from the post's `tags:` frontmatter, minus the
// always-on noise — see scripts/generate-kanban-data.js → themeTags()). A tag is terse by
// nature ("sge", "automa"), so on the board each chip gets a hover/focus/tap tooltip that
// explains what the tag means. This map is that explanation: tag slug → one short sentence.
//
// CONSUMER: src/components/KanbanBoard/index.tsx (wraps each chip in <Tooltip>).
// RULE: keep this in lockstep with the tags actually used on board posts — when a new theme
// tag appears on a `board:`-carrying post, add its gloss here. An un-glossed tag still renders
// (it just falls back to a generic "Tagged …" tooltip), so a miss is graceful, not broken.

export const IDEA_TAG_GLOSS: Record<string, string> = {
  // Scripting & shell
  scripting: 'Writing small scripts to automate my own workflows.',
  shell: 'Shell/terminal tooling: functions, completion, and command-line helpers.',
  automation: 'Making a repetitive task run itself instead of doing it by hand.',
  tooling: 'Building the tools and helpers I work with day to day.',
  dates: 'My date-tag system: auto-expanding date tags and the helpers around them.',

  // Notes & knowledge base
  notes: 'My personal notes and the scripts that keep them healthy.',
  'knowledge-base': 'My personal book of notes treated as a maintained knowledge base.',
  'note-taking': 'The practice and tooling of capturing notes.',
  noteplan: 'The NotePlan app I use for notes, tasks, and calendar.',
  templates: 'Reusable note/document templates.',
  productivity: 'Getting-things-done workflows and the tools that support them.',
  'self-quantifying': 'Measuring my own behavior to make better decisions about it.',
  backup: 'Keeping my scripts, tasks, and data safe across machines.',

  // Apps & platforms
  app: 'A standalone application idea.',
  'app-development': 'Building a native or desktop/mobile application.',
  mobile: 'A phone/tablet experience.',
  ios: 'Apple iOS (iPhone/iPad) development.',
  macos: 'Apple macOS (desktop) development.',
  'menu-bar': 'A macOS menu-bar app that lives in the system tray.',
  swift: 'The Swift language used for Apple-platform apps.',
  plugin: 'Extending an existing app with a plugin.',
  lametric: 'The LaMetric desk display that shows a metric at a glance.',
  calendar: 'Calendar data or calendar-app integration.',

  // Web & frontend
  web: 'The web platform (HTML/CSS/JS in the browser).',
  frontend: 'The user-facing front end of a web app.',
  react: 'The React UI library.',
  portfolio: 'My personal portfolio website.',

  // Browser & extensions
  browser: 'The web browser as a platform to script or extend.',
  'browser-automation': 'Driving a browser programmatically to automate tasks.',
  'browser-extension': 'A browser add-on that extends the browser.',
  'chrome-extension': 'A Chrome-specific browser extension.',
  automa: 'Automa, a no-code browser-automation tool.',

  // Data & scraping
  scraping: 'Extracting data from a web page programmatically.',
  instagram: 'Pulling data from or integrating with Instagram.',
  slack: 'Exporting from or integrating with Slack.',

  // Search & AI
  'google-search': 'Google Search and how results are surfaced.',
  'search-optimization': 'Improving how content is found via search.',
  sge: "Google's Search Generative Experience (AI-generated search results).",
  'ai-filtering': 'Using AI to filter or rank information.',
  pocs: 'Proof-of-concept spikes that test an idea quickly.',

  // Software craft (the durable-development thread)
  'software-development': 'Building software well: the craft and its practices.',
  architecture: 'How a system is structured at a high level.',
  'best-practices': 'Established, battle-tested ways of doing something.',
  scaling: 'Making a system handle more load or more users.',
  research: 'Investigating something before deciding or building.',

  // Classifications
  'first-time': 'A first-time idea: doing something for the first time or trying a new tech hands-on.',

  // Experimentation & analytics
  'ab-testing': 'Running an A/B test to compare two variants on real users.',
  experiments: 'A/B experiments run on the site to learn what works.',
  posthog: 'PostHog, the product-analytics tool I use for events and experiments.',

  // Business & physical products (the entrepreneurship thread)
  business: 'A business idea: turning a concept into something that could make money.',
  'physical-product': 'A tangible, manufactured product rather than software.',
  ecommerce: 'Selling directly to customers online.',
  shopify: 'The Shopify platform for running a direct-to-consumer store.',
  'islamic-art': 'Islamic geometric art as a design and product language.',
  coffee: 'The coffee ritual and the accessories around it.',

  // AI products & connectors (the AI-business thread)
  saas: 'Software sold as a subscription service.',
  'ai-agents': 'Autonomous AI agents that do multi-step work on your behalf.',
  mcp: 'The Model Context Protocol: connectors that plug tools into Claude and other clients.',
  'knowledge-management': 'Capturing, organizing, and resurfacing what you know.',
};

/** The tooltip text for a tag — its gloss, or a graceful generic fallback. */
export function ideaTagTooltip(tag: string): string {
  return IDEA_TAG_GLOSS[tag] || `Ideas tagged “${tag}”.`;
}
