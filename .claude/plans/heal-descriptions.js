#!/usr/bin/env node
// One-off batch-heal for the duplicate descriptions (#2). Replaces the exact
// boilerplate / shared description line in each file with a distinct one.
// Run from bytesofpurpose-blog/. Idempotent: only rewrites if the old line matches.
const fs = require('fs');

const EMBED_OLD = 'description: What are all the different documentation mechanics docusaurus exposes?';
const edits = [
  ['docs/blogging/embed-code/code-cells.mdx', EMBED_OLD,
   'How to embed runnable, syntax-highlighted code cells and live editors into a Docusaurus blog post.'],
  ['docs/blogging/embed-diagrams/diagrams-flow-charts.mdx', EMBED_OLD,
   'Embedding flow-chart diagrams in a Docusaurus post to visualize decisions, branches, and process steps.'],
  ['docs/blogging/embed-diagrams/diagrams-google-drawing.mdx', EMBED_OLD,
   'How to embed a Google Drawing into a Docusaurus post for quick, collaboratively-edited diagrams.'],
  ['docs/blogging/embed-diagrams/diagrams-mindnode.mdx', EMBED_OLD,
   'Embedding MindNode mind-maps into a Docusaurus post to share branching ideas and visual outlines.'],
  ['docs/blogging/embed-diagrams/diagrams-puml-sequence.mdx', EMBED_OLD,
   'Embedding PlantUML sequence diagrams in a Docusaurus post to show interactions and message order over time.'],
  ['docs/blogging/embed-external-components/html-react-elements.mdx', EMBED_OLD,
   'How to embed custom React elements inside a Docusaurus MDX post for interactive, component-driven content.'],
  ['docs/blogging/embed-external-components/html.mdx', EMBED_OLD,
   'Embedding raw HTML in a Docusaurus MDX post, and the gotchas around JSX-unsafe markup.'],
  ['docs/blogging/embed-external-components/tips.mdx', EMBED_OLD,
   'Practical tips and gotchas for embedding external components and third-party widgets in Docusaurus posts.'],
  ['docs/blogging/embed-external-components/videos-youtube.mdx', EMBED_OLD,
   'How to embed responsive YouTube videos into a Docusaurus blog post without breaking the layout.'],
  ['docs/blogging/embed-structural-components/README.mdx', EMBED_OLD,
   'Start here: the structural MDX components — cards, timelines, footers, links — for building richer Docusaurus posts.'],
  ['docs/blogging/embed-structural-components/adding-truncate-sections.mdx', EMBED_OLD,
   'Using the truncate marker to control where a Docusaurus post preview cuts off on list and feed pages.'],
  ['docs/blogging/embed-structural-components/links.mdx', EMBED_OLD,
   'How to link between posts and docs in Docusaurus so cross-references stay valid as content moves.'],
  // personal-growth pair (shared identical description)
  ['docs/personal-growth/habits-growing-professionally.mdx',
   "description: 'The practice of continuous professional growth through career development, skill enhancement, business expertise, and strategic learning'",
   'Habits for growing professionally: career development, deliberate skill-building, and strategic learning over time.'],
  ['docs/personal-growth/habits-mastering.mdx',
   "description: 'The practice of continuous professional growth through career development, skill enhancement, business expertise, and strategic learning'",
   'Habits for mastering a craft: deep practice, feedback loops, and the discipline that turns competence into expertise.'],
];

let ok = 0, miss = 0;
for (const [file, oldLine, newDesc] of edits) {
  const src = fs.readFileSync(file, 'utf8');
  const newLine = `description: ${newDesc}`;
  if (!src.includes(oldLine)) {
    console.log(`  ✗ MISS (old line not found): ${file}`);
    miss++;
    continue;
  }
  fs.writeFileSync(file, src.replace(oldLine, newLine));
  console.log(`  ✓ ${newDesc.length}ch  ${file}`);
  ok++;
}
console.log(`\n${ok} healed, ${miss} missed.`);
process.exit(miss ? 1 : 0);
