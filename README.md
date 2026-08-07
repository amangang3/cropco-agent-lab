# Bayer Agent Lab

Teaching lab for MIT Sloan **15.S50 · Leading Agentic AI Transformation in
Organizations**, Session 2. A 30-minute in-class exercise in which students do a
farm-prioritisation task by hand in their own chatbot, then watch a team of
three agents do the same task.

**The exercise is the website in `docs/`.** Students need one URL and nothing
else — no account, no install, no sign-in, no submission.

---

## For students

Open the lab URL your instructor posted. Everything is there: the situation, the
brief to paste into your chatbot, the ten farms, the agent team, the run, and
the three files it produces.

Nothing you do on that page is recorded anywhere.

---

## For instructors

**The teaching materials are deliberately not in this repository.** The runsheet,
the live poll questions and their expected splits, the debrief script and the TA
runbook are kept with the course materials instead — this repo is public so that
students can reach the site, and the debrief gives away the farm-09 reveal that
the exercise depends on.

Publishing: **Settings → Pages → Deploy from a branch**, `main`, folder
`/docs`. Local preview is just `docs/index.html` opened in a browser — it is
static, with no build step and no server.

---

## What is in here

```
docs/                 the student website — this is the exercise
data/                 10 farms: farms.csv + rep-notes/*.md   (fictional)
rubric.md             the scoring rubric, 5 weighted dimensions
.claude/agents/       the three agent definitions
PROMPT.txt            the single prompt that drives a real run
reference-run/        the output of a real run, shown on the site
part1-chat/           the Part 1 brief and farm notes as plain markdown
scratchpad/           generator for the site's copy of the reference run
```

### The three agents

| Agent | Role | Runs |
|---|---|---|
| `farm-researcher` | CRM row + rep notes → structured profile, with data-quality flags | First, two copies in parallel |
| `fit-scorer` | Profiles + rubric → ranked table, and human-review routing | Second, only once all ten profiles exist |
| `outreach-writer` | Top five → drafted emails, skipping anything on the review list | Last |

The teaching payload is in `fit-scorer.md`, under *"Confidence, and when to stop
scoring"*: a farm carrying a flag is not scored at all — not scored low, absent
— **even if it would obviously rank first**. That rule is what keeps farm-09,
the largest account in the file, out of an outreach campaign it explicitly asked
not to be in.

---

## Running the agent team for real

The website plays a **replay** of a real run so that a classroom does not depend
on thirty laptops, thirty accounts and one wifi network. The run itself is real
and still reproducible:

```bash
cd bayer-agent-lab
claude
```

Then `/agents` to see the three teammates, and paste `PROMPT.txt`.

Outputs land in `output/`. A good run produces a ranked table of six farms,
**farm-04, farm-06, farm-07 and farm-09 on `NEEDS-HUMAN-REVIEW.md`**, and five
drafts under 120 words each. Ranking order below the top few will differ between
runs; the four exclusions should not, because they are pinned by a written rule
rather than by the model's judgement.

`reference-run/` holds the output of one such run — it is what the site shows.

---

## On the data

Every farm, person, place, figure and note in `data/` is fictional and was
written for this exercise. No Bayer proprietary information is used. The
scenario is drawn from a real strategic priority; the file is not.
