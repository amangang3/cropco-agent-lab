/* Bayer Agent Lab — simulation timeline.
 *
 * This is a faithful replay of a real run of the agent team, not an
 * illustration. Timings are the observed wall-clock of that run, rounded.
 * Every file read, flag raised and score assigned below actually happened.
 *
 * `t` is seconds into the run. Playback maps it to real time at the chosen
 * speed. Hand-authored and stable — edit here to change the replay.
 */
window.SIM_EVENTS = {
  duration: 212,

  lanes: [
    {
      id: 'orchestrator',
      name: 'Claude Code',
      short: 'Claude Code',
      role: 'Orchestrator',
      sub: 'the main session, not a subagent',
      kind: 'orchestrator',
    },
    {
      id: 'researcher-a',
      name: 'farm-researcher',
      short: 'researcher A',
      role: 'Subagent',
      sub: 'batch A · farms 01–05',
      kind: 'researcher',
      file: 'farm-researcher',
    },
    {
      id: 'researcher-b',
      name: 'farm-researcher',
      short: 'researcher B',
      role: 'Subagent',
      sub: 'batch B · farms 06–10',
      kind: 'researcher',
      file: 'farm-researcher',
    },
    {
      id: 'scorer',
      name: 'fit-scorer',
      role: 'Subagent',
      sub: 'waits for all ten profiles',
      kind: 'scorer',
      file: 'fit-scorer',
    },
    {
      id: 'writer',
      name: 'outreach-writer',
      role: 'Subagent',
      sub: 'top five only',
      kind: 'writer',
      file: 'outreach-writer',
    },
  ],

  /* type: say | read | write | spawn | wait | flag | score | stop | done */
  events: [
    /* ---- Orchestrator plans ---- */
    { t: 0,   lane: 'orchestrator', type: 'say',   text: 'Prompt received. One instruction, no further input expected.' },
    { t: 2,   lane: 'orchestrator', type: 'read',  file: 'CLAUDE.md', text: 'Reading project context' },
    { t: 5,   lane: 'orchestrator', type: 'read',  file: 'rubric.md', text: 'Reading the scoring rubric' },
    { t: 8,   lane: 'orchestrator', type: 'read',  file: 'data/farms.csv', text: '10 farms in the regional file' },
    { t: 10,  lane: 'orchestrator', type: 'say',   text: 'Plan: the ten farms are independent of each other, so research can run in parallel. Scoring cannot start until every profile exists. Two researchers, then a scorer, then a writer.' },
    { t: 13,  lane: 'orchestrator', type: 'spawn', target: 'researcher-a', text: 'Starting farm-researcher on farms 01–05' },
    { t: 13,  lane: 'orchestrator', type: 'spawn', target: 'researcher-b', text: 'Starting farm-researcher on farms 06–10' },
    { t: 14,  lane: 'orchestrator', type: 'wait',  text: 'Both researchers running. Waiting.' },

    /* ---- Researcher A · farms 01–05 ---- */
    { t: 15,  lane: 'researcher-a', type: 'say',   text: 'Batch A. Five farms: CRM row plus rep notes for each.' },
    { t: 17,  lane: 'researcher-a', type: 'read',  file: 'data/farms.csv' },
    { t: 20,  lane: 'researcher-a', type: 'read',  file: 'data/rep-notes/farm-01.md' },
    { t: 24,  lane: 'researcher-a', type: 'say',   text: 'farm-01 Halverson Ridge — contract expires after harvest, incumbent had standability failures, Marcus asked for a price across 6,000 acres unprompted. Dale is owner on paper; note resolves that Marcus makes the input calls, so authority is clear.' },
    { t: 28,  lane: 'researcher-a', type: 'read',  file: 'data/rep-notes/farm-02.md' },
    { t: 32,  lane: 'researcher-a', type: 'say',   text: 'farm-02 Cottonwood Bend — six-year customer, expanding, Renata would move the corn across if the agronomic support is there.' },
    { t: 36,  lane: 'researcher-a', type: 'read',  file: 'data/rep-notes/farm-03.md' },
    { t: 40,  lane: 'researcher-a', type: 'say',   text: 'farm-03 Rio Seco — runs his own replicated check strips, annual contract terms so no lock-in, named complaint about incumbent service.' },
    { t: 44,  lane: 'researcher-a', type: 'read',  file: 'data/rep-notes/farm-04.md' },
    { t: 49,  lane: 'researcher-a', type: 'flag',  flag: 'contradiction', farm: 'farm-04',
              text: 'CRM says 4,300 acres. The rep says that stopped being true last autumn — a ~2,000 acre parcel sold, another block went to the daughter. His guess is ~1,200 and he could not confirm it. Scale is 25% of the rubric. I cannot size this account.' },
    { t: 54,  lane: 'researcher-a', type: 'read',  file: 'data/rep-notes/farm-05.md' },
    { t: 58,  lane: 'researcher-a', type: 'say',   text: 'farm-05 Redwater — Ingrid raised consolidating suppliers herself. Note: wheat and canola sit outside the row-crop trait portfolio, so not all 8,200 acres are addressable.' },
    { t: 63,  lane: 'researcher-a', type: 'write', file: 'output/profiles-farm-01-to-farm-05.md', text: 'Writing five profiles' },
    { t: 66,  lane: 'researcher-a', type: 'done',  text: '5 profiled · 1 flagged (farm-04)' },

    /* ---- Researcher B · farms 06–10 · runs at the same time ---- */
    { t: 15,  lane: 'researcher-b', type: 'say',   text: 'Batch B. Five farms: CRM row plus rep notes for each.' },
    { t: 17,  lane: 'researcher-b', type: 'read',  file: 'data/farms.csv' },
    { t: 21,  lane: 'researcher-b', type: 'read',  file: 'data/rep-notes/farm-06.md' },
    { t: 25,  lane: 'researcher-b', type: 'flag',  flag: 'missing', farm: 'farm-06',
              text: 'The note is two sentences. The rep left in October 2025, no call notes were transferred, nothing in the shared drive. I have a CRM row and nothing else. There is no profile to build here.' },
    { t: 30,  lane: 'researcher-b', type: 'read',  file: 'data/rep-notes/farm-07.md' },
    { t: 36,  lane: 'researcher-b', type: 'flag',  flag: 'authority unclear', farm: 'farm-07',
              text: 'Owner died in February. Two sons farming jointly, in an estate dispute, each separately describing himself as the person who decides on inputs. A lawyer is involved. Good farm — but no identified path to a signature.' },
    { t: 41,  lane: 'researcher-b', type: 'read',  file: 'data/rep-notes/farm-08.md' },
    { t: 46,  lane: 'researcher-b', type: 'say',   text: 'farm-08 Larkspur — two staff agronomists, a data analyst, 40 replicated test blocks. Devon wants trial data and a technical contact, and has said explicitly he does not want a sales relationship.' },
    { t: 51,  lane: 'researcher-b', type: 'read',  file: 'data/rep-notes/farm-09.md' },
    { t: 58,  lane: 'researcher-b', type: 'flag',  flag: 'contact restriction', farm: 'farm-09',
              text: 'Largest account in the file — 8,900 acres, $1.72M a year. In May the customer said no commercial contact for the rest of the 2026 season: "we will call you." The rep wrote it down and added, in the same note, "if someone runs a list by spend they will get this wrong."' },
    { t: 64,  lane: 'researcher-b', type: 'read',  file: 'data/rep-notes/farm-10.md' },
    { t: 69,  lane: 'researcher-b', type: 'say',   text: 'farm-10 Salt Creek — investor-backed roll-up, formal 2027 input RFP going out in November, COO has asked whether we can support one program across all four units.' },
    { t: 75,  lane: 'researcher-b', type: 'write', file: 'output/profiles-farm-06-to-farm-10.md', text: 'Writing five profiles' },
    { t: 79,  lane: 'researcher-b', type: 'done',  text: '5 profiled · 3 flagged (farm-06, farm-07, farm-09)' },

    /* ---- The barrier ---- */
    { t: 67,  lane: 'orchestrator', type: 'wait',  text: 'Batch A is done. Batch B is still reading. fit-scorer does not start yet — it needs all ten profiles, or it would rank a partial file and never say so.' },
    { t: 80,  lane: 'orchestrator', type: 'say',   text: 'Both batches in. 10 profiles written, 4 flags raised.' },
    { t: 83,  lane: 'orchestrator', type: 'spawn', target: 'scorer', text: 'Starting fit-scorer' },

    /* ---- Scorer ---- */
    { t: 85,  lane: 'scorer',       type: 'say',   text: 'The rubric is the only scoring authority. I do not invent criteria, reweight, or add a dimension because it seems sensible.' },
    { t: 87,  lane: 'scorer',       type: 'read',  file: 'rubric.md' },
    { t: 92,  lane: 'scorer',       type: 'read',  file: 'output/profiles-farm-01-to-farm-05.md' },
    { t: 96,  lane: 'scorer',       type: 'read',  file: 'output/profiles-farm-06-to-farm-10.md' },
    { t: 101, lane: 'scorer',       type: 'say',   text: 'Ten farms, five weighted dimensions, 0–5 each. Confidence assessed separately — it is not a rounding of the score.' },
    { t: 106, lane: 'scorer',       type: 'score', farm: 'farm-01', score: 93, conf: 'HIGH' },
    { t: 110, lane: 'scorer',       type: 'score', farm: 'farm-02', score: 82, conf: 'HIGH' },
    { t: 114, lane: 'scorer',       type: 'score', farm: 'farm-03', score: 92, conf: 'HIGH' },
    { t: 118, lane: 'scorer',       type: 'stop',  farm: 'farm-04', flag: 'contradiction',
              text: 'Carries a contradiction flag. Our own two records disagree on acreage by a factor of three, and acreage is a quarter of the score. LOW confidence — excluded from the ranking entirely, no total reported.' },
    { t: 123, lane: 'scorer',       type: 'score', farm: 'farm-05', score: 86, conf: 'MEDIUM' },
    { t: 127, lane: 'scorer',       type: 'stop',  farm: 'farm-06', flag: 'missing',
              text: 'Nothing to score against. Four of five dimensions would be assessed on an empty file. LOW confidence — excluded.' },
    { t: 131, lane: 'scorer',       type: 'stop',  farm: 'farm-07', flag: 'authority unclear',
              text: 'No identified path to the buyer. LOW confidence — excluded.' },
    { t: 135, lane: 'scorer',       type: 'score', farm: 'farm-08', score: 92, conf: 'HIGH' },
    { t: 139, lane: 'scorer',       type: 'stop',  farm: 'farm-09', flag: 'contact restriction', emphasis: true,
              text: 'This farm would rank first on the numbers — the largest account in the file, and the strongest scale in the region. It is excluded anyway. The rule says a farm with a contact restriction is LOW confidence, and a LOW-confidence farm gets no total and no rank, even if it would obviously rank first. A confident number here is worse than no number.' },
    { t: 145, lane: 'scorer',       type: 'score', farm: 'farm-10', score: 94, conf: 'HIGH' },
    { t: 150, lane: 'scorer',       type: 'write', file: 'output/ranked-farms.md', text: 'Six farms scored and ranked, four exclusions listed beneath' },
    { t: 155, lane: 'scorer',       type: 'write', file: 'output/NEEDS-HUMAN-REVIEW.md', text: 'One section per excluded farm: why, the question a person has to answer, and the quote that triggered it' },
    { t: 159, lane: 'scorer',       type: 'done',  text: '6 scored · 4 to human review · top five: 10, 01, 03, 08, 05' },

    /* ---- Writer ---- */
    { t: 161, lane: 'orchestrator', type: 'spawn', target: 'writer', text: 'Starting outreach-writer on the top five' },
    { t: 163, lane: 'writer',       type: 'read',  file: 'output/ranked-farms.md' },
    { t: 166, lane: 'writer',       type: 'read',  file: 'output/NEEDS-HUMAN-REVIEW.md' },
    { t: 169, lane: 'writer',       type: 'say',   text: 'I read the review file as well as the ranking — so I know who not to write to, rather than only who to write to.' },
    { t: 173, lane: 'writer',       type: 'say',   text: 'Draft 1 · farm-10 Salt Creek → Adaeze, COO. Leads on the one-program-across-four-units question she raised herself, ahead of the November RFP.' },
    { t: 178, lane: 'writer',       type: 'say',   text: 'Draft 2 · farm-01 Halverson Ridge → Marcus. He asked for a number; the draft answers with the standability data first.' },
    { t: 182, lane: 'writer',       type: 'say',   text: 'Draft 3 · farm-03 Rio Seco → Esteban. Picks up the pipeline question the rep could not answer on the day.' },
    { t: 186, lane: 'writer',       type: 'say',   text: 'Draft 4 · farm-08 Larkspur → Devon. No relationship pitch — trial data, a named technical contact, transparent pricing. Those are the three things he asked for.' },
    { t: 190, lane: 'writer',       type: 'say',   text: 'Draft 5 · farm-05 Redwater → Ingrid. Consolidation proposal, including where the answer may be that consolidating does not serve her.' },
    { t: 195, lane: 'writer',       type: 'write', file: 'output/outreach-drafts.md', text: 'Five drafts, each under 120 words, plus a "before any of these are sent" section' },
    { t: 199, lane: 'writer',       type: 'done',  text: '5 drafts · 0 written to farms on the review list' },

    /* ---- Close ---- */
    { t: 203, lane: 'orchestrator', type: 'say',   text: 'Done. 10 farms worked, 6 scored, 4 sent to human review, 5 drafts written. Total elapsed 3m 32s. You typed one prompt and were not asked a single question.' },
    { t: 208, lane: 'orchestrator', type: 'done',  text: 'Run complete' },
  ],

  /* The three moments the room is told to watch for, before the run starts.
   * Each lights up in the "what to watch for" strip as it happens. */
  beats: [
    { id: 'parallel', t: 15,  until: 79,  label: 'Both researchers are working right now — different farms, same moment.' },
    { id: 'barrier',  t: 67,  until: 83,  label: 'Batch A finished. The scorer still cannot start — it is waiting for batch B.' },
    { id: 'stop',     t: 139, until: 150, label: 'The largest account in the file has just been excluded, on purpose.' },
  ],

  /* Shown in the summary card when the run finishes. */
  summary: {
    elapsed: '3m 32s',
    prompts: 1,
    interruptions: 0,
    scored: 6,
    review: 4,
    drafts: 5,
    top5: ['farm-10', 'farm-01', 'farm-03', 'farm-08', 'farm-05'],
  },
};
