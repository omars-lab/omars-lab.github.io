// Tag parsing for <TaskList>. Extracts the special capture tags from a task's text and returns
// the cleaned text + the structured tags. Pure + unit-testable (no React).
//
// Recognized tags (from the raw-capture convention, see the mature-content skill):
//   >YYYY-MM-DD        a due / scheduled date
//   @done(YYYY-MM-DD)  completed, on that date
//   ~Nx~               a recurrence / effort marker (e.g. ~10x~)
//   #YYYY-MM-DD        a date stamp
//   #word              a hashtag chip
// Tags may be wrapped in backticks in source (`>2022-04-18`); we strip those first.

export type TaskTagKind = 'due' | 'done' | 'recurrence' | 'datestamp' | 'hashtag';

export interface TaskTag {
  kind: TaskTagKind;
  /** The display value (a date, the ~Nx~ text, the #tag). */
  value: string;
}

export interface ParsedTask {
  /** The task text with the recognized tags removed + whitespace tidied. */
  text: string;
  /** Whether the source checkbox was checked (`- [x]`). */
  done: boolean;
  tags: TaskTag[];
}

const DATE = /\d{4}-\d{2}-\d{2}/;

// Order matters: @done before the bare > / # so the date inside @done(...) isn't double-claimed.
const PATTERNS: Array<{kind: TaskTagKind; re: RegExp; pick: (m: RegExpMatchArray) => string}> = [
  {kind: 'done', re: new RegExp(`@done\\((${DATE.source})\\)`, 'g'), pick: (m) => m[1]},
  {kind: 'due', re: new RegExp(`>(${DATE.source})`, 'g'), pick: (m) => m[1]},
  {kind: 'datestamp', re: new RegExp(`#(${DATE.source})`, 'g'), pick: (m) => m[1]},
  {kind: 'recurrence', re: /~(\d+x)~/g, pick: (m) => m[1]},
  {kind: 'hashtag', re: /#([a-zA-Z][\w-]*)/g, pick: (m) => m[1]},
];

/** Parse a single task's raw text into {text, done, tags}. `done` is passed in from the checkbox. */
export function parseTaskText(raw: string, done = false): ParsedTask {
  // Strip backticks that wrap tags in source (`>2022-04-18` → >2022-04-18) so the patterns match.
  let text = raw.replace(/`([>@#~][^`]*)`/g, '$1');
  const tags: TaskTag[] = [];

  for (const {kind, re, pick} of PATTERNS) {
    text = text.replace(re, (...args) => {
      const m = args.slice(0, -2) as unknown as RegExpMatchArray;
      tags.push({kind, value: pick(m)});
      return '';
    });
  }

  // An @done tag implies done even if the checkbox wasn't [x].
  const isDone = done || tags.some((t) => t.kind === 'done');
  text = text.replace(/\s{2,}/g, ' ').trim();
  return {text, done: isDone, tags};
}

/** Stable display order for the tag chips on a task. */
export const TAG_ORDER: TaskTagKind[] = ['due', 'recurrence', 'datestamp', 'hashtag', 'done'];

export function sortTags(tags: TaskTag[]): TaskTag[] {
  return [...tags].sort((a, b) => TAG_ORDER.indexOf(a.kind) - TAG_ORDER.indexOf(b.kind));
}
