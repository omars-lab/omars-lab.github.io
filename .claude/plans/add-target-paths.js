const fs = require('fs');

// Topic -> human folder name (numeric prefix set in T14; use 0-prefix placeholder now)
const TOPIC_FOLDER = {
  '01-generative-ai': '1-generative-ai',
  '02-development': '2-development',
  '03-productivity': '3-productivity',
  '04-blogging': '4-blogging',
  '05-scripting': '5-scripting',
  '06-interview-prep': '6-interview-prep',
  '07-companies': '7-companies',
  '08-entrepreneurship': '8-entrepreneurship',
  '09-faith': '9-faith',
  '10-personal-growth': '10-personal-growth',
};

const rows = fs.readFileSync('/tmp/topic-migration-map.tsv', 'utf8').trim().split('\n');
const header = rows[0];
const out = [header + '\ttarget_path'];

// strip leading NN- prefix from a path segment
const strip = s => s.replace(/^\d+-/, '');

for (const line of rows.slice(1)) {
  const cols = line.split('\t');
  const [rel, route, draft, isReadme, inbound, topic, sub, note, title] = cols;
  let target = '';

  if (topic === '(none)') {
    out.push(line + '\t' + '(no-move)');
    continue;
  }

  const tf = TOPIC_FOLDER[topic];
  const base = rel.replace(/\.mdx?$/, '');
  const ext = rel.match(/\.mdx?$/)[0];
  const fname = base.split('/').pop();

  // Default rule: place at <topic>/<fname> for top-level-ish docs; preserve a
  // meaningful sub-folder where the source had one (1 level), prefix-stripped.
  // Special handling per topic for known clusters.

  if (sub === 'prompts') {
    target = `${tf}/prompts/${fname}${ext}`;
  } else if (sub === 'vocabulary') {
    target = `${tf}/vocabulary/${fname}${ext}`;
  } else if (sub === 'culture' || sub === 'roles' || sub === 'skills') {
    target = `${tf}/${sub}/${fname}${ext}`;
  } else {
    // Preserve the immediate source sub-group folder (prefix-stripped) if the doc
    // lived more than 2 levels deep, else drop straight under the topic.
    const segs = rel.split('/'); // e.g. 6-techniques/3-blogging-techniques/2-embed-diagrams/x.mdx
    // segs[0] = old bucket; keep everything between bucket and filename, prefix-stripped
    const mid = segs.slice(1, -1).map(strip);
    // collapse: for most topics keep at most the deepest 2 mid segments to avoid >3 depth
    const keep = mid.slice(-2);
    target = [tf, ...keep, fname + ext].join('/');
  }

  out.push(line + '\t' + target);
}

fs.writeFileSync('/tmp/topic-migration-map.tsv', out.join('\n') + '\n');
console.log('target_path column added.');

// Depth check: warn on target depth > 3 (topic + 2 sub + file = depth 4 path segments incl file)
const deep = [];
for (const line of out.slice(1)) {
  const t = line.split('\t').pop();
  if (t === '(no-move)') continue;
  const d = t.split('/').length; // includes filename
  if (d > 4) deep.push(`${d}: ${t}`);
}
console.log('\n=== target paths deeper than topic/sub/sub/file (depth>4) ===');
console.log(deep.length ? deep.slice(0, 40).join('\n') : '  none');
