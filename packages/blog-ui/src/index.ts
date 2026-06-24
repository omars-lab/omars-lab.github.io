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
