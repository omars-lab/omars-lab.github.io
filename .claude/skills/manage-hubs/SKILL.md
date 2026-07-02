---
name: manage-hubs
description: The durable-HUB system end to end. A hub is a /craft index page (kind: hub 🗂️) that catalogs temporal /initiatives posts of ONE activity kind, grouped by AREA, via a generated <Catalog>. Owns the hub registry (the HUBS manifest in scripts/generate-hubs-data.js), the (kind, area) frontmatter model, the generic generator+component pattern, and the add-a-hub / add-a-post checklists. Use when adding a new hub, adding or re-homing a post that should appear on a hub, changing a hub's areas, or when validate-hubs / the hub build looks wrong. Pairs with groom-initiatives (which boards temporal work), implement-with-design-system (the Catalog is on-brand UI), and maintain-showcase (the sibling generated-index pattern).
---

# Manage hubs

A **hub** is the durable half of the durable-vs-temporal split for a whole *activity*: a
`/craft` index page that gathers the dated `/initiatives` logs of one kind of work and lays them
out by area, so you can scan the entire body of that work at once. Projects, Tinkering, and
Research are hubs. This skill owns the hub system so it stays drift-free.

## The model: a hub = (kind, area)

Every hub-eligible `/initiatives` post carries two frontmatter fields:

- **`kind:`** — the ACTIVITY, and the hub discriminator. `project` 🔨 (a dated build log),
  `tinkering` 🔧 (exploratory dabbling), `research` 🔬 (learning / to-learn). Source of truth:
  `bytesofpurpose-blog/scripts/lib/blog-kinds.json`.
- **`area:`** — the DOMAIN, and how the hub GROUPS. `backend` / `frontend` / `script` / `plugin`
  (anything else lands under `other`). ONE unified field across all hubs (not per-hub `*_area`).

A hub renders "posts of kind X, grouped by area". Moving a post between areas is a one-field
`area:` edit; it re-sorts on the hub automatically. So the hub can never drift from its posts.

The hub PAGE itself is a `/craft` doc with `kind: hub` 🗂️ that renders `<Catalog kind="…"/>`. It
gets its 🗂️ sidebar emoji from the kind (the `draft-docs` plugin's docs kind-emoji wiring), so its
`title:` carries NO hand-typed emoji.

## The registry (single source of truth)

The **`HUBS` manifest** in `bytesofpurpose-blog/scripts/generate-hubs-data.js` is the ONE list of
hubs. Each entry: `{ kind, out, file, areas }` (the activity kind, the `src/components/<out>` dir
that holds the generated JSON, the JSON filename, and the ordered area vocabulary).

Current hubs:

| Hub | `kind` | Page | Grouped by |
|---|---|---|---|
| Projects | `project` 🔨 | `/craft/software-development/projects` | area |
| Tinkering | `tinkering` 🔧 | `/craft/software-development/tinkering` | area |
| Research | `research` 🔬 | `/craft/software-development/research` | area (also cards on the [Research board](/craft/product-management/research) by stage) |

## The machinery

- **Generator** `scripts/generate-hubs-data.js` — scans `blog/` once, buckets each hub-kind post
  into `HUBS[kind].out/<file>` by its `area`. A generated asset: gitignored, wired into
  `npm run generate-assets`, and blocked by `.claude/hooks/block-generated-edits.sh`. Requiring the
  module (for the manifest) does NOT regenerate — the write is guarded by `require.main === module`.
- **Component** `src/components/Catalog` — the generic `<Catalog kind="…"/>`. Imports each hub's
  JSON, groups by `AREA_META`, links published posts and renders drafts muted ("in progress", no
  link — a link to a draft 404s in prod). Registered in `src/theme/MDXComponents.tsx`.
- **Validator** `scripts/validate-hubs.js` (`make validate-hubs`) — ERRORS when a `kind: hub` doc
  renders no `<Catalog>` / an unregistered kind, or a hub-kind post has a missing/invalid `area:`.
  Orphan hub kinds (registered, unrendered) warn. The warn-tier PostToolUse hook
  `.claude/hooks/validate-hubs-hook.sh` runs it on a `/craft` doc or `blog/` post edit.

## Add a NEW hub

1. Add an entry to the `HUBS` manifest in `generate-hubs-data.js` (`kind`, `out`, `file`, `areas`).
2. If the activity `kind` is new, add it to `scripts/lib/blog-kinds.json` (emoji + outline) — and a
   `catalog`/`description` outline for `kind: hub` is already enforced on docs.
3. Add the generated JSON path to `.gitignore` and the `block-generated-edits.sh` case.
4. Create the hub doc `docs/craft/.../<hub>/README.md` (`kind: hub`, absolute `slug:`,
   `_category_.json`, a `description:`, and `<Catalog kind="…"/>` in the body). No leading title
   emoji (the kind supplies 🗂️).
5. `make generate-assets` (writes the new JSON so the `<Catalog>` import resolves), then
   `make validate-hubs` + build + a visual + mobile pass on the new hub.

## Put a POST on a hub (or re-home one)

Give the `/initiatives` post `kind:` (the activity) + `area:` (a valid area for that hub). If it is
moving OUT of `/craft` (a dated log that was mis-filed as durable), use the proven move: surgical
frontmatter reshape (slug→bare, ensure `date:`, set `kind:`, add `area:`) + `git mv` into `blog/`
as `YYYY-MM-DD-<slug>` (NEVER a gray-matter reserialize — it escapes emoji titles). All-draft moves
need no redirect (a draft has no public `/craft` URL, and the redirect gate rejects a draft target);
add the redirect when the post is published. Then `make generate-assets` + `make validate-hubs`.

## Gotchas

- **Drafts differ by surface.** A hub KEEPS drafts (shown muted, unlinked) because it renders in
  dev + prod; the kanban board DROPS drafts (a card links to a prod URL). So a draft research post
  shows on the Research hub but not (yet) the Research board — it cards there once published.
- **The `<Catalog>` import needs all three JSONs to exist.** `generate-hubs-data.js` always writes
  every hub's JSON (empty if no posts), so run `generate-assets` before a build on a fresh checkout.
- **`plugin` area, `plugins` topic.** A plugin build log is `area: plugin` on a hub; the `/craft`
  `plugins` topic keeps a landing README that points at the plugin-area entries on the hubs.

## Files this skill owns

`scripts/generate-hubs-data.js` (registry + generator), `src/components/Catalog` (component),
`scripts/validate-hubs.js` + `.claude/hooks/validate-hubs-hook.sh` + `make validate-hubs` (the
gate), the `hub`/`project`/`tinkering` kinds in `scripts/lib/blog-kinds.json`, and the hub docs
under `docs/craft/software-development/{projects,tinkering,research}`.
