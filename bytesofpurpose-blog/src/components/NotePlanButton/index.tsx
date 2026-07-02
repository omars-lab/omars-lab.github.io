import React from 'react';
import styles from './styles.module.css';

/**
 * NotePlanButton — a first-class button for a `noteplan://x-callback-url` link.
 *
 * These links open a note in MY LOCAL NotePlan app (they only work on a machine that has
 * NotePlan installed with my data), so the button is honest about that: it shows the note
 * title with the NotePlan glyph and a tooltip saying it opens my local app. A public reader
 * sees what the note is even though they can't open it.
 *
 * Two ways to use it (pick whichever reads cleanest in the post):
 *
 *   // structured — the component builds the x-callback-url (recommended, validator-friendly):
 *   <NotePlanButton note="⚙️ Automation Backlog" heading="⚙️ Automation Backlog" />
 *   <NotePlanButton filename="20250215.txt" label="my journal for that day" />
 *
 *   // or pass a full url verbatim (for an already-encoded link or a non-openNote action):
 *   <NotePlanButton url="noteplan://x-callback-url/openNote?noteTitle=..." />
 *
 * The x-callback-url scheme (help.noteplan.co/article/49): openNote?noteTitle=<title> (a note
 * by its title = its first `#` heading) with `#<heading>` appended for a subheading, OR
 * openNote?filename=<folder/note.txt> (by relative path). Titles/headings/paths are URL-encoded.
 */

interface StructuredProps {
  /** The note's TITLE (its first `#` heading), e.g. "⚙️ Automation Backlog". */
  note?: string;
  /** A subheading within the note (appended as `#<heading>`, URL-encoded). */
  heading?: string;
  /** OR identify the note by its relative filename/path, e.g. "20250215.txt" or "Folder/Note.md". */
  filename?: string;
  /** The visible label; defaults to the note title / filename. */
  label?: string;
  /** A full noteplan:// url, used verbatim (overrides note/filename). */
  url?: string;
}

// Build the openNote x-callback-url from structured props. Titles/headings/paths are
// URL-encoded per the scheme; a `#<heading>` is appended to the noteTitle when present.
function buildUrl({note, heading, filename}: StructuredProps): string {
  if (filename) {
    return `noteplan://x-callback-url/openNote?filename=${encodeURIComponent(filename)}`;
  }
  const title = heading ? `${note}#${heading}` : note || '';
  return `noteplan://x-callback-url/openNote?noteTitle=${encodeURIComponent(title)}`;
}

// The visible text: an explicit label, else the note title, else the filename.
function labelFor({note, filename, label}: StructuredProps): string {
  if (label) return label;
  if (note) return note;
  if (filename) return filename;
  return 'note';
}

export default function NotePlanButton(props: StructuredProps): React.JSX.Element {
  const href = props.url || buildUrl(props);
  const text = props.url && props.label ? props.label : labelFor(props);
  return (
    <a
      className={styles.button}
      href={href}
      // Opens my LOCAL NotePlan app; harmless (does nothing) for a reader without it.
      title="Opens this note in my local NotePlan app"
      rel="nofollow"
    >
      <span className={styles.glyph} aria-hidden="true">
        🗒️
      </span>
      <span className={styles.label}>
        <span className={styles.lead}>Open in NotePlan</span>
        <span className={styles.note}>{text}</span>
      </span>
    </a>
  );
}
