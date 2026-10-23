/**
 * The em-dash check must read the path it is given. It used to skip a path it could not
 * find from the current folder and then report "no em-dashes", so a page was passed
 * without being read. These tests run the real script as a child process.
 */
/// <reference types="jest" />

import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const SITE_ROOT = path.resolve(__dirname, '..', '..');
const REPO_ROOT = path.resolve(SITE_ROOT, '..');
const SCRIPT = path.join(SITE_ROOT, 'scripts', 'validate-em-dash.js');

function run(args: string[], cwd: string) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: 'utf8' });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

describe('validate-em-dash path arguments', () => {
  let tmp: string;
  beforeAll(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'em-dash-'));
    fs.mkdirSync(path.join(tmp, 'docs'));
    fs.writeFileSync(path.join(tmp, 'docs', 'dirty.md'), 'One idea — then another.\n');
    fs.writeFileSync(path.join(tmp, 'docs', 'clean.md'), 'One idea, then another.\n');
  });
  afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

  it('fails on a path that does not exist instead of reporting clean', () => {
    const r = run(['docs/no-such-folder'], REPO_ROOT);
    expect(r.code).toBe(2);
    expect(r.out).toMatch(/path not found: docs\/no-such-folder/);
  });

  it('finds a site path when run from the repo root', () => {
    const r = run(['docs/craft/generative-ai/claude-code-techniques/README.mdx'], REPO_ROOT);
    expect(r.out).not.toMatch(/path not found/);
    expect(r.out).not.toMatch(/in 0 file\(s\) scanned/);
  });

  it('flags an em dash in the file it was given', () => {
    const r = run([path.join(tmp, 'docs', 'dirty.md')], REPO_ROOT);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/dirty\.md:1 \[em-dash\]/);
  });

  it('passes a clean file and says how many it read', () => {
    const r = run([path.join(tmp, 'docs', 'clean.md')], REPO_ROOT);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/in 1 file\(s\) scanned/);
  });
});
