# The lab website

This folder is the exercise. It is static — HTML, CSS and JavaScript, no build
step, no server, no API calls, no external dependencies beyond a webfont.

## Local preview

Open `index.html` in a browser. That is genuinely all — it works from a local
file, which is also the fallback if GitHub Pages is unreachable.

If you would rather serve it:

```bash
python3 -m http.server 8080 --directory docs
```

## GitHub Pages

**Settings → Pages → Build and deployment → Deploy from a branch**, branch
`main`, folder **/docs**. The site appears at
`https://<org>.github.io/<repo>/`.

---

## What each file does

| File | Role |
|---|---|
| `index.html` | The page. Four sections: the situation, Round 1, the agent team, the run, the output. |
| `assets/lab.css` | Base styling — hero, panels, Part 1 workspace, rubric. |
| `assets/run.css` | The run console, agent cards, output rendering. |
| `assets/lab.js` | Part 1: the 8-minute timer, farm navigation, copy buttons, rubric. |
| `assets/sim-player.js` | The run player, and the markdown renderer for the output files. |
| `assets/farms.js` | **Generated.** The ten farms. From `data/` via `scratchpad/gen_site_data.py`. |
| `assets/agents.js` | The three agent definitions, mirrored from `.claude/agents/`. |
| `assets/sim-events.js` | **Hand-authored.** The run timeline — every event, with its timestamp. |
| `assets/sim-outputs.js` | **Generated.** The three output files, from `reference-run/` via `scratchpad/gen_sim_outputs.py`. |

Do not edit the generated files by hand.

---

## How the run works

`sim-events.js` is a timeline: a list of events, each with `t` (seconds into the
run), a lane, and a type — `say`, `read`, `write`, `spawn`, `wait`, `flag`,
`score`, `stop`, `done`. `sim-player.js` runs a virtual clock and emits each
event as its timestamp passes, updating the lanes, the feed, and the three side
rails as it goes.

**It is a replay of a real run, and the console says so.** The timings, files,
flags and scores in `sim-events.js` are the observed behaviour of an actual run
of this agent team against this data. It is played back rather than executed
live so the exercise cannot be broken by a student's account, an install, or a
rate limit — and so a non-technical student can follow it with the three "what
to watch for" prompts rather than a terminal.

Do not remove the `recorded run · replay` badge. Students asking what they are
actually being shown is the instinct the course exists to build, and a lab
caught overstating what it did loses their trust.

### Editing the timeline

`sim-events.js` is meant to be edited by hand. Useful knobs:

- **`duration`** — total run length in seconds. The console shows it as the
  "/ 3:32" target and drives the progress bar.
- **`lanes`** — the five participants. `short` is what appears in the feed;
  `name` is what appears on the lane card.
- **`beats`** — the three moments highlighted in the "what to watch for" strip.
  Each has a `t`, an `until`, and the label that appears while it is live.
- **`summary`** — the stat tiles shown when the run finishes.

Playback runs on a timer with a clamped delta, so a student who switches tabs
mid-run returns to a run that paused rather than one that skipped ahead.
