---
slug: idea-instagram-metadata-scraper
title: 'Should I Build an Instagram-Metadata Scraper?'
sidebar_label: 'Instagram scraper?'
description: 'Extract Instagram metadata via an HTML/CSS selector pipeline, so post data I care about can be pulled programmatically instead of copied by hand.'
authors: [oeid]
tags: [ideas, scripting, automation, scraping, instagram]
date: 2022-04-13
kind: idea
board: ideas
stage: backlog
priority: low
draft: false
---

There is metadata on Instagram posts I would like to work with programmatically, and no clean
way to get it short of copying by hand.

<!-- truncate -->

**The idea.** A script to extract Instagram metadata via an HTML/CSS selector pipeline: point it
at a post, declare the selectors for the fields I want, and get structured data out.

## Plan

- [ ] Fetch a post's page HTML.
- [ ] Define an HTML/CSS selector pipeline for the metadata fields of interest.
- [ ] Emit the extracted fields as structured data.

## Success criteria

- Given a post, I get its metadata fields as structured output, no manual copying.

## Open questions

- How resilient is selector-based scraping to Instagram's markup changes, and is there an
  official/API path that is steadier?
