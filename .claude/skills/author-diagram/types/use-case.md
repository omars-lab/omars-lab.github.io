# Use-case (who USES what)

**Pick this when:** a "who uses X and what they do" figure. Actors and the capabilities they
reach. NOT a flow (nothing moves through steps) and NOT topology (this is actors, not services).

**Author with `<UseCaseDiagram>`** (mermaid has no real use-case type, so this is the only good
way here):

```mdx
<UseCaseDiagram title="Bytes of Purpose" desc="Who works with the blog and what they do."
  actors={[
    {id:'author', label:'Author', kind:'internal'},
    {id:'reader', label:'Reader'},
    {id:'cron', label:'Scheduled job', kind:'system'},
  ]}
  useCases={[
    {id:'write', label:'Write a post', detail:'Draft in MDX, run the validators.'},
    {id:'publish', label:'Publish', detail:'Build and deploy.'},
    {id:'read', label:'Read a post'},
  ]}
  links={[
    {from:'author', to:'write'}, {from:'author', to:'publish'}, {from:'cron', to:'publish'},
    {from:'reader', to:'read'}, {from:'publish', to:'write', type:'include'},
  ]}/>
```

**Gotchas:**
- Actor `kind`: `internal` + `system` pull LEFT, `external` (default) pulls RIGHT, so lines fan to
  the nearest edge. Give each actor use cases that straddle it vertically.
- TWO build-time gates THROW: the overlap gate (>25% crossing) and the actor line-angle BALANCE
  gate (a lopsided actor). `allowOverlap` downgrades both to warnings; better to reorder or split.
- `.md` cannot embed it; use `.mdx`.

**Owner:** `upgrade-post` (the `<UseCaseDiagram>` catalog entry). Live demo:
`/handbook/components/diagrams/use-case`.
