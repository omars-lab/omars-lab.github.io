---
name: manage-explainers
description: Add, update, or move a Claude Code explainer page — a reference page under docs/craft/generative-ai/claude-code-explainers/ that explains how one part of Claude Code works (the prompt cache, the context window, subagents …), with its interactive widgets. Use when a technique page or post is carrying a long "how it works" section, a widget, or a price table that other pages could link to instead; when the user says "move this to an explainer", "make a page for the Claude widgets", "this belongs in an appendix"; or when adding a new widget that explains Claude Code. Owns the folder, the explicit section ids that other pages link to, and the move-without-breaking-links routine. Pairs with author-post (the technique page that links in) and validate-links (the hook that blocks a broken section link).
---

# Manage Claude Code explainers

Technique pages tell a story: what annoyed me, what I did about it, what it got me. When the story
leans on how something in Claude Code works, the "how it works" part goes on an **explainer page**,
and the technique links to the exact section. One explainer can back many techniques, and a
technique stays short.

(Omar, 2026-10-28, on the prompt-cache page: the "how the cache works" sections and their
calculators "should be in the appendix"; then "a dedicated page for Claude widgets that posts can
generally reference", "a dedicated tree for claude-explainer pages", "move all explainer-focused
widgets there".)

## Where things live

| What | Where |
|---|---|
| Explainer pages | `bytesofpurpose-blog/docs/craft/generative-ai/claude-code-explainers/<kebab-name>.mdx` |
| The folder's welcome page | `.../claude-code-explainers/README.mdx`. Lists every explainer, one bullet each. |
| Sidebar label | `.../claude-code-explainers/_category_.json` (`📖 Claude Code Explainers`) |
| Address | `/craft/generative-ai/claude-code-explainers/<kebab-name>`. The `slug:` drops the `/craft` prefix. |
| Widgets | `bytesofpurpose-blog/src/components/<Widget>/`, imported with `@site/src/components/...`. A widget is code; it never moves into `docs/`. "Moving a widget to the explainer" means moving where it is *used*. |

Today: `how-the-prompt-cache-works.mdx` (widgets `ContextSim`, `ChatSim`, `CostSim` from
`PromptCacheSim`).

## The page

```mdx
---
title: "How Claude Code's <Thing> Works"
description: '<50 to 160 characters: what the page explains and which widgets it has.>'
slug: /generative-ai/claude-code-explainers/<kebab-name>
kind: reference
sidebar_position: <n>
authors: [oeid]
tags: [claude-code, ai, <topic>]
draft: true
questions:
  - <a question a reader would type, which this page answers>
---

import {WidgetA, WidgetB} from '@site/src/components/<Widget>';

<Two or three sentences: what this page explains, and that the calculators let you try your own case.>

For <the decision this feeds>, see [<technique page title>](/craft/generative-ai/claude-code-techniques/<slug>).

## <Section> {#<section-id>}
...

## Related
```

Rules:

- **`kind: reference`.** An explainer explains; it has no story and no "what annoyed me".
- **Every `##` heading carries an explicit id**: `## The two time limits {#the-two-time-limits}`.
  Other pages link to these ids, so a later rewording of the heading must not change the address.
  Never rename an id once a page links to it; add a new section instead.
- **No personal numbers.** My own logs, spend and session counts stay on the technique page. The
  explainer holds what is true for anyone: prices, rules, how it behaves, calculators.
- **Prices name their source and month** under the table, as the cache page does.
- **Plain words** (CLAUDE.md "Speak plainly"), no em dashes, and `draft: true` until Omar publishes.

## Moving a section out of a technique page

1. **Copy the section word for word** into the explainer, under a heading with an explicit id.
   Bring its widget import and any price table with it. Rewording is a separate change.
2. **On the technique page**, take the section out and leave one short paragraph that links to each
   moved section by anchor, for example:
   ```md
   **How the cache works** is on its own page, [How Claude Code's Prompt Cache Works](/craft/generative-ai/claude-code-explainers/how-the-prompt-cache-works), with the calculators:

   - [The two time limits](/craft/generative-ai/claude-code-explainers/how-the-prompt-cache-works#the-two-time-limits): the prices, and why ...
   ```
   Drop the widget import if no widget is left on the page. Drop any `questions:` entry the page no
   longer answers, and give it to the explainer.
3. **Fix links into the moved sections.** Any page that linked to `technique-page#moved-section`
   now points at the explainer. The link hook finds these for you (below).
4. **Add the page to the README's list**, and point the technique folder's README entry at it.
5. **Page comments on the moved headings** show as "not found" afterwards. That is expected; reply
   on the thread naming the commit and the new page.

## Checks

Run each from the repo root:

| Check | Command | What it catches |
|---|---|---|
| Structure | `make validate-structure` | the folder's `_category_.json`, the absolute slug, the description length |
| Links | `make validate-links` | a link to a page or a `#section` that doesn't exist |
| Widgets | `make validate-mdx-imports` | a widget used but never imported |
| Search | `make validate-seo` | title and description lengths |
| Questions | `make validate-questions` | a malformed `questions:` list |

The link hook (`.claude/hooks/validate-links-hook.sh`) also runs on every edit to an `.mdx` file and
**blocks the edit** when:

- the file links to a `#section` that isn't on the target page;
- the edit renames or removes a heading id that another page links to. It names the linking page and
  line, so you can update that link in the same change.

Then look at both pages through the comment server (`http://127.0.0.1:4700`) and click one of the
section links: it should land on the heading at the top of the explainer.

## Don't

- Don't copy a section and leave the original in place. One explanation, linked from everywhere.
- Don't put a widget's code under `docs/`.
- Don't publish or un-draft an explainer; that is Omar's call.
