export interface IdeaEntry {
  /** Stable identity — keys votes (localStorage + PostHog). From frontmatter
   *  `slug`, falling back to the filename. */
  slug: string;
  title: string;
  description: string;
  type: 'post' | 'design' | 'doc' | 'tool' | string;
  status: 'idea' | 'drafting' | 'published' | string;
  date: string;
}
