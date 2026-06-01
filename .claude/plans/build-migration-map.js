const fs = require('fs');

// Load inventory
const inv = fs.readFileSync('/tmp/doc-inventory.tsv', 'utf8').trim().split('\n').slice(1).map(l => {
  const [rel, slug, route, draft, isReadme, inbound, title] = l.split('\t');
  return { rel, slug, route, draft: +draft, isReadme: +isReadme, inbound: +inbound, title };
});

// Topic codes
const T = {
  GENAI: '01-generative-ai',
  DEV: '02-development',
  PROD: '03-productivity',
  BLOG: '04-blogging',
  SCRIPT: '05-scripting',
  INTERVIEW: '06-interview-prep',
  COMPANIES: '07-companies',
  ENTRE: '08-entrepreneurship',
  FAITH: '09-faith',
  GROWTH: '10-personal-growth',
};

// Assignment: returns {topic, sub (optional), note}
function assign(d) {
  const p = d.rel;

  // ---- GENERATIVE AI ----
  if (p.startsWith('3-mental-models/6-understanding-the-genai-domain/')) return { topic: T.GENAI };
  if (p.startsWith('7-skills/solving-system-design/')) return { topic: T.GENAI, note: 'system-design = genai systems' };
  if (p === '5-craftsmanship/3-workflows/2025-09-30-how-i-use-genai.md') return { topic: T.GENAI };
  if (p === '5-craftsmanship/4-tools/2025-09-30-my-personal-mcp-setup.md') return { topic: T.GENAI };
  if (p === '4-development/3-tinkering/2025-09-30-tinkering-with-rag.md') return { topic: T.GENAI };
  if (p.startsWith('4-development/5-initiatives/llm-')) return { topic: T.GENAI };
  if (p === '5-craftsmanship/1-workspace/running-llms-locally.md') return { topic: T.GENAI };
  // (habits-mastering decided -> Personal Growth, handled below)

  // ---- INTERVIEW PREP ----
  if (p.startsWith('7-skills/preparing-for-interviews/')) return { topic: T.INTERVIEW };
  if (p.startsWith('7-skills/solving-coding-challenges/')) return { topic: T.INTERVIEW };
  if (p.startsWith('3-mental-models/1-understanding-data-structs-and-algos/')) return { topic: T.INTERVIEW, note: 'DSA -> interview prep (per plan: DSA in interview journey)' };
  if (p === '3-mental-models/3-understanding-processes/understanding-the-interview-process.md') return { topic: T.INTERVIEW };

  // ---- COMPANIES (Roles + Culture + Skills) ----
  if (p.startsWith('3-mental-models/2-understanding-cultural-values/')) return { topic: T.COMPANIES, sub: 'culture' };
  if (p.startsWith('3-mental-models/4-understanding-career-levels/')) return { topic: T.COMPANIES, sub: 'roles' };
  if (p.startsWith('3-mental-models/5-understanding-skills/')) return { topic: T.COMPANIES, sub: 'skills' };
  // refining-soft-skills -> Companies/Skills (general employee skills)
  if (p.startsWith('7-skills/refining-soft-skills/')) return { topic: T.COMPANIES, sub: 'skills' };

  // ---- BLOGGING ----
  if (p.startsWith('6-techniques/3-blogging-techniques/')) return { topic: T.BLOG };
  if (p.startsWith('6-techniques/4-documentation-techniques/')) return { topic: T.BLOG };
  // author-tooling prompts
  if (p.startsWith('10-prompts/evals/')) return { topic: T.BLOG, sub: 'prompts', note: 'author-tooling prompt' };
  if (p.startsWith('10-prompts/heal/')) return { topic: T.BLOG, sub: 'prompts', note: 'author-tooling prompt' };
  if (p === '10-prompts/meta/prompt-maturity-framework.md') return { topic: T.BLOG, sub: 'prompts', note: 'author-tooling prompt' };
  if (p === '10-prompts/refactor/role-refactoring-system.md') return { topic: T.BLOG, sub: 'prompts', note: 'author-tooling prompt' };
  if (p === '10-prompts/author/blog-post-author.md') return { topic: T.BLOG, sub: 'prompts' };
  if (p === '8-habits/habits-blogging.mdx') return { topic: T.BLOG };

  // ---- SCRIPTING ----
  if (p.startsWith('6-techniques/7-scripting-techniques/')) return { topic: T.SCRIPT };
  if (p.startsWith('4-development/7-roadmaps/2-productivity-scripts/')) return { topic: T.SCRIPT };

  // ---- FAITH ----
  if (/athan|quran|tasbeeh/.test(p)) return { topic: T.FAITH };
  if (p === '4-development/6-projects/frontend-projects/apps/prayer-tracking-apple-watch-app.md') return { topic: T.FAITH };
  if (p === '4-development/6-projects/frontend-projects/graphs/hifz-graph.md') return { topic: T.FAITH };
  if (p === '8-habits/habits-growing-spiritually.mdx') return { topic: T.FAITH };

  // ---- ENTREPRENEURSHIP ----
  if (p === '8-habits/habits-entrepreneurship.mdx') return { topic: T.ENTRE };
  if (p === '4-development/2-research/learning-topics/learning-business.md') return { topic: T.ENTRE };

  // ---- PERSONAL GROWTH (explicit) ----
  if (p === '8-habits/habits-mastering.mdx') return { topic: T.GROWTH, note: 'professional growth' };
  if (p === '8-habits/habits-managing-finances.mdx') return { topic: T.GROWTH, note: 'personal finance' };

  // ---- PRODUCTIVITY ----
  if (p.startsWith('5-craftsmanship/2-processes/')) return { topic: T.PROD };
  if (p.startsWith('6-techniques/1-analysis-techniques/')) return { topic: T.PROD };
  if (p.startsWith('6-techniques/2-automation-techniques/')) return { topic: T.PROD };
  if (p.startsWith('6-techniques/6-organization-techniques/')) return { topic: T.PROD };
  if (p.startsWith('6-techniques/6-discovery-techniques/')) return { topic: T.PROD };
  if (p.startsWith('6-techniques/9-tool-usage-techniques/')) return { topic: T.PROD };
  if (p.startsWith('4-development/6-projects/frontend-projects/productivity/')) return { topic: T.PROD };
  if (p.startsWith('4-development/6-projects/frontend-projects/dashboards/')) return { topic: T.PROD, note: 'dashboards = productivity trackers' };
  if (p === '2-definitions/terminology-cli.mdx') return { topic: T.PROD, sub: 'vocabulary' };
  if (p === '2-definitions/terminology-development.mdx') return { topic: T.PROD, sub: 'vocabulary' };
  if (p === '2-definitions/terminology-project-managementment.mdx') return { topic: T.PROD, sub: 'vocabulary', note: 'typo fix -> terminology-project-management' };
  // habits -> productivity
  if (/^8-habits\/habits-(organizing|planning|prioritizing|managing-time|tracking|reviewing|consolidating|process-engineering|automating)\.mdx$/.test(p)) return { topic: T.PROD };

  // ---- DEVELOPMENT ----
  if (p.startsWith('6-techniques/5-development-techniques/')) return { topic: T.DEV };
  if (p.startsWith('6-techniques/8-security-techniques/')) return { topic: T.DEV };
  if (p.startsWith('4-development/1-ideas/')) return { topic: T.DEV };
  if (p.startsWith('4-development/2-research/')) return { topic: T.DEV };
  if (p.startsWith('4-development/3-tinkering/')) return { topic: T.DEV };
  if (p.startsWith('4-development/4-pocs/')) return { topic: T.DEV };
  if (p.startsWith('4-development/5-initiatives/')) return { topic: T.DEV }; // non-llm initiatives readme
  if (p.startsWith('4-development/6-projects/')) return { topic: T.DEV }; // remaining projects
  if (p.startsWith('4-development/7-roadmaps/')) return { topic: T.DEV };
  if (p === '4-development/README.mdx') return { topic: T.DEV };
  if (p === '2-definitions/terminology-blog.mdx' || p === '2-definitions/terminology-blog.md') return { topic: T.DEV, sub: 'vocabulary' };
  if (p === '2-definitions/terminology-portfolio.mdx') return { topic: T.DEV, sub: 'vocabulary' };
  if (/^8-habits\/habits-(developing|tinkering)\.mdx$/.test(p)) return { topic: T.DEV };

  // ---- PERSONAL GROWTH (remaining habits + personal) ----
  if (p.startsWith('8-habits/')) return { topic: T.GROWTH };
  if (p === '10-prompts/organize/personal-life-content-organizer.md') return { topic: T.GROWTH, sub: 'prompts' };

  // ---- leftover prompts ----
  if (p === '10-prompts/analyze/sql-query-analyzer.md') return { topic: T.DEV, sub: 'prompts' };
  if (p === '10-prompts/draw/kanban-board-customization.md') return { topic: T.PROD, sub: 'prompts' };
  if (p === '10-prompts/author/star-story-author.md') return { topic: T.INTERVIEW, sub: 'prompts', note: 'STAR stories = interview' };
  if (p === '10-prompts/organize/daily-todo-carry-over.md') return { topic: T.PROD, sub: 'prompts' };

  // ---- leftover craftsmanship ----
  if (p.startsWith('5-craftsmanship/1-workspace/')) return { topic: T.DEV, note: 'workspace setup' };
  if (p.startsWith('5-craftsmanship/4-tools/')) return { topic: T.DEV };
  if (p.startsWith('5-craftsmanship/5-bookmarks/')) return { topic: T.DEV };
  if (p.startsWith('5-craftsmanship/6-tips/')) return { topic: T.DEV };
  if (p === '5-craftsmanship/README.mdx') return { topic: null, note: 'DROP: craftsmanship index dissolves' };

  // ---- remaining definitions ----
  if (p === '2-definitions/acronyms.mdx' || p === '2-definitions/emojis.mdx') return { topic: T.PROD, sub: 'vocabulary', note: 'general glossary' };
  if (p === '2-definitions/README.md') return { topic: null, note: 'DROP: definitions index dissolves' };

  // ---- welcome ----
  if (p.startsWith('1-welcome/')) return { topic: null, note: 'WELCOME stays at root' };

  // index READMEs of dissolving buckets
  if (p === '3-mental-models/README.md' || p === '6-techniques/README.mdx' || p === '7-skills/README.md' || p === '10-prompts/README.md' || p === '10-prompts/future-plans.md') {
    return { topic: null, note: 'DROP/REHOME: bucket index dissolves' };
  }

  return { topic: null, note: 'UNASSIGNED ***' };
}

const out = [];
const unassigned = [];
const contested = [];
for (const d of inv) {
  const a = assign(d);
  out.push({ ...d, ...a });
  if (a.topic === null && !/WELCOME|DROP|REHOME/.test(a.note || '')) unassigned.push(d.rel);
  if (a.note && /CONTESTED|UNASSIGNED/.test(a.note)) contested.push(`${d.rel}  [${a.topic}]  ${a.note}`);
}

// Write map
const header = 'current_rel\troute\tdraft\tisReadme\tinbound\ttopic\tsub\tnote\ttitle';
fs.writeFileSync('/tmp/topic-migration-map.tsv',
  header + '\n' +
  out.map(r => [r.rel, r.route, r.draft, r.isReadme, r.inbound, r.topic || '(none)', r.sub || '', r.note || '', r.title].join('\t')).join('\n') + '\n');

// Summary
const counts = {};
out.forEach(r => { const k = r.topic || '(none/welcome/drop)'; counts[k] = (counts[k] || 0) + 1; });
console.log('=== docs per target topic ===');
Object.entries(counts).sort().forEach(([k, v]) => console.log(`  ${k}: ${v}`));
console.log('\n=== UNASSIGNED (should be 0) ===');
console.log(unassigned.length ? unassigned.join('\n') : '  none');
console.log('\n=== CONTESTED / needs-decision ===');
console.log(contested.length ? contested.join('\n') : '  none');
console.log('\nmap written to /tmp/topic-migration-map.tsv');
