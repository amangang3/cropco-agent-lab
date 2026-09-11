(function () {
  "use strict";

  var data = window.LAB_DATA;
  if (!data || !data.farms || !data.farms.length) {
    console.error("LAB_DATA missing — check assets/farms.js");
    return;
  }

  var farms = data.farms;
  var STORAGE_KEY = "cropco-lab-done-v3";
  var DURATION = 8 * 60; // seconds — the self-timed Part 1 round

  var state = {
    index: 0,
    done: loadDone(),
    remaining: DURATION,
    running: false,
    intervalId: null,
  };

  var els = {
    timerDisplay: document.getElementById("timer-display"),
    timerStart: document.getElementById("timer-start"),
    timerReset: document.getElementById("timer-reset"),
    timerHint: document.getElementById("timer-hint"),
    doneCount: document.getElementById("done-count"),
    farmTotal: document.getElementById("farm-total"),
    progressFill: document.getElementById("progress-fill"),
    farmId: document.getElementById("farm-id"),
    farmName: document.getElementById("farm-name"),
    farmCrm: document.getElementById("farm-crm"),
    farmNote: document.getElementById("farm-note"),
    farmDots: document.getElementById("farm-dots"),
    farmPrev: document.getElementById("farm-prev"),
    farmNext: document.getElementById("farm-next"),
    copyFarm: document.getElementById("copy-farm"),
    markDone: document.getElementById("mark-done"),
    rubricGrid: document.getElementById("rubric-grid"),
    rubricNotes: document.getElementById("rubric-notes"),
    toast: document.getElementById("toast"),
    briefText: document.getElementById("brief-text"),
    promptText: document.getElementById("prompt-text"),
  };

  if (els.farmTotal) {
    els.farmTotal.textContent = String(farms.length);
  }

  function loadDone() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveDone() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.done));
    } catch (e) {
      /* ignore quota / private mode */
    }
  }

  function showToast(message) {
    els.toast.hidden = false;
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      els.toast.classList.remove("is-visible");
    }, 1600);
  }

  function copyText(text, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () {
        showToast(label || "Copied");
      }).catch(function () {
        fallbackCopy(text, label);
      });
    }
    fallbackCopy(text, label);
  }

  function fallbackCopy(text, label) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showToast(label || "Copied");
    } catch (e) {
      showToast("Copy failed — select the text manually");
    }
    document.body.removeChild(ta);
  }

  function statusLabel(farm) {
    if (farm.status === "Customer" && farm.years > 0) {
      return "Customer (" + farm.years + " yrs)";
    }
    return farm.status;
  }

  function farmPasteText(farm) {
    return [
      "### " + farm.id + " — " + farm.name,
      "",
      "CRM: " +
        farm.acres +
        " acres | " +
        farm.crops +
        " | " +
        farm.county +
        " County, " +
        farm.state +
        " | " +
        statusLabel(farm) +
        " | supplier: " +
        farm.supplier +
        " | est. annual spend: " +
        farm.spendLabel,
      "",
      "**Rep:** " + farm.rep,
      "**Location:** " + farm.county + " County, " + farm.state,
      "**Date of last contact:** " + farm.lastContact,
      "",
      farm.note,
    ].join("\n");
  }

  function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m + ":" + String(s).padStart(2, "0");
  }

  function renderTimer() {
    els.timerDisplay.textContent = formatTime(state.remaining);
    els.timerDisplay.classList.toggle("is-urgent", state.running && state.remaining <= 60);
    els.timerDisplay.classList.toggle("is-done", state.remaining === 0);
    els.timerStart.textContent = state.running ? "Pause" : state.remaining === 0 ? "Restart" : "Start";
  }

  function tick() {
    if (state.remaining <= 0) {
      stopTimer(true);
      return;
    }
    state.remaining -= 1;
    renderTimer();
    if (state.remaining === 0) {
      stopTimer(true);
      els.timerHint.textContent =
        "Time. Stop wherever you are, and write down the number you reached.";
      showToast("Eight minutes — stop there");
    }
  }

  function startTimer() {
    if (state.remaining === 0) {
      state.remaining = DURATION;
    }
    if (state.running) {
      stopTimer(false);
      return;
    }
    state.running = true;
    renderTimer();
    els.timerHint.textContent = "Timer running. Keep working until it hits zero.";
    state.intervalId = setInterval(tick, 1000);
  }

  function stopTimer(finished) {
    state.running = false;
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
    renderTimer();
    if (!finished && state.remaining > 0) {
      els.timerHint.textContent = "Paused. Press Start to continue.";
    }
  }

  function resetTimer() {
    stopTimer(false);
    state.remaining = DURATION;
    renderTimer();
    els.timerHint.textContent =
      "Start the timer when you paste the brief. Stop wherever you are when it hits zero \u2014 you are not expected to finish.";
  }

  function renderProgress() {
    var count = Object.keys(state.done).filter(function (id) {
      return state.done[id];
    }).length;
    els.doneCount.textContent = String(count);
    els.progressFill.style.width = (count / farms.length) * 100 + "%";
  }

  function renderDots() {
    els.farmDots.innerHTML = "";
    farms.forEach(function (farm, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "farm-dot";
      btn.textContent = String(i + 1);
      btn.title = farm.id + " — " + farm.name;
      btn.setAttribute("aria-label", farm.id);
      if (i === state.index) btn.classList.add("is-active");
      if (state.done[farm.id]) btn.classList.add("is-complete");
      btn.addEventListener("click", function () {
        state.index = i;
        renderFarm();
      });
      els.farmDots.appendChild(btn);
    });
  }

  function crmItem(label, value) {
    return (
      "<div><dt>" +
      label +
      "</dt><dd>" +
      value +
      "</dd></div>"
    );
  }

  function renderFarm() {
    var farm = farms[state.index];
    els.farmId.textContent = farm.id;
    els.farmName.textContent = farm.name;
    els.farmCrm.innerHTML = [
      crmItem("Acres", farm.acres.toLocaleString()),
      crmItem("Crops", farm.crops),
      crmItem("Location", farm.county + " County, " + farm.state),
      crmItem("Status", statusLabel(farm)),
      crmItem("Supplier", farm.supplier),
      crmItem("Est. spend", farm.spendLabel),
      crmItem("Rep", farm.rep),
      crmItem("Last contact", farm.lastContact),
    ].join("");
    els.farmNote.textContent = farmPasteText(farm);
    els.farmPrev.disabled = state.index === 0;
    els.farmNext.disabled = state.index === farms.length - 1;
    els.markDone.textContent = state.done[farm.id] ? "Completed ✓" : "Mark complete";
    els.markDone.classList.toggle("is-done", !!state.done[farm.id]);
    renderDots();
    renderProgress();
  }

  function renderRubric() {
    els.rubricGrid.innerHTML = data.rubric
      .map(function (r) {
        return (
          '<article class="rubric-card">' +
          '<p class="rubric-card__weight">' +
          r.weight +
          "%</p>" +
          '<p class="rubric-card__name">' +
          r.name +
          "</p>" +
          '<p class="rubric-card__n">Dimension ' +
          r.n +
          " · score 0–5</p>" +
          "</article>"
        );
      })
      .join("");

    var md = data.rubricMarkdown || "";
    var notesIdx = md.indexOf("## Notes on applying it");
    var notes = notesIdx >= 0 ? md.slice(notesIdx) : md;
    notes = notes
      .replace(/^## Notes on applying it\s*/m, "")
      .replace(/^## Confidence[\s\S]*$/m, "")
      .trim();

    var paragraphs = notes.split(/\n\n+/).map(function (block) {
      var html = block
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, " ");
      return "<p>" + html + "</p>";
    });
    els.rubricNotes.innerHTML = paragraphs.join("");
  }

  els.timerStart.addEventListener("click", startTimer);
  els.timerReset.addEventListener("click", resetTimer);

  els.farmPrev.addEventListener("click", function () {
    if (state.index > 0) {
      state.index -= 1;
      renderFarm();
    }
  });

  els.farmNext.addEventListener("click", function () {
    if (state.index < farms.length - 1) {
      state.index += 1;
      renderFarm();
    }
  });

  els.copyFarm.addEventListener("click", function () {
    copyText(farmPasteText(farms[state.index]), "Farm note copied");
  });

  els.markDone.addEventListener("click", function () {
    var id = farms[state.index].id;
    if (state.done[id]) {
      delete state.done[id];
    } else {
      state.done[id] = true;
    }
    saveDone();
    renderFarm();
  });

  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var kind = btn.getAttribute("data-copy");
      if (kind === "brief") {
        copyText(els.briefText.textContent, "Brief copied");
      } else if (kind === "prompt") {
        copyText(els.promptText.textContent, "Agent prompt copied");
      }
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === "ArrowLeft") {
      els.farmPrev.click();
    } else if (e.key === "ArrowRight") {
      els.farmNext.click();
    }
  });

  renderTimer();
  renderFarm();
  renderRubric();
  renderAgentTabs();
})();

function renderAgentTabs() {
  var defs = window.AGENT_DEFS;
  var root = document.getElementById("agent-tabs");
  if (!defs || !defs.length || !root) return;

  var list = root.querySelector(".agent-tabs__list");
  var panels = root.querySelector(".agent-tabs__panels");
  list.innerHTML = "";
  panels.innerHTML = "";

  defs.forEach(function (agent, i) {
    var tab = document.createElement("button");
    tab.type = "button";
    tab.className = "agent-tabs__tab";
    tab.id = "tab-" + agent.id;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", "panel-" + agent.id);
    tab.setAttribute("aria-selected", i === 0 ? "true" : "false");
    tab.textContent = agent.name;
    tab.addEventListener("click", function () {
      activateAgentTab(agent.id);
    });
    list.appendChild(tab);

    var panel = document.createElement("div");
    panel.className = "agent-tabs__panel" + (i === 0 ? " is-active" : "");
    panel.id = "panel-" + agent.id;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", "tab-" + agent.id);
    panel.hidden = i !== 0;

    panel.innerHTML =
      '<p class="agent-tabs__meta">' +
      "<span><strong>When:</strong> " + agent.when + "</span>" +
      "<span><strong>Tools:</strong> " + agent.tools + "</span>" +
      "<span><strong>File:</strong> <code>" + agent.file + "</code></span>" +
      "</p>" +
      '<p class="agent-tabs__blurb">' + agent.blurb + "</p>" +
      '<div class="agent-tabs__bar">' +
      '<button type="button" class="btn btn--small" data-copy-agent="' + agent.id + '">Copy definition</button>' +
      "</div>" +
      '<pre class="paste paste--agent" id="agent-body-' + agent.id + '"></pre>';

    panels.appendChild(panel);
    panel.querySelector("pre").textContent = agent.body;
  });

  root.querySelectorAll("[data-copy-agent]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-copy-agent");
      var agent = defs.find(function (a) { return a.id === id; });
      if (!agent) return;
      var ta = document.createElement("textarea");
      ta.value = agent.body;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(agent.body).then(function () {
            var toast = document.getElementById("toast");
            if (toast) {
              toast.hidden = false;
              toast.textContent = agent.name + " copied";
              toast.classList.add("is-visible");
              setTimeout(function () { toast.classList.remove("is-visible"); }, 1600);
            }
          });
        } else {
          document.execCommand("copy");
        }
      } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
    });
  });
}

function activateAgentTab(id) {
  var root = document.getElementById("agent-tabs");
  if (!root) return;
  root.querySelectorAll('[role="tab"]').forEach(function (tab) {
    var selected = tab.id === "tab-" + id;
    tab.setAttribute("aria-selected", selected ? "true" : "false");
  });
  root.querySelectorAll('[role="tabpanel"]').forEach(function (panel) {
    var active = panel.id === "panel-" + id;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
  });
}