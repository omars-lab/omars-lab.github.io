#!/usr/bin/env node
/**
 * Self-contained assertions for import-noteplan.js. No test runner needed:
 *   node import-noteplan.test.js   → exits 0 on pass, 1 on any failure.
 *
 * Covers the guarantees the skill depends on:
 *   1. inventory finds md links + bare urls, with section + task-state.
 *   2. append creates a byte-exact PREFIX (original is untouched).
 *   3. append is idempotent (dedup by source + blog url).
 *   4. verify passes on a legit append, fails on a planted deletion.
 *   5. assertNonDestructive throws if the body would change.
 *   6. snapshot/audit: legit append does not trip; a dropped line does.
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const M = require('./import-noteplan.js');

let pass = 0;
function test(name, fn) {
  try {
    fn();
    pass++;
    console.log('  ✓ ' + name);
  } catch (e) {
    console.error('  ✗ ' + name + '\n    ' + e.message);
    process.exitCode = 1;
  }
}

function tmp(content, name = 'note.md') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inp-'));
  const p = path.join(dir, name);
  fs.writeFileSync(p, content);
  return { dir, p };
}

const SAMPLE = [
  '---',
  'description: junk auto description',
  '---',
  '# 🏡📋 References[X]',
  '# Motivation',
  '* [ ] [A Talk](https://youtu.be/abc)',
  '\tsee also https://example.com/bare',
  '* [x] done item [Repo](https://github.com/o/r)',
].join('\n'); // note: no trailing newline (the tricky case)

console.log('inventory');
test('finds 2 md links + 1 bare url', () => {
  const { p } = tmp(SAMPLE);
  const inv = M.inventory(p);
  const md = inv.links.filter((l) => l.kind === 'markdown');
  const bare = inv.links.filter((l) => l.kind === 'bare');
  assert.strictEqual(md.length, 2, 'md links'); // A Talk, Repo
  assert.strictEqual(bare.length, 1, 'bare urls');
  assert.ok(inv.links.some((l) => l.url === 'https://example.com/bare'));
});
test('captures section + task-state', () => {
  const { p } = tmp(SAMPLE);
  const inv = M.inventory(p);
  const talk = inv.links.find((l) => l.url === 'https://youtu.be/abc');
  assert.ok(talk.section.includes('Motivation'), 'section');
  assert.strictEqual(talk.taskState, 'open');
  const repo = inv.links.find((l) => l.url === 'https://github.com/o/r');
  assert.strictEqual(repo.taskState, 'done');
});

console.log('append (non-destructive prefix)');
test('original is a byte-exact prefix after append', () => {
  const { p } = tmp(SAMPLE);
  const before = fs.readFileSync(p);
  const res = M.appendMigration(p, [
    { link: 'A Talk', url: 'https://youtu.be/abc', blogUrl: 'https://blog.x/t', kind: 'idea', date: '2026-07-02' },
  ]);
  assert.ok(res.changed && res.added === 1);
  const after = Buffer.from(res.content, 'utf8');
  assert.ok(after.subarray(0, before.length).equals(before), 'original bytes preserved as prefix');
});
test('idempotent: re-append same record adds nothing', () => {
  const { p } = tmp(SAMPLE);
  const rec = [{ link: 'A Talk', url: 'https://youtu.be/abc', blogUrl: 'https://blog.x/t', kind: 'idea', date: 'd' }];
  const first = M.appendMigration(p, rec);
  fs.writeFileSync(p, first.content);
  const second = M.appendMigration(p, rec);
  assert.strictEqual(second.changed, false, 'no change on re-run');
  assert.strictEqual(second.added, 0);
});
test('dedup by blogUrl too', () => {
  const { p } = tmp(SAMPLE);
  const first = M.appendMigration(p, [{ link: 'A', url: 'https://a', blogUrl: 'https://blog.x/same', kind: 'k', date: 'd' }]);
  fs.writeFileSync(p, first.content);
  const second = M.appendMigration(p, [{ link: 'B', url: 'https://b', blogUrl: 'https://blog.x/same', kind: 'k', date: 'd' }]);
  assert.strictEqual(second.added, 0, 'same blogUrl is a dup');
});

console.log('verify');
test('passes on a legit append; fails on a planted deletion', () => {
  const { p } = tmp(SAMPLE);
  const base = p + '.base';
  fs.copyFileSync(p, base);
  const res = M.appendMigration(p, [{ link: 'A', url: 'https://youtu.be/abc', blogUrl: 'https://blog.x/t', kind: 'idea', date: 'd' }]);
  fs.writeFileSync(p, res.content);
  assert.strictEqual(M.verify(p, base).ok, true, 'legit append verifies');

  // Plant a deletion above the marker.
  const mutated = res.content.replace('* [ ] [A Talk](https://youtu.be/abc)\n', '');
  fs.writeFileSync(p, mutated);
  assert.strictEqual(M.verify(p, base).ok, false, 'deletion is caught');
});
test('assertNonDestructive throws when body would change', () => {
  assert.throws(() => M.assertNonDestructive('original body\n', 'DIFFERENT body\n'));
  // A REAL append preserves the body byte-exact (for bodies with and without a
  // trailing newline) → assertNonDestructive must not throw.
  for (const orig of ['body\n', 'body', 'a\nb\n\n', 'a\nb']) {
    const { p } = tmp(orig);
    const res = M.appendMigration(p, [{ link: 'L', url: 'https://u', blogUrl: 'https://b', kind: 'k', date: 'd' }]);
    assert.doesNotThrow(
      () => M.assertNonDestructive(orig, res.content),
      `orig=${JSON.stringify(orig)} should preserve body`
    );
  }
});

console.log('snapshot / audit (corpus no-drop)');
test('legit append does not trip audit; a dropped line does', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inp-corpus-'));
  const f = path.join(dir, 'note.md');
  fs.writeFileSync(f, SAMPLE);
  const baseline = M.snapshot(dir);

  // Legit migration append.
  const res = M.appendMigration(f, [{ link: 'A', url: 'https://youtu.be/abc', blogUrl: 'https://blog.x/t', kind: 'idea', date: 'd' }]);
  fs.writeFileSync(f, res.content);
  assert.strictEqual(M.audit(dir, baseline).ok, true, 'append below marker is fine');

  // Destructive drop above the marker.
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('* [ ] [A Talk](https://youtu.be/abc)\n', ''));
  const bad = M.audit(dir, baseline);
  assert.strictEqual(bad.ok, false, 'drop is detected');
  assert.ok(bad.drops.some((d) => d.detail.includes('youtu.be/abc')), 'names the dropped url');
});

console.log(`\n${pass} assertions passed${process.exitCode ? ' (with failures)' : ''}.`);
