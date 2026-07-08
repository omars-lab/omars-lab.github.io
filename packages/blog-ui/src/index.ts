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

// FlowDiagram — a prop-driven directed-flow diagram (pipeline/loop/sequence/branch/
// swimlane) rendered as one inline SVG. The author writes a nodes/edges spec (data,
// not an image); layout is deterministic and a build-time gate fails on a dangling
// edge id or a tangled (unreadable) layout. Distinct from DiagramWithFootnotes,
// which wraps a hand-authored mermaid diagram with a numbered legend.
export {default as FlowDiagram} from './components/FlowDiagram';
export type {
  FlowDiagramProps,
  FlowNode,
  FlowEdge,
  FlowShape,
  FlowNodeKind,
} from './components/FlowDiagram';

// MindMap — a themed mind map rendered as one inline SVG from Mermaid mindmap text
// (the author writes ordinary `mindmap` syntax as children, so it also renders on
// mermaid.live). On top of mermaid we add real clickable nodes: a node whose label
// is a markdown link `[Text](#anchor)` renders as an <a> to a same-page heading or
// another page. Themed to look like Apple MindNode's default (cream canvas, white
// nodes, brown borders). Parses + lays out itself because mermaid's mindmap renderer
// supports neither node links nor reliable theming. Pairs with scripts/convert-mindnode.py
// (which turns a .mindnode bundle into the mermaid text) and the import-mindnode skill.
export {default as MindMap} from './components/MindMap';
export type {MindMapProps} from './components/MindMap';
export type {MindLayout, MindDensity} from './components/MindMap/layout';
export type {MindNode, MindShape, MindAccent} from './components/MindMap/parser';
export type {MindStyle} from './components/MindMap/render';

// ComparisonMatrix — a criteria x options decision table (options are columns, criteria
// rows; the chosen option's column is highlighted + badged; yes/no/partial render as marks).
// A real accessible <table>; a build-time gate throws on a cell keyed to a nonexistent option.
export {default as ComparisonMatrix} from './components/ComparisonMatrix';
export type {
  ComparisonMatrixProps,
  MatrixOption,
  MatrixCriterion,
  Rating,
  Cell,
  CellSpec,
  CellFootnote,
} from './components/ComparisonMatrix';

// DecisionTable — the catalog of a design's decisions (D1…Dn) as an anchored, status-badged
// table. Distinct from ComparisonMatrix (which is criteria x OPTIONS): this is the numbered
// list of DECISIONS with status, so "see D3" cross-references become deep-links. Each row is
// #d3-addressable and highlights when its anchor is the URL hash; status badges carry a
// tooltip (the status gloss + an optional per-decision statusNote); a decision with `detail`
// opens a focus modal. Build-time gate throws on a duplicate id or unknown status.
export {default as DecisionTable} from './components/DecisionTable';
export type {
  DecisionTableProps,
  Decision,
  DecisionStatus,
} from './components/DecisionTable';

// Accordion — a foldable option list on native <details>/<summary> (zero JS). Each item has a
// one-line summary, an expandable body, and an optional verdict pill ("chosen"/"rejected").
// Pairs with ComparisonMatrix: the accordion carries the narrative, the matrix the head-to-head.
export {default as Accordion} from './components/Accordion';
export type {AccordionProps, AccordionItem} from './components/Accordion';

// UseCaseDiagram — a UML use-case diagram (actors outside a system boundary, use cases as ovals
// inside, association / include / extend links). Deterministic two-sided layout with barycenter
// crossing reduction; two build-time gates fail on an unreadable layout (too many crossing lines,
// or a lopsided actor line-fan). A use case with detail opens a click-to-focus modal.
export {default as UseCaseDiagram} from './components/UseCaseDiagram';
export type {
  UseCaseDiagramProps,
  Actor,
  UseCase,
  Link,
  ActorKind,
} from './components/UseCaseDiagram';

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
