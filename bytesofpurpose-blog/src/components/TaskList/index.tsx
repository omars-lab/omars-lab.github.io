import React from 'react';
import clsx from 'clsx';
import {parseTaskText, sortTags, type ParsedTask, type TaskTag} from './parse';
import styles from './TaskList.module.css';

/**
 * TaskList — render a markdown task list with the special capture tags styled instead of shown
 * as raw text. Authored as a wrapper around a normal markdown task list in MDX:
 *
 *   <TaskList>
 *
 *   - [ ] Export bookmarks over the CLI `>2022-04-18`
 *   - [x] Make a chime script `@done(2022-04-13)`
 *   - [ ] Smarter date helpers `#2022-07-08` `~05x~`
 *
 *   </TaskList>
 *
 * remark-gfm turns each `- [ ]`/`- [x]` line into an <li class="task-list-item"> with a
 * checkbox; this component receives that rendered list as children, reads each item's text +
 * checked state, parses out the tags (>due, @done(), ~Nx~, #stamp/#tag — see parse.ts), and
 * re-renders the item with a clean label + styled tag chips. The raw markdown stays the source
 * of truth, so the list is still a real, diffable, checkable task list in the .md/.mdx file.
 *
 * Alternatively pass `items` (an array of raw task strings) to render without authoring a
 * markdown list — useful in Storybook or when the tasks come from data.
 */

export interface TaskListProps {
  children?: React.ReactNode;
  /** Render from raw task strings instead of wrapping a markdown list. Each string is one task;
   *  prefix with "[x] " to mark it done. */
  items?: string[];
  className?: string;
}

const TAG_META: Record<TaskTag['kind'], {label: (v: string) => string; cls: string; icon: string}> = {
  due: {label: (v) => `due ${v}`, cls: 'tagDue', icon: '📅'},
  done: {label: (v) => `done ${v}`, cls: 'tagDone', icon: '✅'},
  recurrence: {label: (v) => v, cls: 'tagRecur', icon: '🔁'},
  datestamp: {label: (v) => v, cls: 'tagStamp', icon: '🗓️'},
  hashtag: {label: (v) => `#${v}`, cls: 'tagHash', icon: ''},
};

function TagChips({tags}: {tags: TaskTag[]}): React.JSX.Element | null {
  if (!tags.length) return null;
  return (
    <span className={styles.tags}>
      {sortTags(tags).map((t, i) => {
        const meta = TAG_META[t.kind];
        return (
          <span key={`${t.kind}-${t.value}-${i}`} className={clsx(styles.tag, styles[meta.cls])}>
            {meta.icon && <span aria-hidden="true">{meta.icon} </span>}
            {meta.label(t.value)}
          </span>
        );
      })}
    </span>
  );
}

function TaskRow({task}: {task: ParsedTask}): React.JSX.Element {
  return (
    <li className={clsx(styles.item, task.done && styles.itemDone)}>
      <span className={styles.checkbox} aria-hidden="true">
        {task.done ? '☑' : '☐'}
      </span>
      <span className={styles.text}>{task.text}</span>
      <TagChips tags={task.tags} />
    </li>
  );
}

// Pull the plain text out of arbitrary React children (the rendered <li> content).
function textOf(node: React.ReactNode): string {
  if (node == null || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (React.isValidElement(node)) {
    const el = node as React.ReactElement<{children?: React.ReactNode}>;
    return textOf(el.props.children);
  }
  return '';
}

// Was this rendered <li class="task-list-item"> a checked one? remark-gfm emits a disabled
// <input type="checkbox" checked> for `- [x]`.
function liChecked(node: React.ReactElement): boolean {
  let checked = false;
  const walk = (n: React.ReactNode) => {
    if (React.isValidElement(n)) {
      const el = n as React.ReactElement<{type?: string; checked?: boolean; children?: React.ReactNode}>;
      if (el.props.type === 'checkbox' && el.props.checked) checked = true;
      React.Children.forEach(el.props.children, walk);
    } else if (Array.isArray(n)) {
      n.forEach(walk);
    }
  };
  walk(node);
  return checked;
}

// Find the rendered <li> task items inside the children (children is typically a <ul>).
function collectTaskItems(children: React.ReactNode): ParsedTask[] {
  const tasks: ParsedTask[] = [];
  const visit = (node: React.ReactNode) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!React.isValidElement(node)) return;
    const el = node as React.ReactElement<{className?: string; children?: React.ReactNode}>;
    const cls = el.props.className || '';
    const isTaskItem = typeof cls === 'string' && cls.includes('task-list-item');
    if (el.type === 'li' && isTaskItem) {
      tasks.push(parseTaskText(textOf(el.props.children), liChecked(el)));
      return;
    }
    React.Children.forEach(el.props.children, visit);
  };
  visit(children);
  return tasks;
}

export default function TaskList({children, items, className}: TaskListProps): React.JSX.Element {
  const tasks: ParsedTask[] = items
    ? items.map((raw) => {
        const m = raw.match(/^\s*\[([ xX])\]\s*(.*)$/);
        const done = !!m && m[1].toLowerCase() === 'x';
        return parseTaskText(m ? m[2] : raw, done);
      })
    : collectTaskItems(children);

  if (!tasks.length) {
    // No recognizable task items — render children as-is rather than swallow them.
    return <>{children}</>;
  }

  const open = tasks.filter((t) => !t.done).length;
  return (
    <div className={clsx(styles.taskList, className)}>
      <ul className={styles.list}>
        {tasks.map((task, i) => (
          <TaskRow key={i} task={task} />
        ))}
      </ul>
      <p className={styles.summary}>
        {open} open · {tasks.length - open} done · {tasks.length} total
      </p>
    </div>
  );
}
