Your job is to ensure each of the blog files have the appropriate front matter.


## Blog Front Matter

Find the `.md/.mdx` files in `bytesofpurpose-blog/blog`. Ensure each of the files starts with a frontmatter section similar to the following:

---
slug: '<unique-id-short-code>'
title: '<Frontend Title>'
description: '<1 sentance description>'
authors: [oeid]
tags: [...]
date: '<date>'
---

### Frontmatter Attributes

* `slug` should be a unique id that no other blog posts share. Note that the slug will be part of the URL and should be sensible.
* `title` should be the primary title we show at the begining of the blog post
* for the `description`, attempt to identify the core question that the blog post addresses and use it as the description. If its simpler to summarize without describing in a question format, then use the simple description.
* Do not attempt to edit the content of the blog post itself. If the content is rough, feel free to add a `draft: true` attribute to the front matter.
* For learning topics and project notes in `/docs`, default to `draft: true` unless the content is publication-ready
* For blog posts in `/blog`, default to `draft: false` unless content needs significant work
* If you do mark a post as a draft when crafting the front matter, ensure there is a section at the bottom of the blog post summarizing the enhancements that should be made to the post prior to publishing it / removing it from draft mode. Ensure the suggestions are structured as markdown todos: `- [ ]` with the date of the suggestion appended to the end of each todo, example: `>2025-01-01`
* `tags` should be a list of seo friendly terms explorers can use to find this blog post when using search engines. Example: `[development, process, workflow, ideation, roadmap]`
* `date` should be the date in which this blog post is concieved. If there are todos in this blog post with dates, attempt to use the earliest date within the post as the conception date. The date should be in the following format: `2022-04-19T10:00` where the date and time without seconds are kept. If there are no dates present, use the time now as the date in the format specified.

## Docs Front Matter

Follow the same instructions as the Blog Front Matter, but instead of looking in `bytesofpurpose-blog/blog`, look in `bytesofpurpose-blog/docs`.

## Processing Order
1. Process `/blog` files first (these are publication-ready)
2. Process `/docs` files with existing proper frontmatter (add missing `date`)
3. Process `/docs` files with non-conforming frontmatter
4. Process `/docs` files with no frontmatter

## Non Conforming Front Matter

* Note, some files may have been important from another system with the intent to turn them into a blog post. So they might have a front matter section, but it might not be in the proper format. 

Example: ```
---
id: learning-about-linear-algebra
type: idea
yields: 
	- software
	- notebook
---
```

Another example:
```
---
epic: https://sacred-patterns.atlassian.net/browse/THREAD-27
summary: 'Learning/Learn: OAuth'
task: https://sacred-patterns.atlassian.net/browse/THREAD-30
xcallback: vscode://file/Users/omareid/Workspace/git/blueprints/initiatives/learning-oauth.md:1
---
```

Complex example with multiple sections:
```
---
category: tool
content:
  md5: 85990bc1b5f834db960f1203323bbcb6
glue: https://glue/blueprints/#id.tool.mdcat
jira:
  epic: https://sacred-patterns.atlassian.net/browse/THREAD-36
  task: https://sacred-patterns.atlassian.net/browse/THREAD-44
priorities:
  - I need to cat markdowns with links
summary: Catting Markdown Links
tag: '#id.tool.mdcat'
trello:
  card: https://trello.com/c/q1PtRO1N
  done: false
  id: 63c8c885f92ad70404a558ce
  list: 63c43d5498733701c29d3a12
---
```

* See if you can repurpose as much of this front matter as possible:
    * `id` → `slug` (clean up formatting)
    * `summary` → `title` 
    * `yields` → additional `tags`
    * `category` → additional `tags`
    * `content` → extract `description` from content
    * `priorities` → move to "Priorities" section in content
    * Extract dates from `jira`, `trello`, or content for `date`
    * Remove all non-standard attributes (jira, trello, glue, content, etc.)
    * If there are multiple non-conforming frontmatter sections, consolidate them into a single proper frontmatter

## Important!
* Don't delete any files!
* Don't remove any content that is outside the starting frontmatter section!
* Don't create any new documents / edit existing markdown files!
* Edit files one at a time! 

