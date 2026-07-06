---
slug: questions-for-productionizing-a-machine-learning-system
title: "Questions for Productionizing a Machine Learning System"
description: "The operational questions that decide how an ML system actually runs in production — when to predict, how to rank, how often to train, and how to stay explainable."
authors: [oeid]
tags: [ai-engineering, llm, question-set]
date: 2020-06-16
draft: true
---

The hard part of machine learning in production usually isn't the model. It's the
operational shape around it: *when* do you compute predictions, *how* do you serve a
ranking, *how often* do you retrain, and can you explain any of it to the person
relying on the result. These are the questions I keep coming back to when thinking
through an ML system's design, grouped by the concern they belong to.

<!-- truncate -->

## Feedback and prediction cadence

- What problem are ML engineers generally concerned with here in the first place?
- How do you ingest feedback — can it be batched up, or does it need to be handled as
  it arrives?
- How often are predictions actually generated? Is this a bulk job, an online
  request, or both?
- For online prediction: when a user shows up, you have to rank the current set of
  facts for them right now. But if the underlying facts change (say, at midnight),
  you may need to recompute the top results. How do you reconcile "fresh per request"
  with "the world changed underneath you"?
- Without online-learning capability, the best you can do may be recomputing once a
  day — and the model itself might take a while to run. Does your latency budget allow
  that?

## Ranking

- How hard is it to rank for a single user? (On its own: not very.)
- But ideally you want to use data from the *entire population* to make good
  recommendations even for that one user. How do you bring population-level signal
  into a single user's ranking?

## Training

- How frequently do you retrain?
- When you're doing online training, when do you take a snapshot of the model?
- Where do heuristics fit — what can you lean on them for while the learned system
  catches up?

## Consumption

- What does the usage behavior of the user actually look like? Do they open the app
  once a day, constantly, rarely? The answer changes how often prediction and
  training are even worth doing.

## Explainability

- An explainable system is trying to balance two things at once: giving the user
  visibility into *why* they're seeing something, and giving them a genuinely good
  recommendation.
- What algorithm can balance these? You want a good recommendation service in the
  long run — but optimizing purely for that can mean recommending bad things in the
  short run while the system explores. How much short-run cost will you accept for
  long-run quality?

---

> These are my own working questions on running ML systems in production, not a
> checklist from any one source. They're the things I'd want answered before
> committing to an architecture.
