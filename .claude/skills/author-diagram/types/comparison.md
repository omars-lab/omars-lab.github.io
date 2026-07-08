# Comparison (which OPTION wins)

**Pick this when:** a decision post that weighs options against criteria, or narrates why one
choice won. This is a decision FIGURE, not a flow or a hierarchy.

**Author with the decision kit (`<ComparisonMatrix>` + `<Accordion>`):**

- **`<ComparisonMatrix>`** = the head-to-head scorecard. Options are columns; each criterion is a
  row carrying its own `cells` keyed by option id; the `chosen` column is highlighted;
  `yes` / `no` / `partial` render as marks (any other string is literal text). A cell can be
  `{rating, note, footnotes}` for a click-to-justify modal. Pass `legend` for a key.

  ```mdx
  <ComparisonMatrix title="Auth approach" legend
    options={[{id:'session', label:'Session'}, {id:'jwt', label:'JWT', chosen:true}]}
    criteria={[
      {label:'Simple', cells:{session:'yes', jwt:'partial'}},
      {label:'Stateless', cells:{session:'no', jwt:'yes'}},
    ]}/>
  ```

- **`<Accordion>`** = the foldable narrative, one `items` entry per option, each with a `summary`,
  a React `body`, and either `chosen: true` (a solid CHOSEN pill) or `verdict:'considered'` (a
  quiet pill). The accordion carries the WHY; the matrix carries the head-to-head.

  ```mdx
  <Accordion label="Why JWT won" items={[
    {summary:'Session', verdict:'considered', body:<>Simple, but stateful.</>},
    {summary:'JWT', chosen:true, open:true, body:<>Stateless, scales across nodes.</>},
  ]}/>
  ```

**Gotchas:**
- `<ComparisonMatrix>` THROWS at build on a cell keyed to a nonexistent option id.
- For explored DESIGN directions (a specimen with a chosen ring), that is `OptionGrid` /
  `DecisionNote`, NOT ComparisonMatrix (which is the feature-by-feature table).
- `.md` cannot embed these; use `.mdx`.

**Owner:** `upgrade-post` (the decision-kit catalog entry). Live demo:
`/handbook/components/structural/decision-kit`.
