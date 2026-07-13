---
name: privacy-review
description: Before publishing personal, career, or otherwise sensitive content, review what a THIRD PARTY (an employer, a competitor, a recruiter, a search engine) could infer from what ships PUBLIC, even when the body is premium-gated. The load-bearing mental model, premium gating encrypts the rendered BODY only; the title, slug/URL, description (og/meta/share), premium_teaser, tags, and any README/index that LISTS the doc all ship in CLEAR to everyone. Premium hides the CONTENT, not the FACT. So a gated "Targeting Director at LangChain" doc still tells the world you are job-hunting at LangChain via its title, URL, and teaser. TRIGGERS before publishing/un-drafting/deploying any career, job-search, personal-finance, health, family, employer-confidential, or otherwise sensitive doc; when marking something premium:true; or when the user asks "could an employer see this?", "is this safe to publish?", "will this leak?", "privacy review". Runs a CLEAR-FIELDS leak audit + a THIRD-PARTY-lens read, then recommends: publish as-is, de-identify into a generic case study, draft:true (recover but do not ship), or keep OFF the repo entirely (hand over as a local file + purge git). Pairs with manage-premium-content (the premium how/why), publish-site (the un-draft gate), deploy-site (V5 body-leak gate). A Stop hook (privacy-review-reminder) nudges at session end when sensitive content was touched.
---

# Privacy review (what actually ships public)

Before any sensitive doc goes live, ask the one question that is easy to get wrong: **what can a
third party learn from this, even if the body is locked?** This skill encodes the mental model and
the checklist so the answer is never a lucky guess.

The lesson this skill exists to prevent (a real catch): a `premium: true` career doc titled
"Targeting: Director, Deployed Engineering (LangChain)" would have shipped, and although the *body*
was encrypted, the **title, URL, description, and teaser were all public in clear**, broadcasting an
active job search at a named company (and, in the body's own frontmatter/adjacent README, the current
employer). Premium gating hid the drafts, not the fact.

## The mental model: premium gating encrypts the BODY, nothing else

The source of truth is `plugins/rehype-premium-encrypt.js`: for a `premium: true` doc it encrypts
**only the rendered body HTML** (keeping plaintext out of both the HTML and the JS bundle). Everything
else is untouched and PUBLIC. Concretely:

| Field / surface | Premium doc: is it PUBLIC? | Notes |
|---|---|---|
| **Body content** | 🔒 ENCRYPTED | The only thing gated. Anonymous readers see the teaser + lock. |
| **`title`** | 🔴 PUBLIC | Renders in `<h1>`, `<title>`, `og:title`, the sidebar, on-site search, Google. |
| **`slug` / URL** | 🔴 PUBLIC | The path itself is readable (and often descriptive). |
| **`description`** | 🔴 PUBLIC | Feeds `og:description` (SEO + social preview) AND the ShareButton text. |
| **`premium_teaser`** | 🔴 PUBLIC | Shown in clear ABOVE the lock, by design. Falls back to `description` if unset. |
| **`tags`** | 🔴 PUBLIC | Tag pages list the doc; reinforce the topic (e.g. `job-search`). |
| **A README / hub that LISTS the doc** | 🔴 PUBLIC (unless it too is premium) | The index page's link text + framing prose ship in clear. |
| **`draft: true`** | ✅ NOT SHIPPED | The whole doc (incl. frontmatter) is excluded from the prod build. |

> **Premium hides the CONTENT, not the FACT.** If the *existence* or *subject* of the doc is the
> sensitive thing, premium is the wrong tool. Use `draft: true` (recover but never ship), de-identify
> the subject, or keep it off the repo entirely.

## The review: two passes

### Pass 1, the CLEAR-FIELDS leak audit

For the doc (and any README/hub that lists it), read ONLY the public-in-clear surfaces and ask what
each one reveals to someone who never signs in:

- `title` · `slug`/URL · `description` · `premium_teaser` · `tags` · the listing README's link text +
  framing.

Flag anything that names or implies: a **target** (a company/role you want), your **current
employer** or confidential project, a **named person** (recruiter, colleague, customer), **customer
names**, **compensation**, **health/finance/family** specifics, or simply the **fact** that you are
doing something private (job-hunting, leaving, negotiating).

### Pass 2, the THIRD-PARTY-lens read

Read the whole thing as each adversarial reader in turn and write down what they would conclude:

- **Your current employer** finds this page. What do they learn? (Are you looking to leave? Did you
  expose internal metrics, roadmap, or customer names?)
- **The target company / a competitor** finds it. What do they learn about your position, your
  leverage, your other options?
- **A named third party** (recruiter, customer, colleague) finds themselves quoted or named. Are they
  OK being here? Did you publish a private message?
- **A search engine / an LLM** indexes the public fields. What does a search for your name, or the
  company, surface?

If any answer is "something I would not say to that person's face on a public stage," it is a leak.

## The dispositions (pick one, most-protective first)

1. **Keep it OFF the repo entirely.** For raw personal or employer-confidential material (customer
   names, internal metrics, comp, a named recruiter, private messages), do not publish it in any form.
   Save it as a LOCAL file outside the repo, close/don't-open the PR, delete the branch (local +
   remote), and **purge the git object store** so it is unrecoverable (see "Purge" below). This is the
   right call more often than it feels.
2. **De-identify into a generic case study.** If the METHOD is teachable but the SPECIFICS are
   sensitive, rewrite so a reader learns the craft without learning your private situation: replace the
   real target/employer/customers/people/comp with an invented archetype, shift present-tense
   "targeting X" to illustrative past, retitle to a durable-skill frame. A *partial* scrub is worse
   than none (it reads as a leak someone tried to hide), so de-identify THOROUGHLY or don't.
3. **`draft: true`.** Recover the content onto master but keep it OFF the live site (drafts are
   excluded from the prod build). Use when you want it version-controlled but not yet (or never)
   public. NOTE: the source still lives in the public repo's git history, so this protects against the
   LIVE SITE, not against someone reading the repo. For repo-secret material, use disposition 1.
4. **Publish as-is.** Only when Pass 1 and Pass 2 both come back clean, no sensitive clear-field, no
   adversarial reader learns anything you would not say publicly.

## Purge (when a sensitive doc must leave the repo)

Getting a doc out of a branch is not enough; it lingers as dangling git objects until collected.

1. Save the content to a LOCAL file OUTSIDE the repo FIRST (e.g. `~/Desktop/...`), verify it is intact.
2. Close the PR; `git checkout master`; delete the branch local (`git branch -D`) AND remote
   (`git push origin --delete <branch>`).
3. Purge the object store: `git reflog expire --expire=now --all` then `git gc --prune=now`. Verify
   the commit no longer resolves (`git cat-file -e <sha>` fails) and the file is unretrievable.
4. **Confirm it never reached the live site**: check `gh-pages` (`git ls-tree -r gh-pages | grep <slug>`)
   and the built `build/` dir. Distinguish the real doc from incidental TAG pages (a company used as a
   tech *tag* on other posts produces a `tags/<x>.html` that is NOT your doc).

> If sensitive content was ever pushed to a SHARED remote branch that others may have fetched, deleting
> the branch does not un-fetch it. Treat any exposed secret (a real credential, a customer contract) as
> compromised: rotate/notify, don't just scrub (mirrors the repo's "rotate, don't scrub" rule).

## How to run it

1. Identify the doc(s) and any README/hub listing them.
2. **Pass 1** (clear-fields audit) then **Pass 2** (third-party-lens read); write down each finding.
3. Recommend a disposition (most-protective first). When it is career/job-search/employer-confidential,
   default to disposition 1 or 2, not "publish."
4. If the disposition is off-repo, run the **Purge** steps and verify the live site is clean.
5. If a real reusable rule emerged, capture it back into THIS skill (the mental-model table, the
   adversarial-reader list) so the guard sharpens over time.

## Cross-links

- **`manage-premium-content`** — the premium POLICY (should this be premium?) + the marking MECHANICS
  (`premium: true`, teaser, the encrypt plugin, the V5 deploy gate). This skill is the PRIVACY lens on
  top: premium is a tool, not a privacy guarantee.
- **`publish-site`** — the un-draft + deploy step; run this review BEFORE un-drafting sensitive content.
- **`deploy-site`** — the V5 gate scans built HTML+JS for premium BODY leaks; it does NOT judge whether
  the public clear-fields leak the FACT. That judgment is this skill.
- **The Stop hook `privacy-review-reminder`** nudges at session end when premium/career/personal
  content was touched, so an accidental publish is caught before you walk away.
