export interface IdeaEntry {
  id: string;
  title: string;
  description: string;
  type: 'post' | 'design' | 'doc' | 'tool' | string;
  status: 'idea' | 'drafting' | 'published' | string;
  date: string;
  slug: string;
}
