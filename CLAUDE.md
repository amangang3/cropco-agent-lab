# Project context

This is a teaching lab for MIT Sloan 15.S50, *Leading Agentic AI Transformation
in Organizations*, Session 2.

## The scenario

Bayer Crop Science reaches roughly 10,000 of the ~40,000 major row-crop farms in
the United States. Expanding that reach by quadrupling the field sales force is
not viable. The commercial operations team is testing whether the account
prioritisation work a field rep does by hand can be done differently.

You have been given the regional file: 10 farms, each with a CRM row and a set
of field-rep call notes. The notes are unstructured, written by four different
reps over eighteen months, and of uneven quality — that is deliberate and it is
representative.

## The task

For all 10 farms: build a profile, score it against `rubric.md`, rank, and draft
outreach for the top five. Send anything you cannot score honestly to human
review rather than guessing.

## Available teammates

Three subagents are already defined in `.claude/agents/`:

- `farm-researcher` — CRM row + rep notes → structured profile
- `fit-scorer` — profiles + rubric → ranked table, and human-review routing
- `outreach-writer` — top 5 → drafted emails

Run `/agents` to see them.

## Conventions

- All outputs go in `output/`. Create it if it does not exist.
- `data/` is read-only. Do not edit the CSV or the notes.
- Researchers should be run in parallel across batches of farms. Scoring
  requires all profiles to exist first.

## On the data

Every farm, person, place, figure and note in `data/` is fictional and was
written for this exercise. Nothing here is Bayer proprietary information and no
real farming operation is described.
