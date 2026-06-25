/**
 * Unit proof for TaskList's tag parser (src/components/TaskList/parse.ts).
 *
 * parse.ts is pure (no React, no @site aliases), so unlike the other unit tests it imports the
 * real implementation directly rather than mirroring it. Covers each tag kind, the backtick
 * unwrap, @done-implies-done, and text cleanup.
 */
/// <reference types="jest" />

import {parseTaskText} from '../../src/components/TaskList/parse';

describe('parseTaskText', () => {
  it('extracts a >due date and cleans the text', () => {
    const t = parseTaskText('Export bookmarks over the CLI >2022-04-18');
    expect(t.text).toBe('Export bookmarks over the CLI');
    expect(t.tags).toEqual([{kind: 'due', value: '2022-04-18'}]);
    expect(t.done).toBe(false);
  });

  it('unwraps backtick-wrapped tags', () => {
    const t = parseTaskText('Smarter date helpers `#2022-07-08` `~05x~`');
    expect(t.text).toBe('Smarter date helpers');
    expect(t.tags).toContainEqual({kind: 'datestamp', value: '2022-07-08'});
    expect(t.tags).toContainEqual({kind: 'recurrence', value: '05x'});
  });

  it('treats @done(...) as done and records its date', () => {
    const t = parseTaskText('Make a chime script @done(2022-04-13)', false);
    expect(t.done).toBe(true);
    expect(t.tags).toContainEqual({kind: 'done', value: '2022-04-13'});
    expect(t.text).toBe('Make a chime script');
  });

  it('honors the checkbox done flag even with no @done tag', () => {
    const t = parseTaskText('Already finished', true);
    expect(t.done).toBe(true);
  });

  it('parses a #hashtag chip', () => {
    const t = parseTaskText('Port the portfolio #frontend');
    expect(t.tags).toContainEqual({kind: 'hashtag', value: 'frontend'});
    expect(t.text).toBe('Port the portfolio');
  });

  it('does not mistake a #YYYY-MM-DD stamp for a hashtag', () => {
    const t = parseTaskText('Stamped #2022-07-08');
    expect(t.tags).toContainEqual({kind: 'datestamp', value: '2022-07-08'});
    expect(t.tags.find((x) => x.kind === 'hashtag')).toBeUndefined();
  });

  it('handles multiple tags on one task', () => {
    const t = parseTaskText('Other work streams `>2022-06-25` `#2022-04-27` `~10x~`');
    expect(t.tags.map((x) => x.kind).sort()).toEqual(['datestamp', 'due', 'recurrence']);
    expect(t.text).toBe('Other work streams');
  });

  it('leaves a tagless task untouched', () => {
    const t = parseTaskText('Just a plain task');
    expect(t.text).toBe('Just a plain task');
    expect(t.tags).toEqual([]);
  });
});
