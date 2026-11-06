#!/usr/bin/env node

/**
 * validate-image-alt.js: every image on a page says what it shows.
 *
 * A screen reader reads an image's alt text in place of the picture, and LinkedIn and search
 * engines show it when the picture doesn't load. An image with no alt text, an empty one, or a
 * stand-in like "image" or its own file name tells the reader nothing.
 *
 * Checked, in every .md / .mdx page under the site's content folders:
 *   - Markdown images:  ![alt](src)            the alt must be real text
 *   - HTML / JSX tags:  <img src=... alt=...>  an alt attribute must be there, with real text
 *                       (and <CardImage>, which hands its alt to the <img> it draws);
 *                                                alt={someValue} is taken as given, since only the
 *                                                build knows what it holds
 *
 * An image that is only decoration (a divider, an icon beside its own label) may say so with
 * alt="" together with role="presentation" or aria-hidden="true", the usual way to tell a screen
 * reader to skip it. Code blocks and inline code are skipped, so a page that shows image syntax as
 * an example is not flagged.
 *
 * One greppable line per problem:
 *
 *   ev=image_alt_missing file=<path> line=<n> image=<src> msg="..."
 *
 * Usage:  node scripts/validate-image-alt.js [file-or-dir ...]   (default: every content folder)
 *         node scripts/validate-image-alt.js --selftest
 * Exit:   1 on any problem, 0 when every image has real alt text.
 *
 * Plain CommonJS so it runs on whatever node the pre-commit hook finds (v18 included).
 * Backlog #272 in the social-presence-hub repo.
 */

const fs = require('fs');
const path = require('path');

const SITE_ROOT = path.resolve(__dirname, '..');
const DEFAULT_DIRS = ['blog', 'docs', 'thoughts', 'mindset', 'questions', 'designs', 'changelog', 'ideas', 'src/pages'];
const SKIP_DIRS = new Set(['node_modules', 'build', '.docusaurus', '.git']);

// Alt text that names the kind of thing, not what it shows.
const STAND_INS = new Set(['image', 'img', 'picture', 'pic', 'photo', 'screenshot', 'screen shot', 'figure', 'diagram', 'alt', 'alt text', 'todo', 'placeholder', 'untitled']);

function walk(target, acc) {
  let stat;
  try {
    stat = fs.statSync(target);
  } catch {
    return;
  }
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(target)) {
      if (!SKIP_DIRS.has(entry)) walk(path.join(target, entry), acc);
    }
  } else if (stat.isFile() && /\.mdx?$/.test(target)) {
    acc.push(target);
  }
}

/** The page with code blocks and inline code blanked out, keeping every line where it was. */
function withoutCode(text) {
  const lines = text.split('\n');
  let fence = null;
  const out = lines.map((line) => {
    const m = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (m && m[1][0] === fence[0] && m[1].length >= fence.length) fence = null;
      return '';
    }
    if (m) {
      fence = m[1];
      return '';
    }
    return line.replace(/`[^`\n]*`/g, (s) => ' '.repeat(s.length));
  });
  // MDX comments ({/* ... */}) and HTML comments can hold example markup too.
  return out.join('\n').replace(/\{\/\*[\s\S]*?\*\/\}|<!--[\s\S]*?-->/g, (s) => s.replace(/[^\n]/g, ' '));
}

/** Why this alt text tells a reader nothing, or null when it is real text. */
function altProblem(alt, src) {
  const text = alt.replace(/\s+/g, ' ').trim();
  if (!text) return 'its alt text is empty';
  if (STAND_INS.has(text.toLowerCase().replace(/[.:]$/, ''))) return `its alt text is only "${text}"`;
  const base = path.basename(String(src || '').split(/[?#]/)[0]);
  const stem = base.replace(/\.[a-z0-9]+$/i, '');
  if (base && (text === base || text === stem)) return 'its alt text is only the file name';
  return null;
}

/** The value of one attribute in a tag: { kind: 'text' | 'expr', value } or null when absent. */
function attr(tag, name) {
  const re = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{\\s*(?:"([^"]*)"|'([^']*)'|\`([^\`$]*)\`)\\s*\\}|(\\{[^}]*\\}))`, 'i');
  const m = re.exec(tag);
  if (!m) return new RegExp(`\\s${name}(?=[\\s/>])`, 'i').test(tag) ? { kind: 'text', value: '' } : null;
  if (m[6] !== undefined) return { kind: 'expr', value: m[6] };
  return { kind: 'text', value: [m[1], m[2], m[3], m[4], m[5]].find((v) => v !== undefined) };
}

// Each tag that draws a picture, and the attribute that names the picture. CardImage
// (src/components/Card) passes its alt straight to the <img> it draws.
const IMAGE_TAGS = { img: 'src', CardImage: 'cardImageUrl' };

const decorative = (tag) => /\srole\s*=\s*["']presentation["']|\saria-hidden\s*=\s*(?:["']true["']|\{\s*true\s*\})/i.test(tag);

/** Every image on the page that lacks real alt text: [{ line, image, msg }]. */
function problemsIn(text) {
  const body = withoutCode(text);
  const lineAt = (i) => body.slice(0, i).split('\n').length;
  const out = [];
  // ![alt](src "title"); the alt may hold one level of brackets.
  for (const m of body.matchAll(/!\[((?:[^\[\]\n]|\[[^\[\]\n]*\])*)\]\(\s*<?([^)\s>]*)>?[^)]*\)/g)) {
    const why = altProblem(m[1], m[2]);
    if (why) out.push({ line: lineAt(m.index), image: m[2], msg: why });
  }
  for (const m of body.matchAll(/<(img|CardImage)\b(?:[^>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*\/?>/g)) {
    const tag = m[0];
    const src = attr(tag, IMAGE_TAGS[m[1]]);
    const image = src ? (src.kind === 'expr' ? src.value : src.value) : '?';
    const alt = attr(tag, 'alt');
    if (!alt) {
      out.push({ line: lineAt(m.index), image, msg: 'it has no alt attribute' });
      continue;
    }
    if (alt.kind === 'expr') continue;
    if (!alt.value.trim() && decorative(tag)) continue;
    const why = altProblem(alt.value, src && src.kind === 'text' ? src.value : '');
    if (why) out.push({ line: lineAt(m.index), image, msg: why });
  }
  return out.sort((a, b) => a.line - b.line);
}

function selftest() {
  const cases = [
    ['![A chart of runs per arm](a.png)', 0],
    ['![](a.png)', 1],
    ['![  ](a.png)', 1],
    ['![Screenshot](a.png)', 1],
    ['![a.png](a.png)', 1],
    ['![runs-chart](/img/runs-chart.png)', 1],
    ['![Two [linked] panes](a.png)', 0],
    ['<img src="a.png" />', 1],
    ['<img src="a.png" alt="" />', 1],
    ['<img src="a.png" alt="" role="presentation" />', 0],
    ['<img src="a.png" alt="" aria-hidden="true" />', 0],
    ['<img src={useBaseUrl("/img/a.png")} alt="Two terminals side by side" />', 0],
    ['<img src={pic} alt={caption} />', 0],
    ['<img src={pic} alt={""} />', 1],
    ['<img\n  src="a.png"\n  alt="A map"\n/>', 0],
    ['```md\n![](a.png)\n```', 0],
    ['Use `![](a.png)` for that.', 0],
    ['{/* <img src="a.png" /> */}', 0],
    ["<CardImage cardImageUrl='a.jpg' />", 1],
    ["<CardImage cardImageUrl='a.jpg' alt='A cartoon dinosaur' />", 0],
  ];
  let bad = 0;
  for (const [text, want] of cases) {
    const got = problemsIn(text).length;
    if (got !== want) {
      bad++;
      console.log(`selftest FAIL: ${JSON.stringify(text)} gave ${got} problem(s), wanted ${want}`);
    }
  }
  const lines = problemsIn('one\n\n![](a.png)\n');
  if (lines[0].line !== 3) {
    bad++;
    console.log(`selftest FAIL: line number ${lines[0].line}, wanted 3`);
  }
  console.log(bad ? `selftest: ${bad} failure(s)` : `selftest: ${cases.length + 1} cases ok`);
  return bad ? 1 : 0;
}

function main(argv) {
  if (argv.includes('--selftest')) return selftest();
  const args = argv.filter((a) => !a.startsWith('--'));
  const roots = args.length
    ? args.map((a) => (fs.existsSync(a) ? path.resolve(a) : path.join(SITE_ROOT, a)))
    : DEFAULT_DIRS.map((d) => path.join(SITE_ROOT, d));
  const missing = args.filter((a, i) => !fs.existsSync(roots[i]));
  if (missing.length) {
    console.error(`validate-image-alt: no such file or folder: ${missing.join(', ')}`);
    return 2;
  }
  const files = [];
  for (const r of roots) walk(r, files);
  let problems = 0;
  let images = 0;
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    images += (text.match(/!\[|<img\b/gi) || []).length;
    for (const p of problemsIn(text)) {
      problems++;
      console.log(`ev=image_alt_missing file=${path.relative(SITE_ROOT, file)} line=${p.line} image=${p.image.replace(/\s+/g, '')} msg="${p.msg.replace(/"/g, "'")}. Say what the picture shows."`);
    }
  }
  if (problems) {
    console.log(`ev=image_alt_summary pages=${files.length} problems=${problems}`);
    return 1;
  }
  console.log(`ev=image_alt_ok pages=${files.length} images=${images}`);
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = { problemsIn, altProblem, withoutCode };
