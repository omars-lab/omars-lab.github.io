// Tag parsing for <TaskList>. This is the TYPED wrapper over the shared parser core in
// scripts/lib/task-tags.js — the SAME logic the /todos generator uses, so the component and the
// aggregator parse tasks identically (single source of truth). Pure (no React).
//
// Recognized tags (from the raw-capture convention, see the mature-content skill):
//   >YYYY-MM-DD        a due / scheduled date
//   @done(YYYY-MM-DD)  completed, on that date
//   ~Nx~               a recurrence / effort marker (e.g. ~10x~)
//   #YYYY-MM-DD        a date stamp
//   #word              a hashtag chip
// Tags may be wrapped in backticks in source (`>2022-04-18`); we strip those first.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const core = require('../../../scripts/lib/task-tags');

export type TaskTagKind = 'due' | 'done' | 'recurrence' | 'datestamp' | 'hashtag';

export interface TaskTag {
  kind: TaskTagKind;
  /** The display value (a date, the ~Nx~ text, the #tag). */
  value: string;
}

export interface ParsedTask {
  /** The task text with the recognized tags removed + whitespace tidied. */
  text: string;
  /** Whether the task is done (checkbox `[x]` or an @done tag). */
  done: boolean;
  tags: TaskTag[];
}

/** Parse a single task's raw text into {text, done, tags}. `done` comes from the checkbox. */
export function parseTaskText(raw: string, done = false): ParsedTask {
  return core.parseTaskText(raw, done) as ParsedTask;
}

/** Stable display order for the tag chips on a task. */
export const TAG_ORDER: TaskTagKind[] = core.TAG_ORDER;

export function sortTags(tags: TaskTag[]): TaskTag[] {
  return core.sortTags(tags) as TaskTag[];
}
