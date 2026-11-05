#!/usr/bin/env node

/**
 * validate-experiment-design.js: every experiment post says how the experiment was set up.
 *
 * An experiment post (kind experiment-plan or experiment-result, the same rule the
 * Experimentation board uses in generate-kanban-data.js) must render at least one
 * <ExperimentDesign /> block, and every such block (one per experiment the post reports) has:
 *   - a non-empty `question`
 *   - at least two `arms`, each with an id, a label and a summary
 *   - at least one `measures` entry, each with a name and a how
 *   - a `control`, when given, that names one of the arms
 *
 * and, on the same posts:
 *   - arm paragraphs go in <ExperimentArms /> (control first, wrapped, copyable), never in
 *     hand-written <Tabs groupId="arms"> / <TabItem value="arm-...">; each arm has id, label, text
 *   - a post split into <ExperimentIterations> has unique <Iteration id> values, a label on each,
 *     and its own <ExperimentDesign /> inside every Iteration
 *
 * Why the board's rule and not "any post with stage:": `stage:` is also how idea posts sit on
 * the Ideas board (20 of them in thoughts/), and those are not experiments.
 *
 * The props are read from the post's source: a quoted string, or a {...} expression that is
 * evaluated as a plain value (no access to anything else). One greppable line per problem:
 *
 *   ev=experiment_design_missing post=<file> msg="..."
 *
 * Usage:  node scripts/validate-experiment-design.js [file-or-dir ...]   (default: blog/)
 * Exit:   1 on any problem, 0 when every experiment post passes.
 *
 * Plain CommonJS so it runs on whatever node the pre-commit hook finds (v18 included).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const matter = require('gray-matter');

const ROOT = path.join(__dirname, '..');
const EXPERIMENT_KINDS = new Set(['experiment-plan', 'experiment-result']);

function walk(abs, out = []) {
  if (!fs.existsSync(abs)) return out;
  const st = fs.statSync(abs);
  if (st.isFile()) {
    if (/\.mdx?$/.test(abs)) out.push(abs);
    return out;
  }
  for (const e of fs.readdirSync(abs, {withFileTypes: true})) {
    if (e.name === 'node_modules') continue;
    walk(path.join(abs, e.name), out);
  }
  return out;
}

// Return the index just past a balanced {...} that starts at `i` (s[i] === '{'), skipping
// over quoted strings and template literals so braces inside text don't count.
function skipBraces(s, i) {
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (c === '"' || c === "'" || c === '`') {
      j = skipString(s, j);
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return j + 1;
    }
  }
  return -1;
}

function skipString(s, i) {
  const q = s[i];
  for (let j = i + 1; j < s.length; j++) {
    if (s[j] === '\\') {
      j++;
      continue;
    }
    if (s[j] === q) return j;
  }
  return s.length;
}

// Find the first <Tag ... /> (e.g. ExperimentDesign) and return its attribute source, or null.
function findBlock(body, tag) {
  const start = body.search(new RegExp(`<${tag}[\\s/>]`));
  if (start === -1) return null;
  let i = start + tag.length + 1;
  const attrsStart = i;
  while (i < body.length) {
    const c = body[i];
    if (c === '{') {
      const end = skipBraces(body, i);
      if (end === -1) return {error: 'the block never closes (unbalanced { })'};
      i = end;
      continue;
    }
    if (c === '"' || c === "'") {
      i = skipString(body, i) + 1;
      continue;
    }
    if (c === '/' && body[i + 1] === '>') return {attrs: body.slice(attrsStart, i), end: i + 2};
    if (c === '>') return {attrs: body.slice(attrsStart, i), end: i + 1};
    i++;
  }
  return {error: 'the block never closes (no />)'};
}

// Parse JSX attributes into plain values.
function parseAttrs(src) {
  const props = {};
  const errors = [];
  let i = 0;
  while (i < src.length) {
    const m = /[A-Za-z_][\w-]*/.exec(src.slice(i));
    if (!m) break;
    const name = m[0];
    i += m.index + name.length;
    while (/\s/.test(src[i] || '')) i++;
    if (src[i] !== '=') {
      props[name] = true;
      continue;
    }
    i++;
    while (/\s/.test(src[i] || '')) i++;
    const c = src[i];
    if (c === '"' || c === "'") {
      const end = skipString(src, i);
      props[name] = src.slice(i + 1, end);
      i = end + 1;
    } else if (c === '{') {
      const end = skipBraces(src, i);
      const expr = src.slice(i + 1, end - 1);
      try {
        props[name] = vm.runInNewContext(`(${expr})`, Object.create(null), {timeout: 500});
      } catch (e) {
        errors.push(`prop ${name} could not be read: ${e.message}`);
      }
      i = end;
    } else {
      errors.push(`prop ${name} has no value`);
    }
  }
  return {props, errors};
}

const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

// Check every <ExperimentDesign /> block in `body` (a page can carry one per experiment it
// reports). `where` names the iteration, if any.
function checkDesign(body, say, where) {
  const at = where ? ` in iteration "${where}"` : "";
  let rest = body;
  let n = 0;
  for (;;) {
    const block = findBlock(rest, "ExperimentDesign");
    if (!block) break;
    n++;
    if (block.error) return say(block.error + at);
    const {props, errors} = parseAttrs(block.attrs);
    const which = props.source ? ` (${props.source})` : n > 1 ? ` (block ${n})` : "";
    const sayHere = (msg) => say(msg + which + at);
    errors.forEach(sayHere);

    if (!nonEmpty(props.question)) sayHere("question is missing or empty");

    const arms = Array.isArray(props.arms) ? props.arms : [];
    if (arms.length < 2) sayHere(`needs at least two arms, found ${arms.length}`);
    arms.forEach((a, k) => {
      if (!a || !nonEmpty(a.id) || !nonEmpty(a.label) || !nonEmpty(a.summary))
        sayHere(`arm ${k + 1} needs an id, a label and a summary`);
    });

    const measures = Array.isArray(props.measures) ? props.measures : [];
    if (measures.length < 1) sayHere("needs at least one measures entry");
    measures.forEach((m, k) => {
      if (!m || !nonEmpty(m.name) || !nonEmpty(m.how)) sayHere(`measure ${k + 1} needs a name and a how`);
    });

    if (props.control !== undefined && !arms.some((a) => a && a.id === props.control))
      sayHere(`control "${props.control}" is not the id of any arm`);
    rest = rest.slice(block.end);
  }
  if (!n) say(`experiment post has no <ExperimentDesign /> block${at}`);
}

// Every <ExperimentArms /> block: arms with an id, a label and the text; control names an arm.
function checkArms(body, say) {
  let rest = body;
  for (;;) {
    const block = findBlock(rest, "ExperimentArms");
    if (!block) return;
    if (block.error) return say(block.error);
    const {props, errors} = parseAttrs(block.attrs);
    errors.forEach(say);
    const arms = Array.isArray(props.arms) ? props.arms : [];
    if (arms.length < 2) say(`<ExperimentArms /> needs at least two arms, found ${arms.length}`);
    arms.forEach((a, n) => {
      if (!a || !nonEmpty(a.id) || !nonEmpty(a.label) || !nonEmpty(a.text))
        say(`<ExperimentArms /> arm ${n + 1} needs an id, a label and its text`);
    });
    if (props.control !== undefined && !arms.some((a) => a && a.id === props.control))
      say(`<ExperimentArms /> control "${props.control}" is not the id of any arm`);
    rest = rest.slice(block.end);
  }
}

function checkPost(fp) {
  const rel = fp.startsWith(ROOT + path.sep) ? path.relative(ROOT, fp) : fp;
  let parsed;
  try {
    parsed = matter(fs.readFileSync(fp, "utf8"));
  } catch (e) {
    return [{post: rel, msg: `frontmatter could not be read: ${e.message}`}];
  }
  const {data, content} = parsed;
  if (!data || !EXPERIMENT_KINDS.has(data.kind)) return null; // not an experiment post

  const problems = [];
  const say = (msg) => problems.push({post: rel, msg});

  // Arms are shown with <ExperimentArms />, which puts the control first and wraps the text.
  if (/<Tabs\b[^>]*groupId=["']arms["']/.test(content) || /<TabItem\b[^>]*value=["']arm-/.test(content))
    say("arm paragraphs are hand-written <Tabs>; use <ExperimentArms arms={[...]} control=\"...\" /> instead");
  checkArms(content, say);

  // Several iterations: each holds its own design block, and the ids are unique.
  const iterations = [...content.matchAll(/<Iteration\b([^>]*)>([\s\S]*?)<\/Iteration>/g)];
  if (/<ExperimentIterations\b/.test(content) || iterations.length) {
    if (!iterations.length) say("<ExperimentIterations> holds no <Iteration> blocks");
    const seen = new Set();
    iterations.forEach(([, attrSrc, body], n) => {
      const {props} = parseAttrs(attrSrc);
      const id = nonEmpty(props.id) ? props.id : null;
      if (!id) say(`iteration ${n + 1} needs an id`);
      else if (seen.has(id)) say(`iteration id "${id}" is used twice`);
      if (id) seen.add(id);
      if (!nonEmpty(props.label)) say(`iteration "${id || n + 1}" needs a label`);
      checkDesign(body, say, id || String(n + 1));
    });
  } else {
    checkDesign(content, say);
  }
  return problems;
}

function main() {
  const args = process.argv.slice(2);
  const targets = args.length ? args.map((a) => path.resolve(a)) : [path.join(ROOT, 'blog')];
  const files = targets.flatMap((t) => walk(t));

  let checked = 0;
  const problems = [];
  for (const fp of files) {
    const res = checkPost(fp);
    if (res === null) continue;
    checked++;
    problems.push(...res);
  }

  for (const p of problems) {
    console.log(`ev=experiment_design_missing post=${p.post} msg="${p.msg.replace(/"/g, "'")}"`);
  }
  if (problems.length) {
    console.log(
      `ev=experiment_design_done checked=${checked} problems=${problems.length} msg="add or fix the <ExperimentDesign /> block under <ExperimentOverview />"`,
    );
    process.exit(1);
  }
  console.log(`ev=experiment_design_done checked=${checked} problems=0`);
}

main();
