// Shared task-tag parser core (plain JS, no React/TS) so BOTH the TaskList component
// (src/components/TaskList/parse.ts re-exports this) AND the /todos generator
// (scripts/generate-todos-data.js) parse tasks identically. Single source of truth.
//
// Recognized tags on a markdown task's text:
//   >YYYY-MM-DD        a due / scheduled date
//   @done(YYYY-MM-DD)  completed, on that date
//   ~Nx~               a recurrence / effort marker (e.g. ~10x~)
//   #YYYY-MM-DD        a date stamp
//   #word              a hashtag chip
// Tags may be wrapped in backticks in source (`>2022-04-18`); we strip those first.

const DATE = '\\d{4}-\\d{2}-\\d{2}';

const PATTERNS = [
  {kind: 'done', re: new RegExp(`@done\\((${DATE})\\)`, 'g'), pick: (m) => m[1]},
  {kind: 'due', re: new RegExp(`>(${DATE})`, 'g'), pick: (m) => m[1]},
  {kind: 'datestamp', re: new RegExp(`#(${DATE})`, 'g'), pick: (m) => m[1]},
  {kind: 'recurrence', re: /~(\d+x)~/g, pick: (m) => m[1]},
  {kind: 'hashtag', re: /#([a-zA-Z][\w-]*)/g, pick: (m) => m[1]},
];

const TAG_ORDER = ['due', 'recurrence', 'datestamp', 'hashtag', 'done'];

/** Parse a single task's raw text into {text, done, tags}. `done` comes from the checkbox. */
function parseTaskText(raw, done = false) {
  let text = String(raw).replace(/`([>@#~][^`]*)`/g, '$1');
  const tags = [];
  for (const {kind, re, pick} of PATTERNS) {
    text = text.replace(re, (...args) => {
      const m = args.slice(0, -2);
      tags.push({kind, value: pick(m)});
      return '';
    });
  }
  const isDone = done || tags.some((t) => t.kind === 'done');
  text = text.replace(/\s{2,}/g, ' ').trim();
  return {text, done: isDone, tags};
}

function sortTags(tags) {
  return [...tags].sort((a, b) => TAG_ORDER.indexOf(a.kind) - TAG_ORDER.indexOf(b.kind));
}

module.exports = {parseTaskText, sortTags, TAG_ORDER};
