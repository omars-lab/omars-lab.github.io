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
import DiagramWithFootnotes from '@site/src/components/DiagramWithFootnotes';
import Mockup from '@site/src/components/Mockup';
import Walkthrough from '@site/src/components/Walkthrough';
import Assumption from '@site/src/components/Assumption';

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
};