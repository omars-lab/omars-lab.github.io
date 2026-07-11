# Proposal: apply the guidance-in-creator / thin-audit split to three more skills

## The pattern (established by `name-post` → `audit-post-names`)

A skill that FUSES two roles — a **creation-time CONTRACT** (rules you consult *while making* the
thing) and an **AUDIT** (a `validate-*.js` + hook that flags violations) — is better split:

- the **contract** moves into the CREATION skill that owns the act of making the thing, so an author
  reads it at the moment they need it (not buried in an audit skill they'd only open to check);
- the skill becomes a **thin AUDITOR** that references the contract and runs the check.

Proven on naming: the voice-per-nature contract now lives in `author-post/mechanics.md`; the audit
is `audit-post-names`. The validator/hook files kept their names (already audit-flavored) so no
`settings.json` churn.

## The three candidates (from the survey, STRONG-ranked)

All three own a real `validate-*.js` (+ hook) AND hold an authoring contract you'd consult while
creating/homing the artifact. Ranked by leverage + isolation (cleanest first).

---

### 1. `manage-hubs` → keep as owner, but relocate the HUB-AUTHORING contract into `author-post`

**Owns:** `validate-hubs.js` + `validate-hubs-hook.sh` (ERROR-tier).
**The fusion:** the skill holds BOTH the *authoring contract* (the `(kind, area)` model, the
add-a-hub checklist, the put-a-post-on-a-hub checklist, the generic generator+`<Catalog>` pattern)
AND the audit.

**Proposed split:**
- The **"put a post on a hub"** half (a post carries `kind:` + a valid `area:` so it cards) is a
  per-post authoring concern → fold into `author-post` (a `kinds/` note or the initiatives/craft
  home guides already touch `area:`; make it explicit and point at the hub registry).
- The **"add a NEW hub"** half (register in the `HUBS` manifest, author the `kind: hub` doc that
  renders `<Catalog>`) is a rarer, structural op → **stays in `manage-hubs`** (it's genuinely a
  distinct skill, like adding a docs instance). 
- Rename question: `manage-hubs` is already partly a manager, not purely an audit. **Recommendation:
  do NOT rename it** — keep `manage-hubs` as the hub-system owner, just relocate the per-post
  authoring bit to `author-post`. This is the *lightest* of the three and the least like the
  name-post case (there's no clean "thin audit" left over — the residue is a real management skill).
- **Verdict: LOW priority.** Relocate the per-post contract; no rename. Do only if we want the
  "card a post on a hub" guidance to live where authors are.

---

### 2. `link-glossary-terms` → split into the CONTRACT (in `author-post`) + `audit-glossary-links`

**Owns:** `validate-glossary-links.js` + warn hook.
**The fusion:** the *semantic contract* ("link the FIRST genuine term-of-art use, not casual
English, once per post") is applied *while editing a post* — pure authoring judgment — yet the skill
also frames itself as the file-level triage + the validator's home.

**Proposed split:**
- Move the **linking contract** (what counts as a genuine term-of-art first-use, the one-link rule,
  the registry pointer `scripts/lib/glossary-terms.json`) into `author-post` — it belongs in the
  universal rules (rule 7 already says "link the first genuine glossary term"; expand it there or in
  `mechanics.md`).
- Rename `link-glossary-terms` → **`audit-glossary-links`**: the thin auditor that runs
  `validate-glossary-links.js` (file-level "which posts have unlinked candidates") and points at the
  contract in `author-post` for the per-occurrence call.
- Validator/hook keep their names (`validate-glossary-links` is already audit-flavored).
- **Verdict: MEDIUM priority, CLEANEST parallel to name-post.** Small, isolated, exact same shape.
  ~1 file moved + 1 rename + repoint refs. Good SECOND split to do.

---

### 3. `review-reader-experience` → extract the TOPIC-FOLDER CONTRACT into `author-post`, leave a thinner IA audit

**Owns:** `validate-docs-structure.js` + warn hook (and the `em-dash-voice-hook.sh` /
`validate-em-dash.js`).
**The fusion:** the skill *explicitly says* "This skill owns the topic-folder contract" — the docs
IA rules (topic folders, absolute instance-relative slugs, `_category_.json` position, kebab/no-
numeric-prefix, depth ≤5, description rules) — which is deep authoring guidance you consult while
CREATING or HOMING a doc. But the skill's job is a "5 audits → prioritized report" tool.

**Proposed split:**
- Move the **topic-folder contract** into `author-post` — it's already half-there: `homes/craft.md`
  summarizes it and points at `review-reader-experience` for the full contract. Invert that: the
  FULL contract lives in `author-post` (a `homes/` shared section or `mechanics.md`), and
  `review-reader-experience` references IT.
- `review-reader-experience` **keeps its name and its audit role** (it's a multi-lens reader audit:
  labels, voice, layout, IA, mis-homed docs — the IA/structure check is one lens). It becomes a
  cleaner auditor that no longer DEFINES the contract, only checks against it.
- **Caveat — biggest lift, do LAST.** The contract also feeds `manage-frontmatter-descriptions`
  (which already documents review-reader-experience as owner) and `validate-seo.js` (shares the
  description/title thresholds via `scripts/lib/seo-frontmatter.js`). Moving the contract means
  repointing those + the `homes/craft.md`/`journey.md` cross-refs. Higher blast radius.
- **Verdict: HIGH value, HIGH effort. Do THIRD (or defer).** The payoff is real (the IA contract
  belongs where docs are authored), but it touches the SEO/description machinery. Worth a dedicated
  pass, not bundled with the smaller two.

---

## Non-candidates (surveyed, ruled out)

- `manage-frontmatter-descriptions` — already IN the split shape (judgment half + external validator
  owned by review-reader-experience); it's a template for the thin side, not a candidate.
- `implement-with-design-system` — guidance-dominant; delegates its audit to the audit-* skills.
  Little audit to split OUT.
- `groom-initiatives`, `manage-changelog` — pure guidance/workflow; no owned validator/audit role.
- `validate-links`, `audit-mobile/desktop-experience`, `audit-test-realism` — already the thin-audit
  end-state (own their scripts, or report-only). Nothing to relocate.

## Status — ALL THREE DONE (on `flowdiagram-edge-hover`)

1. ✅ **`link-glossary-terms` → `audit-glossary-links`** — contract into `author-post/mechanics.md`
   ("Glossary linking"), skill slimmed to the auditor. (commit `a361a5527`, content-fix `a842bf7c9`)
2. ✅ **`manage-hubs`** — per-post carding contract relocated into `author-post/homes/{initiatives,craft}.md`;
   `manage-hubs` kept as the hub-SYSTEM owner (no rename — no thin-audit residue). (commit `a842bf7c9`)
3. ✅ **`review-reader-experience`** — done in two steps: first RECONCILED the stale contract to the
   5-instance model (commit `2ba42f444`), then RELOCATED the corrected contract into
   `author-post/homes/craft.md` ("The topic-folder contract") + slimmed the skill to the IA auditor
   that references it. The em-dash pieces + the 5 audits stayed with `review-reader-experience`.

Pattern established: a creation-time CONTRACT lives in the CREATION skill (`author-post`); the
matching AUDIT skill references it and runs the `validate-*` check. Validators/hooks keep their
(already audit-flavored) names, so `settings.json` never churns.
