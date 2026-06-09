// Consolidated reference data for posts.
//
// Every post that renders reference carousels reads its cards from a JSON file
// in this directory, one file per topic. To "refresh" a post (add a newly found
// book, blog, course, ...), append a card to the topic's JSON here. The post
// body never needs editing.
//
// Each topic file is shaped as { "<category>": ReferenceItem[] }. An optional
// "_provenance" key records which personalbook source file(s) the references
// were abstracted from, so a freshness hook can detect when the source changed
// but this JSON wasn't refreshed.

import type { CarouselItem } from '@site/src/components/Carousel';

import learningResources from './learning-resources.json';
import learnAboutGraphql from './learn-about-graphql.json';

export type ReferenceItem = CarouselItem;

// Provenance: which source file(s) these references were abstracted from.
export interface ReferenceProvenance {
  source: string; // repo-relative path in personalbook
  source_commit?: string; // commit the JSON was last reconciled against
  note?: string;
}

// A topic file maps category keys to reference arrays, plus an optional
// _provenance key. We type the category map loosely (categories are dynamic)
// and read _provenance separately.
export interface ReferenceTopic {
  _provenance?: ReferenceProvenance | ReferenceProvenance[];
  [category: string]: ReferenceItem[] | ReferenceProvenance | ReferenceProvenance[] | undefined;
}

// The registry: topic key -> its data. Add a line here when you add a topic.
export const references: Record<string, ReferenceTopic> = {
  'learning-resources': learningResources as unknown as ReferenceTopic,
  'learn-about-graphql': learnAboutGraphql as unknown as ReferenceTopic,
};

// Look up one category's items for a topic. Returns [] if absent so a post
// section renders nothing rather than crashing.
export function getReferences(topic: string, category: string): ReferenceItem[] {
  const t = references[topic];
  if (!t || category === '_provenance') return [];
  const items = t[category];
  return Array.isArray(items) ? (items as ReferenceItem[]) : [];
}
