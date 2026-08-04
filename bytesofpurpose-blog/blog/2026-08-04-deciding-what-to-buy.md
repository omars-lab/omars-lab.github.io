---
slug: deciding-what-to-buy
title: "Deciding What to Buy"
kind: framework
sidebar_label: "Deciding What to Buy"
description: "A framework for making a purchase decision on evidence instead of spec sheets: rule things out before you score them, grade every claim by how you learned it, and never quote an asking price as a market price."
authors: [oeid]
tags: [decision-making, evaluation, best-practices, research]
date: 2026-08-04T10:00
draft: true
---

The listing said the printer could run PEEK-CF. I looked up the machine's own spec sheet: the
nozzle tops out at 280 °C. PEEK needs somewhere around 400 °C and a heated chamber. Not a stretch,
not a "your mileage may vary" — physically impossible on that hardware.

That one line took ninety seconds to check and told me more than the rest of the listing combined.
Not because the material mattered to me — it didn't — but because the seller had just demonstrated
they'd never run the machine.

<!-- truncate -->

I set out to answer one question — *is this used printer worth it?* — and ended up building a
framework, because the reasoning kept being the same reasoning and I kept rebuilding it by hand.
This is that framework. The printer is just the worked example; the method is what transfers.

## Why the normal approach fails

The normal approach is: open four tabs, compare spec sheets, pick the one with the best numbers.

It fails because **spec sheets are marketing**, and the things that actually determine whether you
get what you wanted appear on none of them:

- What the replacement part costs when the common failure happens — and whether it's a $30 part or a
  $180 sealed assembly that contains the $30 part
- How long spares will exist, which almost nobody publishes and which is therefore itself a signal
- What it actually sells for used, as opposed to what people are asking
- Which axis is slightly off, which the manufacturer will never tell you and the owners will

Meanwhile the specs that *are* published are chosen to be flattering, quoted "up to," and measured
under conditions nobody names.

## What I actually did

Six steps. The order matters more than any individual step.

**1. Pin the requirements before looking at any product.** Not specs — the *job*. What's the biggest
thing you need to make? Where will it live? Who's going to run it? A person knows what they want to
do. They don't know what build volume, tolerance, or duty cycle that implies, and asking them to
translate is asking them to do the hard part themselves.

Write these down and stop. Everything downstream is built on them, and adding one later is expensive
— more on that below.

**2. Rule things out loudly, before scoring anything.** Some failures aren't low scores, they're
disqualifications: it doesn't fit, it can't cut that material, there's no ventilation path in that
room, the electrical service doesn't exist, it's end-of-life inside your ownership window.

The temptation is to score those candidates anyway and let them lose on points. Don't. A
disqualification buried inside a weighted average reads as *merely weak* rather than *impossible*,
and a table is very good at making impossible look like 2.4.

**3. Score the survivors against written anchors.** Not "5 = excellent accuracy," which says nothing.
`5 = ±0.05 mm held across a batch, under load.` Anchors written as observable outcomes mean the same
thing across candidates and across years. Anchors written as adjectives mean whatever you felt like
that afternoon.

**4. Grade every score by how you learned it.** This turned out to be the most valuable single idea,
and it came from a frustration: **nobody publishes comparable test data.** No reviewer had run all
three candidate machines on the same file. Every comparison I could find was assembled from
different materials, different profiles, different rooms, different operators.

So each cell carries a grade:

| Grade | Means |
|---|---|
| **A** | Independently measured — somebody put calipers on it |
| **B** | Reviewed but not measured — described, no figure |
| **C** | Owner report — a forum post, a seller claim, one anecdote |
| **D** | Inference — reasoned from specs or a sibling model |

And it goes **inline, in the cell**, not in a footnote. A footnote is a place where honesty goes to
be skipped. Inline, a table full of Ds looks like a table full of Ds, which is exactly what it is.

The rule that makes this work: **a criterion you couldn't verify gets a D with a note saying what you
checked — never a blank, never a quiet guess.** A recorded gap stays visible. A skipped one silently
narrows the comparison down to whatever happened to be easy to find.

**5. Weight by use case, not in the abstract.** The same eleven criteria produce different winners
depending on whether you're selling parts, prototyping, or doing this on weekends. Set the weights
from what the person told you in step 1. If two weighting profiles never change the ranking, they're
the same profile and one of them is decoration.

**6. Compute cost over three years, separately from the score.** Purchase price plus consumables plus
the wear part plus the thing nobody budgets for — in this category, ventilation and the electrical
work — minus realistic resale. If the winner on points is also the most expensive to run, one of your
inputs is wrong. Go find out which.

## What the research turned up

Three findings that changed how I'd do this in any category.

**The vendor's own support forum beat every review.** The single most decision-relevant fact in the
whole comparison came from a manufacturer's support forum, not from a review: owners reporting a
nominal 150 mm feature coming out at about 149 mm on stock profiles. The reviews described the
machine as accurate. The forum said *which axis was off*.

This is now near the top of my evidence hierarchy — above spec sheets, above independent reviews.
Search the model name plus failure words: `accuracy`, `fails`, `warranty`, `won't`, `broke`. Then
read the *replies*. How fast and how well the vendor answers **is** the support-quality score,
observed instead of claimed. It's the highest-value search available and it's the one everybody
skips.

**Asking prices ran about 87% above sold prices.** On the sample I collected — small, and I'll say so
rather than dress it up — the median asking price sat roughly 87% above the median confirmed sale.
The forum "comps" I found for the machine I was looking at ($5,250 in 2022, $3,500 in 2023) were
*never confirmed as sales at all*. Someone asked. That's all we know.

This is why browsing a marketplace gives you a badly inflated sense of what something is worth: the
listings that never sell stay up forever, so what you're actually browsing is a museum of prices
nobody paid. Sold and asking are two different quantities and they must never be averaged together,
drawn with the same mark, or quoted in the same sentence without saying which is which.

**One check killed more candidates than price did: the ceiling.** A used item cannot rationally be
worth more than the cheapest *new* item that meets all the same requirements — minus the warranty,
the remaining support horizon, and a healthier parts supply. Work out that new number first. It's the
anchor; everything else is a discount off it. Original MSRP is irrelevant, and a listing that leads
with "originally $X" is anchoring you on purpose.

## What changed my mind

The recommendation reversed twice, and both reversals came from *searching* rather than reasoning
from what I already knew.

I started confident: buy the cheaper, better-supported current-generation machine; the used one has a
dying consumable format. Then I found a competitor I hadn't considered that cleared the size
requirement outright. Then I found a machine from the first manufacturer that inverted their own
naming — the cheapest model in the line had the *largest* build volume and the *highest* speed.
Nobody would guess that from the product names, and I certainly didn't.

Related: one of the products I was comparing had a "+" in its name that I read as an upgrade tier. It
isn't. It replaced the original and there is no cheaper base version. **Verify what a product name
actually denotes before you put it in a table.**

The lesson isn't "I was wrong twice." It's that **recalled knowledge about a product lineup is
routinely a generation stale**, and a recommendation built on it can reverse completely on a single
search. If your answer never changes during research, that's not confidence — it's a sign you were
confirming rather than checking.

The other reversal was self-inflicted. Late in the process I added a criterion — programmatic API
control — and it reordered the entire ranking. One manufacturer's firmware verifies that commands
come from authorized software, and the escape hatch requires going LAN-only, which kills the cloud
features and the phone app. The other publishes an OpenAPI spec and runs local and cloud as one
service.

Adding that criterion at the end meant re-researching candidates I'd already finished. **Pin the
requirements before you research, and build the matrix so it can be re-weighted rather than
re-derived.**

## What I'd tell someone starting from scratch

- **Check one claimed capability against the vendor's own stated maximum.** Ninety seconds. If the
  listing claims something the hardware can't do, every other claim in it is unverified — the seller
  either never used the machine or copied a spec sheet.
- **Find the cheapest new thing that meets all your requirements before you look at a single used
  listing.** That's the ceiling, and it ends most "great deals" on its own.
- **Read the manufacturer's support forum**, not the reviews. Search failure words and read the
  replies.
- **Write down what you don't know**, in the table, next to what you do. A comparison that only shows
  the confident findings misrepresents itself, and the gaps are usually the more useful half.
- **Say your sample size out loud**, in the same sentence as the number. Three listings is an
  anecdote. I don't quote a range under eight.

A polished decision matrix is a persuasive object, and it is very easy to build one that overstates
what it knows. Most of the rules above exist for no other reason than to stop that — including when
the person being persuaded is me.
