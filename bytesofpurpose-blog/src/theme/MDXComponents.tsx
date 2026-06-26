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
import PremiumGate from '@site/src/components/PremiumGate';
import Premium from '@site/src/components/Premium';
import KanbanBoard from '@site/src/components/KanbanBoard';
import TaskList from '@site/src/components/TaskList';
import ThoughtKind, {ThoughtKindLegend, MindsetKindLegend} from '@site/src/components/ThoughtKind';
import UsedIn from '@site/src/components/UsedIn';
// Reusable design-post components now live in the published @omars-lab/blog-ui package
// (single source of truth; the blog consumes it). The bundled styles are imported once.
import {
  DiagramWithFootnotes,
  Mockup,
  Walkthrough,
  Assumption,
  Gif,
  SectionBanner,
  Question,
  QuestionSection,
  PowerLegend,
  Quote,
  QuoteSet,
  Focus,
} from '@omars-lab/blog-ui';
import '@omars-lab/blog-ui/style.css';

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
  // Premium gating: <PremiumGate> is injected by the rehype-premium-encrypt plugin in
  // place of an encrypted doc body; <Premium> is an author-facing inline wrapper.
  PremiumGate,
  Premium,
  // KanbanBoard: an interactive board indexing temporal posts (experiments, ideas) as
  // cards generated from frontmatter (kanban-data.json); card click opens a modal with a
  // link to the post. <KanbanModalHost/> must be mounted in Root.tsx. Use as
  // <KanbanBoard board="experiments"/> or board="ideas".
  KanbanBoard,
  // TaskList: wrap a markdown task list to render its capture tags (>due, @done(), ~Nx~,
  // #stamp/#tag) as styled chips instead of raw text. The markdown stays the source of truth.
  TaskList,
  // System-design posts: a diagram paired with a generated numbered legend (the badges
  // ①②③ are authored into the mermaid labels; this renders the matching explanations).
  DiagramWithFootnotes,
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
  // Quote kit — for "quotes that moved me" sets on /mindset. <Quote> is an editorial pull-quote
  // (the quote is the hero; attribution quiet; the "why it moved me" reflection reveals on
  // demand), and <QuoteSet> lays a themed set out as a vertical reading flow. Deliberately a
  // different CX from <Question> (received/savored, not actioned).
  Quote,
  QuoteSet,
  // <Focus> marks the powerful word(s) in a <Quote>; a highlight sweeps in under them on hover.
  Focus,
  // UsedIn: the "used in" list on a showcase doc. The published posts that actually use this
  // component/technique, generated from the corpus by generate-component-usage.js (component-
  // usage.json) so it can't go stale. Drop <UsedIn slug="/components/structural/card"/> on a
  // showcase; pass the showcase's own slug. Detection is the showcase's `usage_pattern` frontmatter.
  UsedIn,
};