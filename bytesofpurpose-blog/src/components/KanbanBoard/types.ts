// Shared types for the KanbanBoard component + its generated data.
// The data is produced by scripts/generate-kanban-data.js (→ kanban-data.json) from
// blog-post frontmatter; the component renders it. Keep this in sync with the generator's
// BOARDS definition (column ids, kind→board mapping).

export type BoardId = 'experiments' | 'ideas';

/** One card = one blog post, slotted into a column by its `stage`. */
export interface KanbanCard {
  slug: string;
  title: string;
  /** A short summary (post `summary` or `description`). Shown on the card + modal. */
  summary: string;
  /** Absolute permalink to the full post (e.g. /initiatives/support-button-copy). */
  permalink: string;
  /** The resolved column id this card sits in (already mapped by the generator). */
  stage: string;
  /** Importance tier — drives a colored pill. */
  priority: string;
  /** The post kind (experiment-plan, experiment-result, …) — drives the kind emoji. */
  kind: string;
  /** Optional classification grouping a subset of a board's cards (e.g. 'first-time'). Badge. */
  class?: string;
  /** Theme tags (post `tags:` minus always-on noise) — drive the card chips + board filter. */
  tags?: string[];
  /** YYYY-MM-DD (may be empty). */
  date: string;
}

/** The generated data file shape: boardId → its cards. */
export type KanbanData = Record<string, KanbanCard[]>;

/** A column definition the board renders (id + the human label/emoji shown in the header). */
export interface BoardColumn {
  id: string;
  label: string;
  /** Optional emoji shown in the column header. */
  emoji?: string;
}

/** Per-board UI config: the ordered columns + a human title. */
export interface BoardConfig {
  title: string;
  columns: BoardColumn[];
}

/** The detail payload dispatched when a card is clicked (opens the shared modal). */
export interface KanbanCardDetail {
  title: string;
  summary: string;
  permalink: string;
  stage: string;
  priority: string;
  kind: string;
  date: string;
  /** The human label of the column the card sits in (for the modal header). */
  columnLabel: string;
}
