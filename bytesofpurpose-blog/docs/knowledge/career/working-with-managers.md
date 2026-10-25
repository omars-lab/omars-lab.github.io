---
title: 'Working With Managers: Polite Fictions and Other Skills'
description: 'Skills for working with managers from Ethan Evans, a former Amazon VP: how to say what you want so it lands, when to say it, and to whom.'
slug: /career/working-with-managers
kind: technique
authors: [oeid]
tags: [career, managers, leadership, communication]
draft: true
questions:
  - How do I approach my manager in a given situation?
  - What do managers ask themselves when they make decisions about people?
  - What drives managers, and what problems do they deal with?
  - How do I turn what I am really thinking into something I can say out loud, and when is the right time and place to say it?
  - How can Claude help me practice this, by wording what I say or by playing my director?
---

Ethan Evans spent years as a vice president at Amazon. In a long interview on Ryan Peterman's
channel he walks through how corporate politics really works. These are the skills I took from it,
written so I can practice them. Every point is paraphrased from the video, and each timestamp
jumps to the moment he says it.

<iframe style={{border: "1px solid rgba(0, 0, 0, 0.1)"}} width="100%" height="450" src="https://www.youtube.com/embed/6WaeGfLnRvc" title="Amazon VP: How Corporate Politics Work And How To Win | Ethan Evans" allowFullScreen></iframe>

**Source:** [Amazon VP: How Corporate Politics Work And How To Win](https://www.youtube.com/watch?v=6WaeGfLnRvc),
Ethan Evans on Ryan Peterman's channel, March 30, 2026, 2 hours 50 minutes. The full transcript is
on YouTube itself: open the video, then **...more** under the title, then **Show transcript**.

## The questions I went in with

I watched this with four questions:

1. How do I approach my manager in a given situation?
2. What do managers ask themselves when they make decisions about people?
3. What drives managers, and what problems do they deal with?
4. How do I turn what I am really thinking into something I can say out loud, and when is the
   right time and place to say it?

The fourth one became the center of this page, because Ethan calls it a skill he has not figured
out how to teach.

## Two Claude skills from this video

Reading the skills below is one thing. Practicing them is another, so I turned two parts of the
video into Claude skills:

- **polite-fiction** is a wordsmithing skill. Tell it what you are really thinking and who will
  hear it, and it writes versions you can say and mean, plus when to say them. It is built on
  [Skill 1](#skill-1-say-the-polite-fiction).
- **play-the-director** is a role-play skill. Claude plays a director, with the questions and
  worries from [What managers ask themselves](#what-managers-ask-themselves) running in its head,
  so you can rehearse the talk before you have it. When you stop, it steps out and tells you what
  landed and what didn't.

Each skill has a `references/` file listing the points it is built on, each with a link to the
moment in the video. Neither copies the transcript. The references say where YouTube shows it, so
you (or Claude) can check the context.

Save each skill under `.claude/skills/<name>/` in your project, or in `~/.claude/skills/` so it
works from any folder.

### polite-fiction

`polite-fiction/SKILL.md`:

```markdown
---
name: polite-fiction
description: Turn what someone is really thinking into a sentence they can say to their
  manager, a peer or another team, sincerely, and pick when to say it. Use when asked to word
  an ask for scope, a promotion, a team move, severance or help from another team, or to make
  an ask sound less like a threat. Built on Ethan Evans's interview on Ryan Peterman's channel;
  the points and timestamps are in references/ethan-evans.md.
---

# Polite fiction

A polite fiction is the version of what you want that you can say out loud, mean, and that the
other person can agree with. It is not a lie. If the person could not say it sincerely, it is
the wrong sentence.

## Steps

1. **Get the raw thought, in their words.** "Give me more scope or I'll leave." Don't soften it
   yet.
2. **Ask who will hear it and what that person wants:** a stable org, keeping good people, a
   firing that doesn't upset the team. If the person doesn't know, ask; don't guess.
3. **Find the part both of them want.** The sayable version leads with it.
4. **Write two or three versions in the listener's terms.** Each must be true for the person
   saying it. Check every sentence: is any of it a lie? Drop the ones that are.
5. **Turn the demand into a request for help.** "How can you help me?" and "What do you need so
   we can make this work?", never "What are you going to do for me?"
6. **Pick the moment.** Before the meeting, not after an outage or as they rush out. If a hard
   talk starts at a bad time, say you want to hear it properly and ask for tomorrow morning.
7. **Name the one phrase to practice out loud,** and how it should sound: warm with the person,
   firm about the need.

## What to give back

- The raw thought, restated in one line.
- What the listener wants.
- Two or three sayable versions, the recommended one first, each with one line on why it lands.
- When to say it, and when not to.
- The one phrase to practice.

## Never

- Never write a sentence the person couldn't say and mean.
- Never hide a threat in the wording. If leaving is real, say it calmly, as a fact about their
  career.
- Never invent facts about the listener.

## References

`references/ethan-evans.md`: the ideas this skill is built on, each with a link to the moment in
the video.
```

`polite-fiction/references/ethan-evans.md`:

```markdown
# Ethan Evans on polite fictions

Source: "Amazon VP: How Corporate Politics Work And How To Win", Ethan Evans on Ryan Peterman's
channel, March 30, 2026: https://www.youtube.com/watch?v=6WaeGfLnRvc

The full transcript is on YouTube: open the video, then "...more" under the title, then "Show
transcript". Every point below is paraphrased; each link jumps to the moment he says it, so you
can read the transcript around it.

## The idea

- The raw thought is "more scope". The version you say is that you want what's best for the
  org. Both are true, and only the second makes your manager want to help.
  [0:34:56](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=2096s)
- It only works if the polished version is also true for you.
  [0:36:15](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=2175s)
- Frame it as what they would do in your place. Ethan, moving teams after giving his word to a
  senior VP, asked his boss what he should do; he never said the threat out loud.
  [0:59:44](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3584s),
  [1:00:52](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3652s)
- Practice the key phrase until you can say it sincerely. His test: nothing he said was a lie.
  [1:01:56](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3716s)

## How it should feel

- The same words said warmly get help; said with an edge, they get pushback.
  [1:02:59](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3779s)
- Friendly with the person, firm about what you need, no "you against me".
  [1:04:09](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3849s)
- Ask how they can help you. People like to see themselves as helpful.
  [1:05:17](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3917s)
- Ask what they need too, and offer to make room for them.
  [1:06:21](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3981s)
- It won't always work, but nobody leaves angry.
  [1:07:30](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=4050s)

## When to say it

- Work out the wording before you're in the room; most of these talks are on the calendar.
  [1:01:56](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3716s)
- Plan the opening move, avoid moments of pressure, start from common ground.
  [1:09:39](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=4179s)
- If a hard talk starts at a bad moment, ask to do it tomorrow morning.
  [2:14:31](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=8071s)

## Phrasings he suggests (paraphrased)

- More scope: if a reorg opens something up, I'm ready to step up, and I plan to stay.
  [0:34:56](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=2096s)
- A promotion: my career matters a lot to me; if it matters less to the company, I'll have to
  think about that. [1:02:59](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3779s)
- Severance: you've been supportive and I'd tell the team so; I'd hope you'd support my move
  financially so I can tell that story.
  [2:13:22](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=8002s)
```

### play-the-director

`play-the-director/SKILL.md`:

```markdown
---
name: play-the-director
description: Role-play a director or senior manager so someone can rehearse a conversation
  with theirs, such as asking for scope or a promotion, reporting a problem manager, pitching a
  proposal or pushing back on a request. Claude answers in character, driven by the questions
  and worries a director has in their head, then steps out and says what landed. Use when asked
  to play my director, rehearse a talk, or guess how a skip-level will hear something. Built on
  Ethan Evans's interview on Ryan Peterman's channel; the points and timestamps are in
  references/ethan-evans.md.
---

# Play the director

## Before starting

Ask, in one message: what the person wants from the talk, who the director is (level, what their
org is under pressure from, anything known about how they decide), and how the talk will open.
Where something is unknown, play the general case; never invent the director's history.

## In character

Answer as the director would: short, the way a busy person talks. Before each reply, pick which
of the questions below are running in the director's head and let them shape the answer. Don't
say them out loud unless the director would.

### Questions in the director's head

- In a reorg: who do I have to keep, and who would I be fine losing?
- Who will put up with waiting? (Usually the quiet, dependable one.)
- Is this complaint about a manager real, or is this person high-maintenance? Believing it gives
  me three problems: the manager, a replacement, and the work in between.
- Is it safer to push back on my boss, or on my team?
- If I back this proposal, how do I look if it fails, and can I count on this person when it
  gets hard?
- Do I trust them without checking their work, and do I enjoy working with them?
- Does their manager support this? I won't promote over that manager's objection.
- Have I tried everything? (Before a firing.)

### What's pressing on the director

- Head count is easy to measure, so it gets rewarded.
- Promotions are a queue: someone is already next.
- When growth is flat, the only way to grow is to take scope from another team.
- They keep the people who make their problems go away.
- They're busy, and won't guess what you want.
- They hate firing and want to feel they treated the person well.
- Their tidy org plan never survives deadlines, outages and leave.

## Stepping out

When the person says stop, or the talk reaches an end, step out of character and give:

- what the director heard, in one line;
- which questions above the person answered, and which they left open;
- the moment the talk turned, for better or worse;
- one change to try on the next run.

Then offer to run it again, from the top or from the turn.

## Never

- Never play a villain or a pushover. Play a busy, reasonable person with problems of their own.
- Never claim to know the person's real director.

## References

`references/ethan-evans.md`: where each question and pressure comes from, with a link to the
moment in the video.
```

`play-the-director/references/ethan-evans.md`:

```markdown
# Ethan Evans on what directors think about

Source: "Amazon VP: How Corporate Politics Work And How To Win", Ethan Evans on Ryan Peterman's
channel, March 30, 2026: https://www.youtube.com/watch?v=6WaeGfLnRvc

The full transcript is on YouTube: open the video, then "...more" under the title, then "Show
transcript". Every point below is paraphrased; each link jumps to the moment he says it.

## Questions in their head

- Reorgs: once the business reason is settled, leaders use the same change to keep key people.
  [0:10:16](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=616s),
  [0:12:22](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=742s)
- Waiting: between two similar people, the one who hinted at leaving gets saved first, because
  the quiet one will wait. [0:17:15](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=1035s),
  [0:18:20](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=1100s)
- Complaints: believing a report about a manager creates three problems for the boss above, so
  they lean toward not believing it.
  [0:51:33](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3093s),
  [0:52:38](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3158s)
- Pushing back: a manager who passes every request down finds the team the safer target.
  [1:37:58](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=5878s),
  [1:39:13](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=5953s)
- Backing a proposal: blame if it fails, and whether future conflicts will be settled
  reasonably. Talking privately first calms both.
  [1:47:57](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=6477s),
  [1:49:11](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=6551s)
- Trust and enjoyment decide between equals; trust is earned most in a crisis.
  [2:27:16](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=8836s),
  [2:28:19](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=8899s),
  [2:30:34](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=9034s)
- Promoting over a manager's objection: in his experience, it doesn't happen.
  [2:40:40](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=9640s)
- Firing: by then the manager has told themselves they tried everything.
  [2:18:11](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=8291s),
  [2:19:19](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=8359s)

## What's pressing on them

- Head count is the easiest thing to measure.
  [0:02:26](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=146s),
  [0:04:30](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=270s)
- Promotions are a queue tracked months ahead.
  [0:29:37](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=1777s)
- Slow growth means fights over existing teams.
  [0:32:40](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=1960s)
- Leaders keep the people who solve their problems.
  [0:40:05](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=2405s)
- They're busy and don't guess what you want.
  [0:50:30](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3030s)
- Many need anger as fuel to deliver a hard message.
  [1:36:43](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=5803s)
- They hate firing. [2:16:59](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=8219s)
- The clean org plan meets reality.
  [2:03:59](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=7439s),
  [2:05:09](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=7509s)
```

## Skill 1: Say the polite fiction

### What it is

A polite fiction is the version of what you want that you can say out loud, sincerely, and that
the other person can agree with. Ethan's example is asking for scope. The raw thought is "I just
want more scope." The version you say is "I also want what is best for the org." Both are true.
Both mean "I'll take whatever is available." Only one makes your manager want to help you
([0:34:56](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=2096s),
[0:36:15](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=2175s)).

Ryan pushes back that this can feel conniving, since everyone knows what is underneath. Ethan's
answer is that it only works if the polished version is also true for you. A polite fiction is
one you can say and mean ([0:36:15](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=2175s)).

### From the thought in your head to the words you say

1. **Write down the raw thought.** "I'll leave if I don't get this." "I want that team." "You
   owe me severance."
2. **Find the part of it the other person also wants.** Your manager wants a stable org, a
   reorg that keeps good people, a firing that does not blow up the team. Lead with that part.
3. **Say it in their terms, not yours.** When Ethan wanted to move teams, he framed it as what
   his boss would do in his place: once he had given his word to the senior vice president, he
   could not take it back, so what did his boss want him to do? He wanted his boss to dislike
   the move but understand it. He never said the threat out loud
   ([0:59:44](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3584s),
   [1:00:52](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3652s)).
4. **Pick one key phrase and practice it** until you can say it with real sincerity. Ethan's
   test for himself is that nothing he said was a lie
   ([1:01:56](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3716s)).
5. **Deliver it warm.** The same words said with a smile, as someone who just needs help, get
   help. Said with an edge, they get told off
   ([1:02:59](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3779s)).

### How it should feel to the other person

Ethan's rule is to be **friendly with the person and firm about what you need**. Say exactly what
you want, with no anger and no "you against me"
([1:04:09](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3849s)).

- **Ask "How can you help me?"** People like to see themselves as helpful. Compare it with "What
  are you going to do for me?", which asks for the same thing and starts a fight
  ([1:05:17](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3917s)).
- **Ask what they need too.** "Here's what I need. What do you need so we can make this work?"
  With another team that is short on time, offer to help them make room, or to make the change
  yourself ([1:06:21](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3981s)).
- **See a person, not an obstacle.** He points to the book *Leadership and Self-Deception* by the
  Arbinger Institute: when you treat someone as a system whose levers you pull, they feel it
  ([1:05:17](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3917s),
  [1:06:21](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3981s)).
- **It will not always work.** He tried this approach while arguing politics with his college
  roommate and never changed his mind. But nobody left angry
  ([1:07:30](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=4050s)).

Ryan sums it up: picture what the other person feels and wants, and how the way you say it will
make them feel ([1:08:32](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=4112s)).

### When to say it

- **Before you are in the room.** Most of these talks are on the calendar, like a performance
  review, or you can see them coming. Work out your wording ahead of time
  ([1:01:56](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3716s)).
- **Plan your opening move like a chess player.** Chess players memorize their first moves. Plan
  how you will make the first ask and when
  ([1:09:39](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=4179s)).
- **Not when they are under pressure.** Don't catch your manager five minutes after a serious
  outage on a Friday, or as they rush out to pick up their kids
  ([1:09:39](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=4179s)).
- **Move toward common ground.** The chess rule he borrows is to hold the middle of the board.
  In a conversation, that means starting from what you both want
  ([1:09:39](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=4179s)).
- **Ask for a better time when you need one.** If someone starts a hard talk at a bad moment,
  say you appreciate the feedback, that you can't take it in well right now, and ask to do it
  tomorrow morning ([2:14:31](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=8071s)).

### Phrasings from the video (paraphrased)

| What you're thinking | What Ethan suggests saying |
|---|---|
| "Give me more scope or I'll leave." | If a reorg opens something up, I'm ready to step up, and I plan to stay ([0:34:56](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=2096s)) |
| "Promote me or I'm gone." | My career matters a lot to me. If it matters less to the company, I'll have to think about that ([1:02:59](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3779s)) |
| "Let me move teams or I quit." | I gave my word to the senior VP and can't go back on it. What would you want me to do? ([0:59:44](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3584s)) |
| "Pay me to leave quietly." | You've been nothing but supportive, and I'd tell the team so. I'd hope you'd want to support my move financially so I can tell that story ([2:13:22](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=8002s)) |
| "Do your job and unblock me." | Here's what I need. What do you need so we can make this work? ([1:06:21](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3981s)) |

### Why it's worth practicing

Engineers often hate politics, but Ethan's view is that this is just how people work
([1:02:59](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3779s)). Near the end, Ryan says most
people lack the skill of making the polite fiction
([2:19:19](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=8359s)).

## Skill 2: Say out loud what you want next

**What it is:** Tell your manager plainly what you want, a promotion or a bigger role, instead of
waiting to be noticed. Managers are busy and don't guess, so the people who ask get served first
([0:49:26](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=2966s),
[0:50:30](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3030s)).

**When and with whom:** One-on-one with your manager, before a seat opens. A reorg, a resignation
or a layoff can open one at any time
([0:33:50](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=2030s)).

**The approach:**

1. Accept that being quiet costs you. When two people perform about the same, the manager often
   looks after the one who has said what they want, and assumes the quiet, loyal one will wait
   ([0:17:15](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=1035s),
   [0:18:20](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=1100s)).
2. Say it plainly. Someone else is already asking every few days
   ([0:50:30](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3030s)).
3. Offer to step up if a seat opens, and say you plan to stay. Reorgs make leaders nervous about
   people leaving, so the reliable person becomes the most qualified one
   ([0:34:56](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=2096s)).

**Watch out:** Pushy people can push too far. Tune the ask to your workplace: a line that was
normal at Amazon would offend at some companies
([0:22:55](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=1375s)).

## Skill 3: Earn more scope by solving your boss's problems

**What it is:** Grow your role by taking problems off your boss's plate, instead of trying to
grab another team.

**The approach:**

1. Ask your manager what you can do to help them. Ethan passes on a rule he learned from an Amazon
   senior vice president: "Solve problems for your boss." A boss you make life easier for doesn't
   want to lose you ([0:40:05](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=2405s)).
2. Say yes to the odd jobs. Ethan took whatever his VP was handed, from grading used video games
   to shipping paper to schools, and it added up to 200 people
   ([0:37:35](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=2255s),
   [0:38:43](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=2323s)).
3. Make the deal explicit: you take on the hard thing, they back your next step. Then keep your
   side of it ([0:25:38](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=1538s),
   [0:28:23](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=1703s)).
4. Run a small bet of your own. He put 10 of his 800 people on custom printed t-shirts over his
   manager's doubts, and it became a big business. Shut down the bets that fail, fast
   ([0:41:29](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=2489s),
   [0:43:46](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=2626s)).
5. If a nearby team is struggling, offer its owner help before you ever propose taking it over
   ([1:28:07](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=5287s)).

**Words to try (paraphrased):** *I can see you're having a hard time here. Is there anything I can
do to help?*

**Watch out:** Don't raid other teams. Being caught as obviously self-serving burns you, and it
has become riskier now that big companies have stopped growing
([0:32:40](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=1960s)).

## Skill 4: Take a weak manager to the boss above, with backup

**What it is:** When your manager really is the problem, get the boss above them to act.

**When:** Only when it is bad enough. Ryan points out that everyone involved still reports to
that manager ([0:56:21](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3381s)).

**The approach:**

1. Know why the boss above resists. Agreeing with you hands them three problems: deal with the
   manager, hire a replacement, and cover the work meanwhile. A lone complaint is easier to read
   as you being high-maintenance
   ([0:51:33](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3093s),
   [0:52:38](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3158s)).
2. Check with coworkers first: do they see what you see? If they get on fine with the manager,
   learn how. Ryan suggested this and Ethan agreed
   ([0:54:45](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3285s)).
3. Never go alone. Go with two or three people, or go first and name the coworkers who will
   confirm it ([0:53:42](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3222s)).
4. Or skip the complaint: make the case that you'd add more value in another role, and leave the
   manager out of it. If that fails, ask to move without blaming anyone, and make the real choice
   clear: move within this org, or leave it
   ([0:57:31](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3451s),
   [0:58:41](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3521s)).

**Words to try (paraphrased):** *I know this is uncomfortable to hear, but three of us have
similar stories. Would you at least talk to them?*

## Skill 5: Push back on a manager who says yes to everything

**What it is:** When your manager passes every demand from above straight down to you, help them
start pushing back upward.

**When:** Between crises, not while the request is on the table. If the asks come every weekend,
raise it on a Tuesday or Wednesday
([1:41:35](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=6095s)).

**The approach:**

1. See it their way. Pushing back on their boss feels risky; pushing back on you feels safe,
   because they write your review
   ([1:37:58](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=5878s)).
2. Change that balance: make pushing up feel safer, or asking you again feel less safe
   ([1:39:13](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=5953s)).
3. Name the pattern and offer data to help them push back. State your limit, framed as not wanting
   them to promise work you'll have to turn down
   ([1:40:25](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=6025s)).

**Watch out:** Only say this if you can live with your manager telling you you're free to leave.
Ethan was quietly looking at outside jobs when he made his own big ask. Ryan felt this script
sounded more threatening than Ethan's others, and Ethan agreed
([1:41:35](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=6095s),
[1:43:03](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=6183s)).

## Skill 6: Win people over one-on-one before the decision meeting

**What it is:** Before a group decision, like a funding review, meet the key people privately so
they can raise worries they wouldn't raise in the room
([1:46:30](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=6390s)).

**The approach:**

1. Share the idea and ask what they don't understand or are worried about. Listening makes them
   feel consulted, and shows you're easy to work with
   ([1:47:57](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=6477s)).
2. Calm the fears, not just the facts: how backing you will make them look, what happens if it
   fails, and whether you'll be reasonable in a later conflict
   ([1:49:11](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=6551s)).

**Watch out:** Ethan's test is whether you'd say it in public. Running down the other proposal in
private, or offering a backroom deal, is the manipulative kind
([1:50:57](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=6657s)).

## Skill 7: Get your idea heard from low in the org

**What it is:** Get a good idea in front of the people who can approve it when you have no title.
Ethan's story is an entry-level engineer whose idea reached Jeff Bezos and got funded
([1:52:04](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=6724s),
[1:53:09](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=6789s)).

**The approach:**

1. Get into the room. The engineer wrote a proposal that earned a spot at an invite-only
   internal conference.
2. Make a very small ask of the most senior person there: would you stop by my poster?
3. Pitch it as a one-line story people already agree with, then show how
   ([1:54:19](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=6859s)).
4. Keep it grounded in real facts, and tell it with enthusiasm, often, to people who can say yes
   ([1:55:24](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=6924s)).

## Skill 8: Protect your team's work from a takeover

**What it is:** When another org wants to absorb your team, become an unappealing target and tell
the better story.

**The approach:**

1. Understand their view. They know their own mission and can't see yours, so your work looks
   small to them ([1:20:32](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=4832s)).
2. Make yourself unattractive: list the unglamorous things they'd inherit, and have the customers
   of those things speak up. Ethan calls this the skunk trick
   ([1:21:34](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=4894s)).
3. Be prickly without looking immature, for example by warmly turning it around and suggesting
   their org would do well as part of yours
   ([1:22:39](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=4959s)).
4. Buy time: a reorg costs months of output and you're hitting your goals, so revisit after year
   end ([1:24:54](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=5094s)).

**Watch out:** This works when your team is performing. If you're behind or losing money, you're
exposed ([1:23:48](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=5028s)).

## Skill 9: Handle a difficult person you can't avoid

**What it is:** Work out what a self-serving person wants, then make helping you easier for them
than hurting you.

**The approach:**

1. Judge the motive: out to do good, out for themselves, or in between with goals you can trade
   with ([1:12:19](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=4339s)).
2. Bring witnesses. Slippery people prefer to work in the dark and can't afford to look unethical
   ([1:15:36](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=4536s)).
3. Work with how they see themselves: practical, not evil. Show that helping you is the practical
   move ([1:18:10](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=4690s)).
4. If they're on another team, go to their leader with options: a different contact for your
   team, or more distance and friction that will cost you both time
   ([1:31:44](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=5504s),
   [1:32:56](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=5576s)).

**Watch out:** Come across as weak or begging and the other leader won't care
([1:35:34](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=5734s)).

## Skill 10: Negotiate your exit when you're being let go

**What it is:** Once it's clear you're being pushed out, stop trying to save the job and work out
a graceful exit.

**When:** When a formal improvement plan starts, or your boss hints it isn't working. Ethan says
most people on a formal plan are let go a few months later
([2:18:11](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=8291s)).

**The approach:**

1. When your boss hints, reply without admitting failure: you're sorry they're not satisfied, and
   you're open to talking about alternatives
   ([2:08:34](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=7714s)).
2. Know what you can offer: you save them months of process, you shape the story your coworkers
   hear, and your manager wants to feel they took care of you
   ([2:12:16](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=7936s),
   [2:16:59](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=8219s)).
3. Ask for time if you need it. A manager who refuses a day looks bad to HR
   ([2:15:40](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=8140s)).
4. Plan your key phrases ahead (skill 1 has the severance one)
   ([2:22:43](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=8563s)).

**Watch out:** Ryan notes the coworker-story lever can land as a threat when the boss is already
against you ([2:20:33](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=8433s)). You may get nothing,
but you certainly won't if you don't ask.

## Skill 11: Win the senior promotion

**What it is:** Past senior, working harder doesn't get you promoted. Learn the next level, be the
person your boss trusts, and line up backers early
([2:23:50](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=8630s)).

**The approach:**

1. Ask people a level or two up for advice, not feedback: what did you have to let go of, what did
   you have to learn, what do you see holding me back? Advice is easier to give and carries the
   same information ([2:24:56](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=8696s)).
2. Come through in a crisis. That is where trust is earned
   ([2:27:16](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=8836s)).
3. Be someone people want in the room. Between two equal candidates, the boss picks the one they
   enjoy working with ([2:30:34](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=9034s)).
4. Six months before the cycle, ask your manager to tell neighboring leaders they'll be asked about
   you, or to send a short intro. Ask more backers than you need
   ([2:33:07](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=9187s),
   [2:34:12](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=9252s)).

**Watch out:** Ethan has never really seen anyone promoted over their manager's objection. Get them
on board, or move ([2:40:40](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=9640s)).

## Skill 12: Choose a boss and a place that fit you

**What it is:** Cut how much politics you have to play by choosing on purpose.

1. A leader who also dislikes politics, and who is known for getting people promoted
   ([2:41:49](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=9709s),
   [2:42:52](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=9772s)).
2. The hardest area you can get into, where your expertise is rare
   ([2:44:28](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=9868s)).
3. A fast-growing company, where there's room for many people to move up
   ([2:47:12](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=10032s)).

His closing advice to his younger self: your relationships control your progress
([2:48:30](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=10110s)).

## What managers ask themselves

These answer my second question. Knowing them is what makes the skills above work.

- **In a reorg: who do I have to keep?** Once the business reason is settled, leaders use the same
  change to keep key people ([0:12:22](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=742s)).
- **Who will put up with waiting?** The quiet, dependable one, usually
  ([0:17:15](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=1035s)).
- **Is this complaint real, or is the person high-maintenance?** Believing it creates three
  problems, so they lean toward not believing it
  ([0:51:33](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3093s)).
- **Is it safer to push back on my boss or on my team?**
  ([1:37:58](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=5878s))
- **If I back this, how will it make me look, and can I count on this person?**
  ([1:49:11](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=6551s))
- **Between two equal people, whom do I trust and enjoy working with?**
  ([2:28:19](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=8899s))

## What drives managers, and the problems they deal with

And these answer my third.

- **Head count is easy to measure, so it gets rewarded,** even where the company says it shouldn't
  ([0:04:30](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=270s)).
- **Promotions are a queue.** Big companies track who is up in the next six to eighteen months
  ([0:29:37](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=1777s)).
- **When growth slows, managers fight over existing teams**
  ([0:32:40](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=1960s)).
- **They are busy and don't guess what you want**
  ([0:50:30](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=3030s)).
- **Many can't deliver a hard message without getting angry first,** which is why calm, firm
  managers are worth seeking out
  ([1:36:43](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=5803s)).
- **They hate firing,** and want to feel they took care of the person on the way out
  ([2:16:59](https://www.youtube.com/watch?v=6WaeGfLnRvc&t=8219s)).
