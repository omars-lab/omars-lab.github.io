/**
 * Unit proof for the co-design importer's pure transforms
 * (.claude/skills/import-co-design/import-co-design.js).
 *
 * The importer turns a public architecture HLD into a Designs-blog .mdx post. The most
 * load-bearing transforms are the ones that keep the result BUILDABLE and hook-clean:
 * de-em-dashing (the em-dash voice hook BLOCKS U+2014 in designs/*.mdx), MDX-safety
 * (bare autolinks / stray '<' break MDX), cross-doc link rewriting, footnote + admonition
 * conversion, and the opt-in mermaid animation wrapper. These tests pin that behavior.
 *
 * We require the script directly (it guards main() behind require.main === module and
 * exports the pure functions), so there is no logic duplication to drift.
 */
/// <reference types="jest" />

// eslint-disable-next-line @typescript-eslint/no-var-requires
const T = require('../../../.claude/skills/import-co-design/import-co-design.js');

const EM = '—'; // —
const EN = '–'; // –

describe('kebab', () => {
  it('lowercases, strips punctuation, joins with hyphens', () => {
    expect(T.kebab('Self-Healing Storefront')).toBe('self-healing-storefront');
  });
  it('expands & to "and"', () => {
    expect(T.kebab('Site Scanner & Lead Engine')).toBe(
      'site-scanner-and-lead-engine'
    );
  });
});

describe('leadTitle', () => {
  it('drops a trailing em-dash subtitle', () => {
    expect(T.leadTitle(`Autonomous Build Agents ${EM} Reference Design`)).toBe(
      'Autonomous Build Agents'
    );
  });
  it('leaves a plain title intact', () => {
    expect(T.leadTitle('Markdown Review Studio')).toBe('Markdown Review Studio');
  });
});

describe('deEmDashLine — the de-em-dash contract', () => {
  it('numeric range -> "to"', () => {
    expect(T.deEmDashLine(`60${EN}70%`)).toBe('60 to 70%');
    expect(T.deEmDashLine(`D1${EN}D19`)).toBe('D1 to D19');
  });

  it('parenthetical aside PAIR -> commas', () => {
    expect(T.deEmDashLine(`A ${EM} the middle ${EM} B`)).toBe(
      'A, the middle, B'
    );
  });

  it('single spaced dash before a capital -> period (sentence break)', () => {
    expect(T.deEmDashLine(`We ship it ${EM} The data agrees`)).toBe(
      'We ship it. The data agrees'
    );
  });

  it('single spaced dash before lowercase -> semicolon', () => {
    expect(T.deEmDashLine(`fast ${EM} cheap and accurate`)).toBe(
      'fast; cheap and accurate'
    );
  });

  it('heading dash -> colon', () => {
    expect(T.deEmDashLine(`## Self-Healing ${EM} Experimentation Agent`)).toBe(
      '## Self-Healing: Experimentation Agent'
    );
  });

  it('bold decision label dash -> colon', () => {
    expect(T.deEmDashLine(`**D1 ${EM} Execution (phased)**`)).toBe(
      '**D1: Execution (phased)**'
    );
  });

  it('un-bolded decision shorthand "D3 — Autonomy" -> colon', () => {
    expect(T.deEmDashLine(`D3 ${EM} Autonomy tiers`)).toBe('D3: Autonomy tiers');
  });

  it('leaves text with no dashes untouched', () => {
    expect(T.deEmDashLine('plain prose, nothing to do')).toBe(
      'plain prose, nothing to do'
    );
  });
});

describe('entityizeDashes (used inside fences / mermaid)', () => {
  it('replaces em/en dashes with HTML entities', () => {
    expect(T.entityizeDashes(`Doc ${EM} Req ${EN} X`)).toBe(
      'Doc &#8212; Req &#8211; X'
    );
  });
});

describe('deEmDashBody — fence awareness + no em-dash leak', () => {
  it('entityizes dashes INSIDE a mermaid fence, de-em-dashes prose OUTSIDE', () => {
    const body = [
      `Intro aside ${EM} like this ${EM} ends.`,
      '```mermaid',
      `graph LR`,
      `  A["Agent ${EM} THIS DESIGN"] --> B`,
      '```',
      `After the fence ${EM} more prose.`,
    ].join('\n');
    const out = T.deEmDashBody(body).body;
    // no raw em-dash survives anywhere (the build hook greps for U+2014)
    expect(out.includes(EM)).toBe(false);
    // mermaid label kept the dash as an entity
    expect(out).toContain('Agent &#8212; THIS DESIGN');
    // prose aside became commas
    expect(out).toContain('Intro aside, like this, ends.');
  });

  it('protects inline `code` spans (dash -> entity, not comma)', () => {
    const out = T.deEmDashBody('use `a `' + EM + '` b` here').body;
    expect(out.includes(EM)).toBe(false);
  });
});

describe('mdxSafeLine — MDX build-breakers', () => {
  it('bare autolink <https://x> -> markdown link with host/path text', () => {
    expect(T.mdxSafeLine('see <https://example.com/a/b/> here')).toBe(
      'see [example.com/a/b](https://example.com/a/b/) here'
    );
  });

  it('stray "<" before a space -> &lt;', () => {
    expect(T.mdxSafeLine('latency < 50ms budget')).toBe(
      'latency &lt; 50ms budget'
    );
  });

  it('stray "<" before a digit -> &lt;', () => {
    expect(T.mdxSafeLine('keep <5 items')).toBe('keep &lt;5 items');
  });

  it('does not touch a real JSX-ish tag start (letter)', () => {
    expect(T.mdxSafeLine('<Premium>x</Premium>')).toBe('<Premium>x</Premium>');
  });
});

describe('rewriteLinks — cross-doc link rewriting', () => {
  const idMap = {
    'CO-DESIGN-2026-06-21-site-scanner-lead-engine-hld':
      '/designs/design-site-scanner',
  };

  it('rewrites a relative co-design link to its /designs slug', () => {
    const r = T.rewriteLinks(
      'see [the scanner](./CO-DESIGN-2026-06-21-site-scanner-lead-engine-hld.md)',
      idMap
    );
    expect(r.body).toBe('see [the scanner](/designs/design-site-scanner)');
    expect(r.rewritten).toBe(1);
  });

  it('preserves an #anchor on a rewritten link', () => {
    const r = T.rewriteLinks(
      '[x](./CO-DESIGN-2026-06-21-site-scanner-lead-engine-hld.md#section-6)',
      idMap
    );
    expect(r.body).toBe('[x](/designs/design-site-scanner#section-6)');
  });

  it('de-links a co-design NOT in the import set (keeps the text)', () => {
    const r = T.rewriteLinks(
      'see [legal research](./CO-DESIGN-2026-06-21-site-scanner-lead-engine-research-legal-compliance.md)',
      idMap
    );
    expect(r.body).toBe('see legal research');
    expect(r.delinked).toBe(1);
  });
});

describe('convertFootnotes — <a id> anchors -> GFM', () => {
  it('converts a reference [[a3]](#a3) -> [^a3]', () => {
    const r = T.convertFootnotes('takes 16 weeks.[[a3]](#a3) Most owners wait.');
    expect(r.body).toBe('takes 16 weeks.[^a3] Most owners wait.');
    expect(r.refs).toBe(1);
  });

  it('converts a definition line -> [^a3]: …', () => {
    const r = T.convertFootnotes(
      '<a id="a3"></a>**[a3]** CraftUp, A/B Testing Low Traffic.'
    );
    expect(r.body).toBe('[^a3]: CraftUp, A/B Testing Low Traffic.');
    expect(r.defs).toBe(1);
  });
});

describe('convertAdmonitions — labeled blockquotes -> admonitions', () => {
  it('a single-line "> **Scope note:** …" becomes :::note[Scope]', () => {
    const r = T.convertAdmonitions('> **Scope note:** Phase 1 only.');
    expect(r.body).toBe(':::note[Scope]\nPhase 1 only.\n:::');
    expect(r.converted).toBe(1);
  });

  it('"> **Terminology:** …" becomes :::info[Terminology]', () => {
    const r = T.convertAdmonitions('> **Terminology:** Agent means the system.');
    expect(r.body).toContain(':::info[Terminology]');
  });

  it('leaves a PLAIN blockquote (no label) untouched', () => {
    const q = '> just a pull quote, no label';
    expect(T.convertAdmonitions(q).body).toBe(q);
  });

  it('leaves a MULTI-line blockquote untouched (avoids mangling)', () => {
    const q = '> **Note:** first line\n> second line';
    expect(T.convertAdmonitions(q).body).toBe(q);
  });

  it('does not touch a labeled line inside a code fence', () => {
    const code = '```\n> **Scope note:** example in docs\n```';
    expect(T.convertAdmonitions(code).body).toBe(code);
  });
});

describe('animateFirstMermaid — opt-in animation wrapper', () => {
  const doc = [
    'Intro.',
    '```mermaid',
    'graph LR',
    '  A --> B',
    '```',
    'Middle.',
    '```mermaid',
    'graph TD',
    '  C --> D',
    '```',
  ].join('\n');

  it('wraps ONLY the first mermaid block', () => {
    const r = T.animateFirstMermaid(doc);
    expect(r.animated).toBe(true);
    const count = (r.body.match(/mermaid-animated/g) || []).length;
    expect(count).toBe(1);
    // wrapper opens before the first fence and closes after it
    expect(r.body).toContain('<div className="mermaid-animated">');
    expect(r.body).toContain('</div>');
  });

  it('is idempotent (re-running does not double-wrap)', () => {
    const once = T.animateFirstMermaid(doc).body;
    const twice = T.animateFirstMermaid(once).body;
    expect(twice).toBe(once);
  });

  it('no mermaid block -> no wrap', () => {
    const r = T.animateFirstMermaid('just prose, no diagram');
    expect(r.animated).toBe(false);
    expect(r.body).toBe('just prose, no diagram');
  });
});

describe('isoDate — normalizes a frontmatter date', () => {
  it('formats a JS Date as YYYY-MM-DD', () => {
    expect(T.isoDate(new Date(Date.UTC(2026, 1, 27)))).toBe('2026-02-27');
  });
  it('extracts YYYY-MM-DD from a string', () => {
    expect(T.isoDate('2026-06-22')).toBe('2026-06-22');
  });
});

describe('deriveTags — subject-aware tag sets', () => {
  it('always includes system-design + architecture', () => {
    const tags = T.deriveTags('whatever', 'Some Design');
    expect(tags).toContain('system-design');
    expect(tags).toContain('architecture');
  });
  it('adds ai-agents for agent designs', () => {
    expect(T.deriveTags('x', 'Autonomous Build Agents')).toContain('ai-agents');
  });
});

describe('clampDescription', () => {
  it('keeps the first sentence and trims to <= ~158 chars', () => {
    const d = T.clampDescription(
      'A short first sentence. A second one that should be dropped.'
    );
    expect(d).toBe('A short first sentence.');
  });
});
