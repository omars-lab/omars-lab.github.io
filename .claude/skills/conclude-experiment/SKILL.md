---
name: conclude-experiment
description: Make and ACT ON the launch decision for a blog A/B experiment — either keep control (clean up the experiment, retire the variant) or ship the treatment for good (roll the flag to 100% winner, optionally hard-code + retire the flag). Rolls out via the PostHog REST API with the write key, then finalizes the experiment's timeline doc (status rolled-out/abandoned + Outcome). Use after analyze-experiment, once a winner is decided.
---

# Conclude an experiment (launch decision)

The **decide + act** phase — the end of the lifecycle. Follows `analyze-experiment`
(which wrote the numbers into the timeline doc). The decision itself is **user-gated**:
shipping a variant to 100% of real visitors is an outward-facing change.

## ▶️ FIRST STEP — create/locate the tracking tasks

```tasks
- [ ] Confirm the analysis is written into the timeline doc (Outcome has numbers + significance).
- [ ] Decide the winner with the user: ship test, keep control, or keep running.
- [ ] Roll out: roll_out.py --winner <variant> (pins flag 100%). USER-GATED.
- [ ] Clean up the loser: revert/remove dead variant code, simplify the component if keeping control.
- [ ] (Optional) hard-code the winner + retire the flag once stable.
- [ ] Finalize the timeline doc: status → rolled-out/abandoned, fill Outcome + log; update README table.
- [ ] Close the experiment's open tasks.
```

## Step 1 — Decide (with the user)

Read the **Outcome** section the analyze phase wrote. Three outcomes:
- **Ship test** — test beat control at significance.
- **Keep control** — control won, or test failed to beat it (a valid, useful result).
- **Keep running** — not yet significant; stop here, revisit later.

Don't decide on a handful of events — defer to PostHog's experiment significance.

## Step 2 — Act on it (user-gated rollout)

`roll_out.py` (in this skill dir) pins the linked flag to 100% of the winner via the
REST API (write key). Read-only `--show` first; the `--winner` flip is the go-live gate
— confirm with the user before running it.

```bash
python3 .claude/skills/conclude-experiment/roll_out.py --show              # current split (read-only)
python3 .claude/skills/conclude-experiment/roll_out.py --winner test       # ship treatment to 100%
python3 .claude/skills/conclude-experiment/roll_out.py --winner control    # keep control at 100%
```
Reversible: re-run with the other variant, or restore 50/50 in the UI. (Edit `FLAG_KEY`
in the script, or pass `--flag <key>`, per experiment.)

## Step 3 — Clean up

- **Kept control:** the experiment was a no-op for users — remove the now-dead `test`
  copy/branch, and if nothing else uses the flag, simplify the component back to the
  single control rendering. Remove the registry entry once the flag is retired.
- **Shipped test:** either leave the flag pinned to `test` (simplest), or **hard-code**
  the winning copy in the component and retire the flag + registry entry to drop the
  PostHog dependency. Update `src/experiments.ts` accordingly.
- Keep the Playwright spec only if the flag still drives rendering; otherwise retire it.

## Step 4 — Finalize the timeline doc

In `…/experiments/<date>-<flag-key>.md`:
- Set status → `rolled-out` (shipped a winner) or `abandoned` (dropped) — or back to
  `running` if you chose to keep running.
- Make sure **## 6. Outcome** states the winner, the numbers, the decision, and what was
  shipped/cleaned up.
- Append the final **timeline log** row and update the **README timeline table**.
- Close the experiment's tasks.

## Cross-links
- Previous phase: **analyze-experiment**. Execution + flag creation: **run-ab-test**
  (`create_experiment.py`). Data readback: **query-posthog**.
- Same write-key requirement as create/launch (`POSTHOG_WRITE_API_KEY`, `feature_flag:write`).
