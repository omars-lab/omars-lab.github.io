// @omars-lab/blog-ui — reusable React components for design/blog posts.
// Consumers: `import {Walkthrough, Mockup} from '@omars-lab/blog-ui'` plus a one-time
// `import '@omars-lab/blog-ui/style.css'` for the bundled styles.

export {default as Walkthrough} from './components/Walkthrough';
export type {
  WalkthroughProps,
  WalkStep,
  ClaudeTool,
} from './components/Walkthrough';

export {default as Mockup} from './components/Mockup';
export type {MockupProps, MockupChrome} from './components/Mockup';

export {default as Gif} from './components/Gif';
export type {GifProps, GifFrame} from './components/Gif';

export {default as DiagramWithFootnotes, circledNumber} from './components/DiagramWithFootnotes';
export type {DiagramWithFootnotesProps} from './components/DiagramWithFootnotes';

export {default as Assumption} from './components/Assumption';
export type {AssumptionProps} from './components/Assumption';

export {default as SectionBanner} from './components/SectionBanner';
export type {SectionBannerProps} from './components/SectionBanner';

export {default as Tooltip} from './components/Tooltip';
export type {TooltipProps} from './components/Tooltip';

export {
  default as Question,
  QuestionModalHost,
  PowerLegend,
  openQuestionModal,
} from './components/Question';
export type {
  QuestionProps,
  QuestionDetail,
  QuestionPower,
  QuestionPowerProp,
  QuestionPriority,
  QuestionDepth,
  QuestionCron,
  PowerLegendProps,
} from './components/Question';

export {default as QuestionSection} from './components/QuestionSection';
export type {QuestionSectionProps} from './components/QuestionSection';

// Quote kit — the analog of the question kit, but for quotes that moved me. A quote is RECEIVED
// and savored (an editorial pull-quote with a reveal-on-demand reflection), not actioned like a
// question, so the CX is deliberately different (no badges/modal/priority sort). The kit has two
// renderers: <EditorialQuote> (a single-line pull-quote) and <PosterQuote> (a cascading
// typographic poster, the "watch your thoughts -> ... -> destiny" family).
export {default as EditorialQuote} from './components/Quote/EditorialQuote';
export type {EditorialQuoteProps} from './components/Quote/EditorialQuote';

// Back-compat alias: <Quote> was the original name for the editorial pull-quote; keep it working
// (it resolves to the same default export, so existing posts need no change).
export {default as Quote} from './components/Quote/EditorialQuote';
export type {QuoteProps} from './components/Quote/EditorialQuote';

// <Focus> marks the powerful word(s) inside an <EditorialQuote>; a highlight sweeps in under them
// when the quote is hovered (reduced-motion safe). Only meaningful inside a quote.
export {default as Focus} from './components/Quote/Focus';
export type {FocusProps} from './components/Quote/Focus';

// <PosterQuote> renders a quote as a cascading poster; each rung is a <Beat lead=... big=.../>.
export {default as PosterQuote, Beat} from './components/Quote/PosterQuote';
export type {PosterQuoteProps, BeatProps} from './components/Quote/PosterQuote';

export {default as QuoteSet} from './components/QuoteSet';
export type {QuoteSetProps} from './components/QuoteSet';
