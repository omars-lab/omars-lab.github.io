---
slug: /product-management/experiments
title: '🔬 Experiments'
description: 'Structured experiments using scientific methods including A/B testing, randomized controlled trials (RCTs), and hypothesis-driven experimentation.'
authors: [oeid]
tags: [experiments, ab-testing, rct, randomized-controlled-trials, hypothesis-testing, data-driven, scientific-method, projects]
draft: false
---

# Experiments

Structured experiments using scientific methods to test hypotheses, validate assumptions, and make data-driven decisions. Experiments are a type of project focused on validation and learning.

## What Are Experiments?

Experiments are **structured, hypothesis-driven projects** that follow scientific methodology:

- 🧪 Test specific hypotheses with controlled conditions
- 📊 Use data and metrics to measure outcomes
- 🎯 Have clear success criteria and measurable results
- 📈 Compare variations (A/B testing) or control vs treatment groups (RCTs)
- ✅ Produce actionable insights and validated learnings

## Experimental Methods

### A/B Testing
* [ ] Test variations of features, designs, or implementations
* [ ] Compare two or more versions with different user groups
* [ ] Measure key metrics to determine which performs better
* [ ] Use statistical significance to validate results

### Randomized Controlled Trials (RCTs)
* [ ] Test interventions with control and treatment groups
* [ ] Randomize participants to minimize bias
* [ ] Measure outcomes objectively
* [ ] Use proper sample sizes for statistical power

### Hypothesis Testing
* [ ] Formulate clear hypotheses before testing
* [ ] Define success metrics and criteria
* [ ] Design experiments to validate or refute hypotheses
* [ ] Document assumptions and learnings

## Experiment Structure

### Planning
* [ ] Define the hypothesis or question to test
* [ ] Identify success metrics and measurement methods
* [ ] Design the experimental setup
* [ ] Determine sample size and duration

### Execution
* [ ] Implement the experiment with proper controls
* [ ] Collect data systematically
* [ ] Monitor for issues or anomalies
* [ ] Ensure proper randomization and bias mitigation

### Analysis
* [ ] Analyze results with appropriate statistical methods
* [ ] Determine statistical significance
* [ ] Document findings and insights
* [ ] Make data-driven decisions based on results

## Difference from Tinkering

**Experiments** are structured and hypothesis-driven, while **tinkering** is exploratory and informal:

- **Tinkering** → Exploratory, learning-focused, informal testing
- **Experiments** → Structured, hypothesis-driven, data-validated testing

*Note: Tinkering has been moved to its own section at `/docs/developing/tinkering`*

## 📋 Experiment timeline

Every experiment gets **one doc in this folder** that is both its **design** and its
**living timeline**: hypothesis, why we placed it where we did, status, and outcome.
Each row below links to that doc. Lifecycle:
`proposed → designed → draft → running → analyzing → concluded → rolled-out / abandoned`.

| Experiment | Flag | Status | Started | Outcome |
|---|---|---|---|---|
| Support CTA: link vs button (draft) | `support-button-copy` | 🟢 running | 2026-06-01 (re-scoped) | pending |

> Add a row when you start an experiment; update its status as it moves through the
> lifecycle. New entry from `_TEMPLATE.md`. The five skills below each own a phase and
> keep the doc + this table current.

### The experiment lifecycle (skills)

| Phase | Skill | Does |
|---|---|---|
| **Design** | `design-experiment` | Writes the pre-experiment design doc (this folder): hypothesis, design, placement rationale. |
| **Execute** | `run-ab-test` | Adds the code injection point, creates/validates/launches the PostHog experiment, Playwright-validates variants. |
| **Analyze** | `analyze-experiment` | Pulls the exposure + conversion split, checks significance, writes the Outcome + a recommendation. |
| **Decide** | `decide-experiment` | Applies decision gates (significance/MDE/guardrails) + judgment → a recorded decision readout. |
| **Roll out** | `conclude-experiment` | Executes the decision (keep control & clean up, or ship treatment for good) and finalizes the doc. |

## What You'll Find Here

- A/B tests and multivariate tests
- Randomized controlled trials
- Hypothesis-driven experiments
- Data-driven validation studies
- Experimental results and learnings

