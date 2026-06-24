---
slug: recreating-an-image-as-dsl
title: '🧬 Teaching AI to Read a Pattern and Write Its Code'
kind: tutorial
sidebar_label: "Image to DSL"
description: 'I spent weeks trying to get AI to look at an Islamic geometric pattern and hand me back the code that draws it. Here is the rabbit hole: what worked, what failed, and the mistakes I kept making.'
authors: [oeid]
tags: [ai, generative-ai, geometry, dsl, computer-vision, islamic-geometric-patterns, agents]
date: 2026-06-07T10:00
draft: true
---

import Evidence from '@site/src/components/Evidence';

I have an image of a sacred geometric pattern: interlocking stars and tiles, the kind carved into mosque walls and ceilings for a thousand years. I wanted AI to look at that image and hand me back the *recipe*, the exact set of instructions that would redraw it from scratch. Not a blurry copy. The construction. The code.

That problem turned out to be a beautiful, deceptive rabbit hole, and I went all the way down it with a small fleet of AI agents. This is the honest field journal of that descent: what I tried, what worked, what failed in interesting ways, the mistakes I kept making even after I knew better, and what the research community already knows about why this is so hard.

<!-- truncate -->

## Why this is seductive, and why it's deceptively hard

If you can turn a *picture* of a pattern into the *program* that generates it, you get something magical: a drawing you can edit by changing numbers instead of pushing pixels. Want the same pattern with twelve-fold symmetry instead of ten? Change a parameter. Want it bigger, recolored, re-tiled? It's just code now.

The catch is that you're running a machine backwards. Drawing a pattern *from* a recipe is easy and deterministic: same recipe, same picture, every time. Going the other way, from a finished picture back to a recipe that would produce it, is what mathematicians call an *inverse problem*, and inverse problems are notoriously underdetermined. Lots of different recipes can produce the very same picture. (Hold onto that sentence; it comes back at the end and reframes the whole thing.)

## The cast: three small tools that argue with each other

I didn't build one big AI that reads images. I built three small, opinionated tools and made them work in a loop. Naming them up front, because the rest of the story is them passing notes to each other:

- **bikar**, the *drawer*. It takes a recipe written in a tiny custom language (a **DSL**, a domain-specific language; think "a programming language that only knows how to talk about one thing," here Islamic geometric construction) and renders the pattern as an SVG. Compass-and-straightedge moves, girih tiles, star constructions. If you can say it in bikar's language, bikar draws it.
- **qiyas**, the *looker*. Arabic قياس, "measurement." You give it a drawing and it writes down what it sees: every shape, how many sides, where it sits, what symmetry the whole thing has. Then it can compare two drawings and score how alike they are. Classical computer vision, no neural network, no training data.
- **sacred-patterns**, the *loop*. It holds a guess at the recipe, asks bikar to draw it, asks qiyas how close the drawing is to the target, nudges the recipe, and tries again. The orchestrator that keeps trying.

Put together, they form a render-score-revise loop:

```
   bikar  ──draws──▶  a drawing  ──▶   qiyas looks at it
 (the recipe)                              │
     ▲                                     ▼
     │                          "how close to the target?"
  nudge the recipe  ◀──── a similarity score ◀────┘
 (sacred-patterns)
```

It keeps going until the score stops improving. That's the whole machine.

## The trick I actually used (and its embarrassing catch)

Here's where I got clever, and where the honesty has to start.

Reading a recipe out of raw pixels is brutally hard. So I cheated, productively. When bikar draws a pattern, I had it *leave breadcrumbs in the drawing*: invisible notes attached to each shape saying "I am a six-sided polygon," "I have ten-fold symmetry," "I was built from this circle." qiyas doesn't have to *guess* those facts from jittery pixel geometry; it just *reads the notes*. I called this principle **DSL-as-source-of-truth**: when the tool that drew the thing already knows a fact for certain, propagate that fact as authoritative instead of re-deriving it downstream.[^breadcrumb]

It worked spectacularly. On a corpus of twelve patterns, the loop recovered the structure essentially perfectly, an **ARI of 1.0**.[^ari] (ARI, the Adjusted Rand Index, is a standard 0-to-1 score for "did you group these things the same way the truth groups them"; 1.0 is a perfect match.) The breadcrumb path recovered about five times more shapes than the old approach of rasterizing and re-tracing the image.

And now the catch, which I have to say plainly: **the breadcrumbs only exist because I'm the one who drew it.** A photograph of a thousand-year-old mosque ceiling has no breadcrumbs. The whole loop quietly assumes bikar is the author of record. So what I actually built, when I'm being honest, is a superb *round-trip validator*, a thing that proves "yes, this recipe really does reproduce this drawing," and **not yet** a from-a-photo *inference engine* that reads a recipe out of an image it has never seen.[^round-trip] The gap between those two is the real distance to the goal, and naming it is the most useful thing in this whole post.

## What actually worked

A few things earned their place and I'd do them all again:

- **The breadcrumb fast-path.** Reading the producer's own knowledge instead of re-deriving it dissolved a whole cluster of detector bugs at once. When you control the producer, trust the producer.
- **Two weak signals fused into one strong one.** For deciding "are these two shapes the same kind," neither pure geometry (a *turning function*, a rotation-invariant fingerprint of a shape's outline) nor pure provenance (which construction step made it) was enough alone; geometry saturated, provenance over-fragmented. Fused, they closed the gap to that ARI of 1.0.
- **Render-and-look as a discipline.** My single most repeated lesson: *don't trust a number until you've looked at the picture the number is describing.* I built a review portal and an automated browser screenshot into the loop specifically because I kept catching bugs with my eyes that every metric had cheerfully reported green.
- **Empirical root-cause over backlog hypotheses.** When something scored wrong, the move that consistently paid off was to *measure the actual cause* (render the per-case error and look) rather than guessing from a list of plausible explanations. A real measurement disproved three plausible guesses in a single afternoon more than once.

## What didn't work, and the one I want to tell as a story

There were plenty of dead ends. The hand-authored *girih* fields (the interlocking-tile quasicrystal patterns) hit a wall I'll come back to. Trying to recover a pattern's rotation by counting shapes was too coarse, because too many different angles share a shape count. And there was the self-inflicted false-green where I set a tolerance on the wrong copy of a function and "measured" the default behavior while believing I'd changed it. Painful, instructive, mine.

But the one worth telling slowly is the **F2 identity saga**, because it's the cleanest example of committing to a belief and having the data execute it.

The setup: I wanted the loop to answer "have I seen this *kind* of shape before, in some other drawing?" To grade that, I needed an answer key, a label that says which shapes count as "the same kind." The obvious choice was the names I'd already given shapes in my own patterns: `.hexagon`, `.royal`, `.turquoise`. I wrote the decision doc, picked that option, and ran it on the real corpus.

It scored badly. It put the right answer at the top of the list only about 46% of the time, where I'd hoped for 95%.[^f2-key] My first instinct (the wrong one, and I'll own it) was to assume the *measuring tool* was broken. It wasn't. The answer key was. Those names weren't shape descriptions at all; they were *colors and aspirational role-names*. The label `.hexagon` was stuck on shapes with 3, 5, 6, 7, 8, and 10 sides. `.royal` was a color worn by 4-, 8-, 12-, and 20-sided shapes. I had built a geometry tool and was grading it against an answer key that grouped shapes *by paint*.

So I reversed, and here's the part that still makes me wince. I picked what looked like the principled fix: have bikar stamp each shape with an authoritative `data-shape-id`, since the producer *knows* the true shape, so trust it, exactly per my own DSL-as-source-of-truth principle. I built the whole cross-repo cascade. Then I measured it. And `shape_id` scored *worse than the thing it replaced*, a near coin-flip. Why? Because the "authoritative" id was the *author's name for the shape*, and I'd reused a name like `scalene_tri_poly` across geometrically different triangles in different patterns: the same variable name in two files pointing at two different things.[^f2-shapeid] Authorship isn't correctness. The DSL author had named a *role*, not a geometry.

The fix that finally held was the boring one I'd had in hand the whole time: grade against the *detector's own* geometric classification (triangle, square, pentagon, decagon, lens, circle). Against that honest label, the same fingerprint scored an EER of 0.035 and a perfect top-1, proof the descriptor was never broken and the answer key always was.[^f2-geom] (EER, equal-error-rate, is a lower-is-better score for a matcher; 0.035 is very good.) Two reversals, one real lesson: a measurement is only as honest as the label you grade it against, and "I authored it, so it's true" is a trap.

## The mistakes I kept making

When I sat down and read back through weeks of my own agent transcripts (**37 distinct mistakes across six work windows**), the painful discovery wasn't any single error.[^mistakes] It was that the *same families* of error kept recurring even though I'd written down the lesson each time. Four of them, in plain terms:

1. **I committed to a premise before checking it was true.** The F2 saga above is the poster child, but it happened over and over: write the decision, pick the option, sometimes regenerate a 258-file corpus, *then* discover the premise was false.
2. **I trusted a stale claim and built on it.** A fact that was true three steps ago, inherited into a new context and used as load-bearing without re-checking, and it had quietly gone false.
3. **I tuned the metric instead of fixing the cause.** Under plateau pressure, the reflex to nudge a threshold until the gate goes green, when the gate going red was telling me something real.
4. **I shipped a verdict without looking at the picture.** An overlay in the wrong quadrant, a render that came out blank, a 27%-of-content-dropped trace, all of which a five-second look would have caught and a green test did not.

Here's the meta-lesson, and it's the one I actually believe. **A good principle written down does not save you at the moment of temptation.** I *had* the tenets: "verify before claiming done," "don't tune to fit," "render and look." The strongest, most-repeated ones still saw repeat offenses, because the moment you're most likely to skip the check (a plateau, a resumed session, a budget scare) is exactly the moment a written-down principle is easiest to rationalize past. What you need isn't a better-worded reminder; it's an *enforced check at that moment*. (That realization is literally why I just finished building a decision-coherence gate into the loop. Consider it the epilogue.)

## What the research actually says

Before I let myself feel either too clever or too foolish, I went and read what the field knows. I ran a structured literature sweep, and it was both humbling and reassuring.

The good news: **this is a real, named inverse problem**, and my overall shape is the established one. Recovering a generative program from an image is formally *program synthesis over a grammar*. [InverseCSG](https://dl.acm.org/doi/10.1145/3272127.3275006) puts it exactly: "Observing that CSG is a formal grammar, we formulate this inverse CSG problem as a program synthesis problem." And the render-score-revise loop I leaned on is *the* mechanism in the literature, not a workaround: [CSGNet](https://people.cs.umass.edu/~smaji/papers/csgnet_pami20.pdf) runs a renderer in the loop with a similarity reward and converges in about ten iterations; [VIGA](https://arxiv.org/html/2601.11109v1) (a 2026 preprint) runs "analysis-by-synthesis as an execution-grounded closed loop" that writes a program, renders it, compares, and revises.[^research-loop] I'd reinvented a wheel, but the right wheel.

The one genuinely novel wrinkle is my breadcrumb shortcut. *No* surveyed system reads producer-embedded metadata as ground truth; every published loop compares the *rendered output* perceptually or structurally. My DSL-as-source-of-truth is a shortcut the literature neither blesses nor forbids, and it's sound *precisely because* I control the producer, which is the same reason it sidesteps rather than solves the real photo case.

The dead ends got graded too. The hand-authored girih wall is **confirmed dead** by the field: [Lu and Steinhardt](https://paulsteinhardt.org/wp-content/uploads/2023/01/LuSteinhardt2007.pdf) (*Science*, 2007) showed that girih fields are generated by a *finite, deterministic substitution rule*, and that medieval artisans were effectively running a recursive subdivision algorithm.[^girih] Hand-placing tiles is genuinely the wrong move; the right move is to teach bikar the substitution rule as a single primitive. My rotation-by-shape-count dead end was **refuted**: the turning function I was already citing ([Arkin et al.](https://www.researchgate.net/publication/220181545_An_Efficiently_Computable_Metric_for_Comparing_Polygonal_Shapes), 1991) recovers orientation directly, so I'd abandoned a bad method for the right reason but missed that the replacement was already in my own bibliography. And [Bokeloh, Wand and Seidel](https://dl.acm.org/doi/10.1145/1778765.1778841) (SIGGRAPH 2010) confirmed that symmetry is the load-bearing cue for this whole class of problem, which is exactly what my loop leans on.

Then the deepest twist, the one that reframes the goal. [Kaplan](https://cs.uwaterloo.ca/~csk/publications/Papers/kaplan_2005.pdf) (2005) proved that the forward map is *many-to-one*: different underlying constructions can render the *identical* star pattern.[^kaplan] So there is no single "correct" recipe for an image, only an equivalence class of recipes that all produce it. "Recover *the* construction" was always the wrong goal; the honest target is "recover *a* construction, ideally the simplest member of the class." The problem isn't just hard. It's provably non-unique.

## What it cost

Let me be candid about the bill, because the bill is part of the point.

This was **roughly five to nine weeks of active iteration**: the intensive window runs late April through the start of June 2026, depending on where you mark the start. Across the three repos it produced **on the order of 1,200 git commits** (qiyas ~721, bikar ~331, sacred-patterns ~168, though sacred-patterns predates this project, so its project-relevant share is smaller). The retrospective that anchors this post was itself distilled from **37 transcript-witnessed mistakes across six work windows, 61 decision documents, and 239 commits scanned**.

On compute, I have to be careful and honest: **I did not meter tokens directly, because there was no meter running.** The closest proxy I have is the size of the saved agent-session transcripts on disk: about **one gigabyte** of conversation-and-tool-output (sacred-patterns ~911 MB, including a single 900 MB session that ran from April 30 to June 1; qiyas ~125 MB).[^cost] That's the back-and-forth the agents and I generated, not a token count. The true token spend is larger than the text alone, and I'm not going to invent a precise figure I didn't measure. Treat the gigabyte as a *texture-of-effort* proxy, not an invoice.

The point I want to make with those numbers isn't "look how much." It's *where* the cost went. The expensive part was not writing the code. It was the **re-deciding**: committing to a premise, having the data falsify it, reversing, sometimes regenerating a whole corpus, and doing that again. Tie it back to the mistakes section: the costliest line item in weeks of work was relitigating things I'd already decided, because the principle that should have stopped me wasn't enforced at the moment I needed it. If you want one laymanized line: *weeks of iteration, about 1,200 commits, and roughly a gigabyte of AI conversation, and the priciest part was re-deciding things I'd already decided.*

## Where it goes next

The honest open problems, in rough order of how much they'd move the needle:

- **The actual photo case.** The from-a-photo cascade (rasterize, trace, re-derive every fact with no breadcrumbs) is scoped but *has never been run*. That's the line between "round-trip validator" and "inference engine," and it's still in front of me.
- **The girih primitive.** Teach bikar the Lu-Steinhardt substitution rule as a first-class move so the quasicrystal fields render gap-free instead of being hand-faked. The field already told me this is the right answer.
- **A self-generating training pipeline.** Have bikar emit many patterns *with* their known recipes, and verify detection at scale, a technique the literature ([Gaidon et al.](https://link.springer.com/article/10.1007/s11263-018-1108-0), 2018) confirms is well-established.
- **The unanswered question:** what does the loop loop *until*? Given Kaplan's non-uniqueness, "until it matches the original exactly" may be the wrong stopping condition. "Until it matches a *member of the equivalence class*, preferring the simplest" is closer, but I haven't operationalized it yet.

## What I'd tell someone starting this

Two things.

First, the technical one: when you control the producer, lean on it shamelessly, but *write down, in big letters, exactly where that crutch stops working*, because it's the most comfortable place to fool yourself. My breadcrumbs got me to a perfect score on the easy regime and zero distance closer to the hard one, and it took me an embarrassingly long time to say that plainly.

Second, the one about working with AI agents: they are brilliant and overconfident in the same breath. An agent will commit to a premise with total fluency and build three days of work on it before the data gets a word in, which is *exactly* what I do, just faster. The fix was never a smarter agent. It was an enforced check at the moment of temptation, for the agent and for me alike. AI as a collaborator is a force multiplier on both your insight and your mistakes; the discipline that decides which one wins is the part you actually have to build.

---

> **A note on the footnotes.** Each one below points at the exact file and line range in the project's own source repos that justifies the claim. Links into the public `sacred-patterns` repo are clickable for everyone; links into the private `qiyas` and `bikar` repos render as a clickable permalink only when I'm viewing this locally (they would 404 for you), so in the public build they appear as a plain citation. The permalinks are pinned to a fixed commit, so the line ranges never drift.

[^ari]: <Evidence repo="sacred-patterns" sha="746bed6" path="docs/retrospectives/2026-06-06-image-to-dsl-retrospective.md" lines="64-66" note="the I1 SVG-direct regime reached ARI=1.0 on the 12-pattern corpus and recovered ~5x more shapes than the raster path" />

[^round-trip]: <Evidence repo="sacred-patterns" sha="746bed6" path="docs/retrospectives/2026-06-06-image-to-dsl-retrospective.md" lines="30-33" note="the executive summary's own admission: a superb round-trip validator, never yet run on a real photograph (the I2 cascade is deferred)" />

[^breadcrumb]: <Evidence repo="bikar" sha="595eb84" path="CLAUDE.md" lines="46" note="bikar Tenet 23, DSL-as-source-of-truth: when the authoring layer knows a fact, propagate it as authoritative instead of re-deriving it downstream" />

[^f2-key]: <Evidence repo="qiyas" sha="3e41793" path="docs/decisions/2026-05-29-f2-face-class-is-wrong-retrieval-label.md" lines="17-34" note="the 46% top-1 result, and the finding that the fill-class names group shapes by paint, not geometry (.hexagon spans 3,5,6,7,8,10 sides)" />

[^f2-shapeid]: <Evidence repo="qiyas" sha="3e41793" path="docs/decisions/2026-05-29-f2-face-class-is-wrong-retrieval-label.md" lines="390-401" note="the falsification table where shape_id is the worst label (mAP 0.296, near coin-flip), and the scalene_tri_poly witness with distances 0.0, 8.04, and 33.05 proving the name spans distinct triangles" />

[^f2-geom]: <Evidence repo="qiyas" sha="3e41793" path="docs/decisions/2026-05-29-f2-face-class-is-wrong-retrieval-label.md" lines="453-464" note="Option E accepted 2026-06-01: gating on the detector's geom_label gives EER=0.0346 and a perfect top-1, proving the descriptor was sound and the answer key was the problem" />

[^mistakes]: <Evidence repo="sacred-patterns" sha="746bed6" path="docs/retrospectives/2026-06-06-image-to-dsl-retrospective.md" lines="118-139" note="the repeated-mistakes section: 37 transcript-witnessed mistakes across 6 windows, and the meta-lesson that a tenet alone does not prevent the mistake at the moment of temptation" />

[^girih]: <Evidence repo="sacred-patterns" sha="746bed6" path="docs/retrospectives/2026-06-06-image-to-dsl-retrospective.md" lines="110-111" note="the three hand-authored medallion-10 girih attempts that all hit an A6=0 floor for different geometric reasons; the fix is a producer-side substitution-rule primitive" />

[^research-loop]: <Evidence repo="sacred-patterns" sha="746bed6" path="docs/retrospectives/2026-06-06-image-to-dsl-priorart.md" lines="24-38" note="prior-art verdict: the renderer-in-the-loop, iterate-until-plateau shape is Confirmed established (CSGNet ~10-iteration convergence; VIGA write-render-compare-revise)" />

[^kaplan]: <Evidence repo="sacred-patterns" sha="746bed6" path="docs/retrospectives/2026-06-06-image-to-dsl-priorart.md" lines="87-93" note="Kaplan (2005): the forward map is many-to-one, distinct constructions render the identical pattern, so 'recover the construction' is the wrong goal and the target is an equivalence class" />

[^cost]: <Evidence repo="sacred-patterns" sha="746bed6" path="docs/retrospectives/2026-06-06-image-to-dsl-retrospective.md" lines="5-13" note="the retrospective frontmatter: the 2026-04-28..2026-06-01 window, the 64 MB qiyas and 900 MB sacred-patterns transcripts (the labeled proxy for effort), 61 decision docs, 239 commits scanned" />
