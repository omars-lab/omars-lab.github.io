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
* Do not attempt to edit the content of the blog post itself. If the content is rought, feel free to add a `draft: true` attribute to the front matter. If you do mark a post as a draft when crafting the front matter, esnure there is a section at the bottom of the blog post summarizing the enhancements that should be made to the post prior to publishing it / removing it from draft mode. Ensure the suggestions are structured as mardown todos: `- [ ]` with the date of the suggestion appended to the end of each todo, example: `>2025-01-01`
* `tags` should be a list of seo friendly terms explorers can use to find this blog post when using search engines. Example: `[development, process, workflow, ideation, roadmap]`
* `date` should be the date in which this blog post is concieved. If there are todos in this blog post with dates, attempt to use the earliest date within the post as the conception date. The date should be in the following format: `2022-04-19T10:00` where the date and time without seconds are kept.


## Docs Front Matter

Follow the same instructions as the Blog Front Matter, but instead of looking in `bytesofpurpose-blog/blog`, look in `bytesofpurpose-blog/docs`.

## Important!
* Don't delete any files!
* Don't remove any content that is outside the starting frontmatter section!
* Don't create any new documents / edit existing markdown files!
* Edit files one at a time! 

