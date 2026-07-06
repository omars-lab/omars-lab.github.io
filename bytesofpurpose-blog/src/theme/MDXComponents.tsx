import React from 'react';
// Importing the original mapper + our components according to the Docusaurus doc
import MDXComponents from '@theme-original/MDXComponents';
import Card from '@site/src/components/Card';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardImage from '@site/src/components/Card/CardImage';
import Timeline from '@site/src/components/TimeLine';
import TimelineItem from '@site/src/components/TimeLine/TimeLineItem';
import BookmarkletButton from '@site/src/components/BookmarkletButton';
import NotePlanButton from '@site/src/components/NotePlanButton';
import ExperimentOverview from '@site/src/components/ExperimentOverview';
import PremiumGate from '@site/src/components/PremiumGate';
import Premium from '@site/src/components/Premium';
import KanbanBoard from '@site/src/components/KanbanBoard';
import Catalog from '@site/src/components/Catalog';
import RepoCatalog from '@site/src/components/RepoCatalog';
import RepoPointer from '@site/src/components/RepoPointer';
import TaskList from '@site/src/components/TaskList';
import ThoughtKind, {ThoughtKindLegend, MindsetKindLegend} from '@site/src/components/ThoughtKind';
import UsedIn from '@site/src/components/UsedIn';
// Design-system specimen kit: renders the /handbook/design-system pages by reading the repo's
// OWN live tokens from src/css/custom.css (theme-aware, drift-proof).
import {
  ColorSwatch,
  ColorRow,
  TypeSpecimen,
  SpacingScale,
  RadiusSwatches,
  ElevationDemo,
  TokenTable,
  BrandMarks,
  FeatureIcons,
  ArchIllustrations,
  OptionGrid,
  OptionTile,
  DecisionNote,
  SplitFlapMark,
  BitCursor,
  BlinkCaret,
  ButtonRow,
  ChipRow,
  DemoButton,
  DemoTag,
  DemoBadge,
  DemoCallout,
} from '@site/src/components/DesignSystem';
// Reusable design-post components now live in the published @omars-lab/blog-ui package
// (single source of truth; the blog consumes it). The bundled styles are imported once.
import {
  DiagramWithFootnotes,
  FlowDiagram,
  ComparisonMatrix,
  Accordion,
  UseCaseDiagram,
  Mockup,
  Walkthrough,
  Assumption,
  Gif,
  SectionBanner,
  Question,
  QuestionSection,
  PowerLegend,
  Quote,
  EditorialQuote,
  PosterQuote,
  Beat,
  QuoteSet,
  Focus,
} from '@omars-lab/blog-ui';
import '@omars-lab/blog-ui/style.css';
// SlideDeck: a reveal.js-backed slide deck embedded in a post, themed from THIS repo's
// design-system tokens (Fraunces/Geist, tea pastels, deep green). reveal.js is lazy-loaded
// in the browser only (SSR-safe via BrowserOnly). See src/components/SlideDeck.
import SlideDeck, {
  Slide,
  SlideEyebrow,
  SlideTitle,
  SlideLede,
  Pastels,
  PillarGrid,
  FormatList,
} from '@site/src/components/SlideDeck';

export default {
  // Reusing the default mapping
  ...MDXComponents,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardImage,
  Timeline,
  TimelineItem,
  BookmarkletButton,
  NotePlanButton,
  ExperimentOverview,
  // Premium gating: <PremiumGate> is injected by the rehype-premium-encrypt plugin in
  // place of an encrypted doc body; <Premium> is an author-facing inline wrapper.
  PremiumGate,
  Premium,
  // KanbanBoard: an interactive board indexing temporal posts (experiments, ideas) as
  // cards generated from frontmatter (kanban-data.json); card click opens a modal with a
  // link to the post. <KanbanModalHost/> must be mounted in Root.tsx. Use as
  // <KanbanBoard board="experiments"/> or board="ideas".
  KanbanBoard,
  // Catalog: the generic durable HUB index. Renders one hub's /initiatives posts grouped by
  // `area:`, chosen by the `kind` prop — <Catalog kind="project"/> (Projects hub),
  // kind="tinkering" (Tinkering hub), kind="research" (Research hub). Data is generated per
  // hub by scripts/generate-hubs-data.js from posts carrying that kind + an area. See the
  // manage-hubs skill.
  Catalog,
  // RepoCatalog: the "Repos of Interest" reference catalog (workspace/tools). Groups
  // repositories by tag (tool/relevant/genai/...) from repos-data.json, generated from
  // the hand-authored src/data/repos-of-interest.json. Use as <RepoCatalog/> or filter
  // with <RepoCatalog tags={['tool']}/>.
  RepoCatalog,
  // RepoPointer: a single "here's the source repo" card for a design post (one repo, an
  // optional path + pinned commit), built on the Card primitives. Distinct from
  // RepoCatalog (a many-repo list). Use as
  // <RepoPointer repo="owner/name" path="plugins/local-guide" blurb="..."/>.
  RepoPointer,
  // TaskList: wrap a markdown task list to render its capture tags (>due, @done(), ~Nx~,
  // #stamp/#tag) as styled chips instead of raw text. The markdown stays the source of truth.
  TaskList,
  // System-design posts: a diagram paired with a generated numbered legend (the badges
  // ①②③ are authored into the mermaid labels; this renders the matching explanations).
  DiagramWithFootnotes,
  // FlowDiagram: a prop-driven directed-flow figure (pipeline/loop/sequence/branch/swimlane)
  // rendered as inline SVG from a nodes/edges spec. Layout is deterministic and a build-time
  // gate fails on a dangling edge id or a tangled (unreadable) layout, so a flow ships only
  // when it reads cleanly. Use <FlowDiagram title=... nodes={[...]} edges={[...]} /> for a
  // flow/loop/handoff instead of hand-authoring mermaid; DiagramWithFootnotes still wraps a
  // hand-authored mermaid diagram when you want the numbered-legend treatment.
  FlowDiagram,
  // ComparisonMatrix: a criteria x options decision table (options are columns, criteria rows;
  // the chosen option's column is highlighted + badged; yes/no/partial render as ●/○/◐ marks
  // with sr-only labels). A real accessible <table> that scrolls on mobile; a build-time gate
  // throws on a cell keyed to a nonexistent option. Use <ComparisonMatrix title=... options={[]}
  // criteria={[]}/> for a head-to-head. (OptionGrid/DecisionNote show explored DESIGN directions
  // with a chosen ring + WHY; ComparisonMatrix is the feature-by-feature decision table.)
  ComparisonMatrix,
  // Accordion: a foldable option list on native <details>/<summary> (zero JS, keyboard-accessible).
  // Each item has a one-line summary, an expandable body, and an optional verdict pill. Pairs with
  // ComparisonMatrix: the accordion carries the narrative, the matrix the head-to-head. Use
  // <Accordion label=... items={[{summary, body, verdict?, open?}]}/> on a decision post.
  Accordion,
  // UseCaseDiagram: a UML use-case diagram (actors outside a system boundary, use cases as ovals
  // inside, solid association lines + dashed «include»/«extend»). A deterministic two-sided layout
  // (internal/system actors pull left, external pull right) with barycenter crossing reduction; two
  // build-time gates fail on an unreadable layout (too many crossing lines, or a lopsided actor
  // line-fan). A use case with `detail` opens a click-to-focus modal. Use <UseCaseDiagram title=...
  // actors={[]} useCases={[]} links={[]}/> for a "who uses X and what they do" figure. (Mermaid has
  // no real use-case support, so this is the only way to author one here.)
  UseCaseDiagram,
  // UX mockups: a framed, theme-aware wrapper that turns live HTML into a UI mockup
  // (browser/window/phone chrome) — shows what a design would LOOK like.
  Mockup,
  // Scripted animated UX demo over a mockup: cursor + highlight + comment + click +
  // typed terminal, driven by a step array — shows the UX being USED.
  Walkthrough,
  // Yellow inline highlight for [Assumption: …] markers (unvalidated premises to review).
  Assumption,
  // Animated-media figure: a framed, captioned, accessible <Gif> for a recorded/synthesized
  // clip (terminal session, screen capture) — lazy, reduced-motion poster, play/pause toggle.
  Gif,
  // Question-set post components — used in "What I Ask Myself" posts.
  // SectionBanner: a quiet left-accent callout under each H2 explaining why the section matters.
  SectionBanner,
  // Question: a clickable card for an introspective question; click opens a modal with
  // metadata (why/howOften/when/record). QuestionModalHost must be mounted in Root.tsx.
  Question,
  // QuestionSection: wraps a section's <Question> cards and renders them sorted by
  // priority (core>high>medium>low), keeping authored order within each tier.
  QuestionSection,
  // PowerLegend: the canonical "power of a question" legend (spark/fire/chisel/anvil),
  // rendered from the same source as the card badges so it can't drift. Used in the
  // "What I Ask Myself" keystone post.
  PowerLegend,
  // Thoughts taxonomy: <ThoughtKind kind="simulation"/> is a badge labeling a thought by its
  // KIND (idea/question/simulation/prediction/critique/principle/design), and
  // <ThoughtKindLegend/> renders all of them. Both read straight from the `thought: true` kinds
  // in scripts/lib/blog-kinds.json (the source of truth), so they can't drift. Used on the
  // /thoughts landing.
  ThoughtKind,
  ThoughtKindLegend,
  // MindsetKindLegend: the same, for the curated MINDSET kinds (question-set/quote-set/principle).
  MindsetKindLegend,
  // Quote kit — for "quotes that moved me" sets on /mindset. Two renderers: <EditorialQuote> is a
  // single-line pull-quote (the quote is the hero; attribution quiet; the "why it moved me"
  // reflection reveals on demand), and <PosterQuote> renders the cascading typographic poster
  // (the "watch your thoughts -> ... -> destiny" family) from <Beat lead=... big=.../> rungs.
  // <Quote> is the back-compat alias of <EditorialQuote> (existing posts keep working). Both
  // carry an optional `video` prop (a quiet "watch" external link to a motivational video).
  // <QuoteSet> lays a themed set out as a vertical reading flow. Deliberately a different CX from
  // <Question> (received/savored, not actioned).
  Quote,
  EditorialQuote,
  PosterQuote,
  // <Beat> is one rung of a <PosterQuote> cascade (a small lead line + a giant keyword).
  Beat,
  QuoteSet,
  // <Focus> marks the powerful word(s) in an <EditorialQuote>; a highlight sweeps in on hover.
  Focus,
  // UsedIn: the "used in" list on a showcase doc. The published posts that actually use this
  // component/technique, generated from the corpus by generate-component-usage.js (component-
  // usage.json) so it can't go stale. Drop <UsedIn slug="/components/structural/card"/> on a
  // showcase; pass the showcase's own slug. Detection is the showcase's `usage_pattern` frontmatter.
  UsedIn,
  // Design-system reference specimens (the /handbook/design-system/* pages). Every specimen
  // renders LIVE from a var(--token) read off the theme, so the docs stay in lockstep with
  // src/css/custom.css and are automatically correct in light and dark.
  ColorSwatch,
  ColorRow,
  TypeSpecimen,
  SpacingScale,
  RadiusSwatches,
  ElevationDemo,
  TokenTable,
  BrandMarks,
  FeatureIcons,
  ArchIllustrations,
  // OptionGrid/OptionTile render every explored direction with the CHOSEN one highlighted
  // (green ring + ✦ badge); DecisionNote records WHY we chose it. The "show all options,
  // highlight our decision" pattern used on the Logos and Typography pages.
  OptionGrid,
  OptionTile,
  DecisionNote,
  // Animated logo marks (faithful to the design project's live mockups): the chosen split-flap
  // rolling B→0→1→blank, the arch bit cursor, the blinking caret. All reduced-motion guarded.
  SplitFlapMark,
  BitCursor,
  BlinkCaret,
  // Live control specimens rendered from the repo's real Infima button classes + tokens
  // (Buttons + Core Components pages): buttons, pastel tags, badges, callouts.
  ButtonRow,
  ChipRow,
  DemoButton,
  DemoTag,
  DemoBadge,
  DemoCallout,
  // SlideDeck: reveal.js slide deck embedded in a post. <SlideDeck> wraps <Slide> children;
  // <SlideEyebrow>/<SlideTitle>/<SlideLede>/<Pastels> are on-brand slide primitives. reveal.js
  // is lazy-loaded browser-only and themed from the repo's own tokens (no reveal theme shipped).
  SlideDeck,
  Slide,
  SlideEyebrow,
  SlideTitle,
  SlideLede,
  Pastels,
  PillarGrid,
  FormatList,
};