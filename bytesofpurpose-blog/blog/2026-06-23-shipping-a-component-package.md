---
slug: shipping-a-component-package
title: '📦 Shipping a Component Package, and Proving It Works'
description: "How I extracted my blog's React components into a published package, proved it consumable from a second repo, and gave that repo a CI-built Pages deploy that installs it."
authors: [oeid]
tags: [system-design, devops, github-actions, generative-ai, claude]
date: 2026-06-23T10:00
draft: true
---

My blog had grown a small library of custom React components for design posts: an animated UX `Walkthrough`, a `Mockup` frame, a footnoted diagram, an assumption highlight. They were good enough that I wanted to use them in other projects too. The honest test of "reusable" is not whether the code looks clean. It is whether a *different* repo can actually install it and render it. So I set out to make that true, end to end.

<!-- truncate -->

## From components to a package

The first step was extracting the four components into a real package, `@omars-lab/blog-ui`, published to GitHub Packages. That meant a proper build (an ES module plus type declarations plus a bundled stylesheet), a release pipeline (tag, build, publish on a GitHub Actions workflow), and a dress rehearsal step so I could see exactly what would ship before it shipped. The blog itself consumes the package locally, so any breaking change shows up in the blog's build immediately.

Publishing was the easy half. The interesting half was proving the package was genuinely usable somewhere else.

## Proving it from a second repo

I have a separate teaching project, a "getting started with Claude agents" guide, that ships a simple web page. I rebuilt that page as a Vite app whose only job, for the purposes of this exercise, was to `yarn add @omars-lab/blog-ui` from GitHub Packages, import a component, and render it. If a real bundler in a real second repo could resolve the package, pull in its styles, and put a working `Walkthrough` on screen, then "reusable" was no longer an aspiration.

It worked: the bundler resolved the package, the component's scoped styles landed in the output, and the page rendered the animated walkthrough. That was the proof I wanted.

## The quieter problem: how does it deploy?

Proving the build works locally is one thing. Getting that site *deployed* is another, because the build now depended on a package behind authentication. The site published to GitHub Pages, and the existing setup served a committed copy of the built files. That has a sharp edge: if the source changes and nobody rebuilds and commits, the live site silently drifts from the source.

So I moved the deploy into CI, where every publish is a fresh build of the current source. The wrinkle is that the CI build has to install the private package, which needs a token. The neat part: because the package and the deploying repo are owned by the same account, the repository's built-in Actions token can read it directly, no personal access token, no stored secret. The build authenticates with a credential that already exists.

I wrote that migration up as a design doc, including the same-owner auth trick, the two-job build-and-deploy pattern, and how I validate the workflow before it runs:

👉 **[Building a Pages Deploy That Consumes a Private Package](/designs/design-actions-pages-deploy)**

## What I leaned on

A few first-party sources did the heavy lifting, and they are worth bookmarking if you are wiring up the same thing:

- [Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) for the build-and-deploy model.
- [actions/upload-pages-artifact](https://github.com/actions/upload-pages-artifact) and [actions/deploy-pages](https://github.com/actions/deploy-pages) for the two-job handoff.
- [actionlint](https://github.com/rhysd/actionlint) for catching workflow mistakes before they ever run in CI.

## The takeaway

"Reusable" is a claim you can actually test. Extract the code into a package, publish it, then make a *different* repo install and render it, and deploy that repo from source so the proof keeps holding. The components I started with are now a thing other projects can depend on, and there is a second site standing on them to show it.
