/* Bayer Agent Lab — run player.
 *
 * Plays back SIM_EVENTS on a virtual clock so a room of thirty people can watch
 * the same agent run at the same time, without accounts, installs or wifi that
 * holds. The replay is faithful to a real run (see sim-events.js); it is
 * labelled as a replay in the console chrome rather than passed off as live.
 *
 * Also renders the three output files (SIM_OUTPUTS) once the run finishes.
 */
(function () {
  "use strict";

  var SIM = window.SIM_EVENTS;
  var OUT = window.SIM_OUTPUTS;
  if (!SIM || !SIM.events) return;

  var farmNames = {};
  if (window.LAB_DATA && window.LAB_DATA.farms) {
    window.LAB_DATA.farms.forEach(function (f) { farmNames[f.id] = f.name; });
  }

  var el = {
    console: document.getElementById("run-console"),
    start: document.getElementById("run-start"),
    restart: document.getElementById("run-restart"),
    skip: document.getElementById("run-skip"),
    clock: document.getElementById("run-clock"),
    progress: document.getElementById("run-progress"),
    lanes: document.getElementById("run-lanes"),
    feed: document.getElementById("run-feed"),
    idle: document.getElementById("run-idle"),
    files: document.getElementById("run-files"),
    rank: document.getElementById("run-rank"),
    review: document.getElementById("run-review"),
    summary: document.getElementById("run-summary"),
    summaryStats: document.getElementById("run-summary-stats"),
    beats: document.getElementById("run-beats"),
    outputs: document.getElementById("outputs"),
  };
  if (!el.console || !el.feed) return;

  var events = SIM.events.slice().sort(function (a, b) { return a.t - b.t; });
  var speed = 2;
  var clock = 0;
  var cursor = 0;
  var ticker = null;
  var lastFrame = 0;
  var playing = false;
  var finished = false;
  var laneEls = {};

  var FRAME_MS = 60;
  /* Browsers throttle timers in hidden tabs. Clamping the delta means a student
   * who switches tabs comes back to a run that paused, not one that skipped
   * thirty seconds of the story while they were away. */
  var MAX_DT = 0.25;

  /* Reveal without requestAnimationFrame — rAF does not fire in a hidden tab,
   * which would leave freshly appended lines stuck at opacity 0. */
  function reveal(node) {
    void node.offsetWidth;
    node.classList.add("is-in");
  }

  /* ---------------- lanes ---------------- */

  function buildLanes() {
    el.lanes.innerHTML = "";
    laneEls = {};
    SIM.lanes.forEach(function (lane) {
      var node = document.createElement("article");
      node.className = "lane lane--" + lane.kind + " is-idle";
      node.innerHTML =
        '<div class="lane__head">' +
          '<span class="lane__pip" aria-hidden="true"></span>' +
          '<div class="lane__id">' +
            '<p class="lane__name">' + esc(lane.name) + "</p>" +
            '<p class="lane__sub">' + esc(lane.sub) + "</p>" +
          "</div>" +
        "</div>" +
        '<p class="lane__status">idle</p>' +
        '<p class="lane__now">—</p>';
      el.lanes.appendChild(node);
      laneEls[lane.id] = {
        root: node,
        status: node.querySelector(".lane__status"),
        now: node.querySelector(".lane__now"),
      };
    });
  }

  function setLane(id, state, statusText, nowText) {
    var l = laneEls[id];
    if (!l) return;
    if (state) {
      l.root.classList.remove("is-idle", "is-running", "is-waiting", "is-done");
      l.root.classList.add("is-" + state);
    }
    if (statusText != null) l.status.textContent = statusText;
    if (nowText != null) l.now.textContent = nowText;
  }

  /* ---------------- feed ---------------- */

  var ICONS = {
    say: "",
    read: "read",
    write: "wrote",
    spawn: "start",
    wait: "wait",
    flag: "flag",
    score: "score",
    stop: "stop",
    done: "done",
  };

  function laneOf(id) {
    for (var i = 0; i < SIM.lanes.length; i++) {
      if (SIM.lanes[i].id === id) return SIM.lanes[i];
    }
    return { name: id, kind: "orchestrator" };
  }

  function emit(ev) {
    var lane = laneOf(ev.lane);
    var line = document.createElement("div");
    line.className =
      "line line--" + ev.type + " line--" + lane.kind + " line--" + ev.lane +
      (ev.emphasis ? " line--emph" : "");

    var body = "";
    if (ev.type === "read" || ev.type === "write") {
      body =
        '<span class="line__verb">' + ICONS[ev.type] + "</span>" +
        '<code class="line__file">' + esc(ev.file) + "</code>" +
        (ev.text ? '<span class="line__note">' + esc(ev.text) + "</span>" : "");
    } else if (ev.type === "spawn") {
      body = '<span class="line__verb">' + ICONS.spawn + "</span><span>" + esc(ev.text) + "</span>";
    } else if (ev.type === "wait") {
      body = '<span class="line__verb">' + ICONS.wait + "</span><span>" + esc(ev.text) + "</span>";
    } else if (ev.type === "flag") {
      body =
        '<span class="line__badge line__badge--flag">' + esc(ev.flag) + "</span>" +
        '<span class="line__farm">' + esc(ev.farm) + "</span>" +
        '<span class="line__body">' + esc(ev.text) + "</span>";
    } else if (ev.type === "score") {
      body =
        '<span class="line__verb">' + ICONS.score + "</span>" +
        '<span class="line__farm">' + esc(ev.farm) + "</span>" +
        '<span class="line__score">' + ev.score + "/100</span>" +
        '<span class="line__conf line__conf--' + ev.conf.toLowerCase() + '">' + esc(ev.conf) + " confidence</span>";
    } else if (ev.type === "stop") {
      body =
        '<span class="line__badge line__badge--stop">not scored</span>' +
        '<span class="line__farm">' + esc(ev.farm) + "</span>" +
        '<span class="line__body">' + esc(ev.text) + "</span>";
    } else if (ev.type === "done") {
      body = '<span class="line__verb line__verb--done">' + ICONS.done + "</span><span>" + esc(ev.text) + "</span>";
    } else {
      body = '<span class="line__body">' + esc(ev.text) + "</span>";
    }

    line.innerHTML =
      '<span class="line__who">' + esc(lane.short || lane.name) + "</span>" +
      '<span class="line__content">' + body + "</span>";

    el.feed.appendChild(line);
    reveal(line);
    trimFeed();
    el.feed.scrollTop = el.feed.scrollHeight;
  }

  function trimFeed() {
    while (el.feed.children.length > 260) el.feed.removeChild(el.feed.firstChild);
  }

  /* ---------------- side rails ---------------- */

  function addFile(path, note) {
    clearEmpty(el.files, "filelist__empty");
    var li = document.createElement("li");
    li.innerHTML = '<code>' + esc(path) + "</code>" + (note ? "<span>" + esc(note) + "</span>" : "");
    el.files.appendChild(li);
    reveal(li);
  }

  var ranked = [];
  function addScore(farm, score, conf) {
    clearEmpty(el.rank, "rankmini__empty");
    ranked.push({ farm: farm, score: score, conf: conf });
    ranked.sort(function (a, b) { return b.score - a.score; });
    el.rank.innerHTML = ranked
      .map(function (r) {
        return (
          "<li><span class='rankmini__farm'>" + esc(r.farm) + "</span>" +
          "<span class='rankmini__name'>" + esc(farmNames[r.farm] || "") + "</span>" +
          "<span class='rankmini__score'>" + r.score + "</span></li>"
        );
      })
      .join("");
  }

  function addReview(farm, flag, emphasis) {
    clearEmpty(el.review, "reviewmini__empty");
    var li = document.createElement("li");
    if (emphasis) li.className = "is-emph";
    li.innerHTML =
      "<span class='reviewmini__farm'>" + esc(farm) + "</span>" +
      "<span class='reviewmini__name'>" + esc(farmNames[farm] || "") + "</span>" +
      "<span class='reviewmini__flag'>" + esc(flag) + "</span>";
    el.review.appendChild(li);
    reveal(li);
  }

  function clearEmpty(list, cls) {
    var empty = list.querySelector("." + cls);
    if (empty) list.innerHTML = "";
  }

  /* ---------------- beats ---------------- */

  function updateBeats() {
    if (!SIM.beats || !el.beats) return;
    SIM.beats.forEach(function (b) {
      var node = el.beats.querySelector('[data-beat="' + b.id + '"]');
      if (!node) return;
      var live = clock >= b.t && clock < b.until;
      var past = clock >= b.until;
      node.classList.toggle("is-live", live);
      node.classList.toggle("is-past", past);
      var live_el = node.querySelector(".beat__live");
      if (live && !live_el) {
        var p = document.createElement("span");
        p.className = "beat__live";
        p.textContent = b.label;
        node.appendChild(p);
      } else if (!live && live_el) {
        live_el.remove();
      }
    });
  }

  /* ---------------- event application ---------------- */

  function apply(ev) {
    emit(ev);

    if (ev.type === "spawn" && ev.target) {
      setLane(ev.target, "running", "starting", "spinning up");
    }
    if (ev.lane && ev.type !== "done") {
      var current = laneEls[ev.lane];
      if (current && current.root.classList.contains("is-idle")) {
        setLane(ev.lane, "running", "working", null);
      }
      if (ev.type === "wait") {
        setLane(ev.lane, "waiting", "waiting", ev.text);
      } else if (ev.type === "read") {
        setLane(ev.lane, "running", "reading", ev.file);
      } else if (ev.type === "write") {
        setLane(ev.lane, "running", "writing", ev.file);
      } else if (ev.type === "flag") {
        setLane(ev.lane, "running", "flagging", ev.farm + " · " + ev.flag);
      } else if (ev.type === "score") {
        setLane(ev.lane, "running", "scoring", ev.farm + " · " + ev.score);
      } else if (ev.type === "stop") {
        setLane(ev.lane, "running", "refusing to score", ev.farm);
      } else if (ev.type === "say") {
        setLane(ev.lane, "running", "thinking", null);
      }
    }
    if (ev.type === "done") {
      setLane(ev.lane, "done", "done", ev.text);
    }
    if (ev.type === "write") addFile(ev.file, ev.text);
    if (ev.type === "score") addScore(ev.farm, ev.score, ev.conf);
    if (ev.type === "flag" || ev.type === "stop") {
      if (ev.type === "stop") addReview(ev.farm, ev.flag, ev.emphasis);
    }
  }

  /* ---------------- transport ---------------- */

  function fmt(sec) {
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ":" + String(s).padStart(2, "0");
  }

  function render() {
    el.clock.textContent = fmt(clock);
    el.progress.style.width = Math.min(100, (clock / SIM.duration) * 100) + "%";
    updateBeats();
  }

  function frame() {
    if (!playing) return;
    var now = Date.now();
    var dt = Math.min(MAX_DT, (now - lastFrame) / 1000);
    lastFrame = now;
    clock += dt * speed;

    while (cursor < events.length && events[cursor].t <= clock) {
      apply(events[cursor]);
      cursor += 1;
    }
    render();

    if (clock >= SIM.duration && cursor >= events.length) {
      complete();
    }
  }

  function play() {
    if (finished) return;
    if (el.idle) el.idle.remove();
    el.console.classList.add("is-running");
    playing = true;
    lastFrame = Date.now();
    el.start.textContent = "⏸ Pause";
    clearInterval(ticker);
    ticker = setInterval(frame, FRAME_MS);
  }

  function pause() {
    playing = false;
    clearInterval(ticker);
    el.start.textContent = "▶ Resume";
  }

  function skip() {
    if (el.idle) el.idle.remove();
    playing = false;
    clearInterval(ticker);
    while (cursor < events.length) {
      apply(events[cursor]);
      cursor += 1;
    }
    clock = SIM.duration;
    render();
    complete();
  }

  function complete() {
    playing = false;
    finished = true;
    clearInterval(ticker);
    el.console.classList.remove("is-running");
    el.console.classList.add("is-complete");
    el.start.hidden = true;
    el.restart.hidden = false;
    el.skip.hidden = true;
    SIM.lanes.forEach(function (l) { setLane(l.id, "done", "done", null); });
    showSummary();
  }

  function reset() {
    playing = false;
    finished = false;
    clearInterval(ticker);
    clock = 0;
    cursor = 0;
    ranked = [];
    el.feed.innerHTML = "";
    el.files.innerHTML = '<li class="filelist__empty">none yet</li>';
    el.rank.innerHTML = '<li class="rankmini__empty">none yet</li>';
    el.review.innerHTML = '<li class="reviewmini__empty">none yet</li>';
    el.summary.hidden = true;
    el.console.classList.remove("is-complete", "is-running");
    el.start.hidden = false;
    el.start.textContent = "▶ Run the team";
    el.restart.hidden = true;
    el.skip.hidden = false;
    buildLanes();
    render();
    play();
  }

  function showSummary() {
    var s = SIM.summary || {};
    var stats = [
      ["Wall clock", s.elapsed || "—"],
      ["Prompts typed", s.prompts != null ? s.prompts : "—"],
      ["Times it asked you", s.interruptions != null ? s.interruptions : "—"],
      ["Farms scored", s.scored != null ? s.scored + " of 10" : "—"],
      ["Sent to a human", s.review != null ? s.review : "—"],
      ["Drafts written", s.drafts != null ? s.drafts : "—"],
    ];
    el.summaryStats.innerHTML = stats
      .map(function (p) {
        return (
          '<div class="stat"><p class="stat__v">' + esc(String(p[1])) + "</p>" +
          '<p class="stat__k">' + esc(p[0]) + "</p></div>"
        );
      })
      .join("");
    el.summary.hidden = false;
  }

  el.start.addEventListener("click", function () {
    playing ? pause() : play();
  });
  el.restart.addEventListener("click", reset);
  el.skip.addEventListener("click", skip);

  document.querySelectorAll(".speed").forEach(function (btn) {
    btn.addEventListener("click", function () {
      speed = Number(btn.getAttribute("data-speed"));
      document.querySelectorAll(".speed").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
    });
  });

  /* ---------------- outputs ---------------- */

  function buildOutputs() {
    if (!el.outputs || !OUT || !OUT.outputs) return;
    var list = el.outputs.querySelector(".outputs__list");
    var panels = el.outputs.querySelector(".outputs__panels");
    list.innerHTML = "";
    panels.innerHTML = "";

    OUT.outputs.forEach(function (file, i) {
      var id = file.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();

      var tab = document.createElement("button");
      tab.type = "button";
      tab.className = "outputs__tab" + (i === 0 ? " is-active" : "");
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", i === 0 ? "true" : "false");
      tab.innerHTML =
        "<strong>" + esc(file.name) + "</strong><span>" + esc(file.blurb) + "</span>";
      tab.addEventListener("click", function () { activate(id); });
      list.appendChild(tab);
      tab.dataset.target = id;

      var panel = document.createElement("div");
      panel.className = "outputs__panel" + (i === 0 ? " is-active" : "");
      panel.dataset.id = id;
      panel.hidden = i !== 0;
      panel.innerHTML =
        '<div class="outputs__meta"><code>output/' + esc(file.name) + "</code>" +
        "<span>" + file.lines + " lines · written by the team, unedited</span></div>" +
        '<div class="md">' + md(file.body) + "</div>";
      panels.appendChild(panel);
    });

    function activate(id) {
      list.querySelectorAll(".outputs__tab").forEach(function (t) {
        var on = t.dataset.target === id;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.querySelectorAll(".outputs__panel").forEach(function (p) {
        var on = p.dataset.id === id;
        p.classList.toggle("is-active", on);
        p.hidden = !on;
      });
    }
  }

  /* Built up front rather than on completion, so the output files are readable
   * even if the run is never played — a projector failure should not be able to
   * take the audit questions down with it. */
  buildOutputs();

  /* ---------------- tiny markdown ---------------- */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[\s(])\*([^*]+)\*/g, "$1<em>$2</em>");
  }

  function md(src) {
    var lines = String(src).split("\n");
    var html = [];
    var i = 0;

    function isTableRow(s) { return /^\s*\|.*\|\s*$/.test(s); }
    function cells(s) {
      return s.trim().replace(/^\||\|$/g, "").split("|").map(function (c) { return c.trim(); });
    }

    while (i < lines.length) {
      var line = lines[i];

      if (!line.trim()) { i++; continue; }

      if (/^---+\s*$/.test(line)) { html.push("<hr />"); i++; continue; }

      var h = /^(#{1,6})\s+(.*)$/.exec(line);
      if (h) {
        var lvl = Math.min(6, h[1].length + 1);
        html.push("<h" + lvl + ">" + inline(h[2]) + "</h" + lvl + ">");
        i++;
        continue;
      }

      if (isTableRow(line) && isTableRow(lines[i + 1] || "") && /^[\s|:-]+$/.test(lines[i + 1])) {
        var head = cells(line);
        i += 2;
        var rows = [];
        while (i < lines.length && isTableRow(lines[i])) { rows.push(cells(lines[i])); i++; }
        html.push(
          '<div class="md__scroll"><table><thead><tr>' +
          head.map(function (c) { return "<th>" + inline(c) + "</th>"; }).join("") +
          "</tr></thead><tbody>" +
          rows.map(function (r) {
            return "<tr>" + r.map(function (c) { return "<td>" + inline(c) + "</td>"; }).join("") + "</tr>";
          }).join("") +
          "</tbody></table></div>"
        );
        continue;
      }

      if (/^\s*[-*]\s+/.test(line)) {
        var items = [];
        while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i]) || (items.length && /^\s{2,}\S/.test(lines[i])))) {
          if (/^\s*[-*]\s+/.test(lines[i])) {
            items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
          } else {
            items[items.length - 1] += " " + lines[i].trim();
          }
          i++;
        }
        html.push("<ul>" + items.map(function (t) { return "<li>" + inline(t) + "</li>"; }).join("") + "</ul>");
        continue;
      }

      var para = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|---+\s*$|\s*[-*]\s)/.test(lines[i]) && !isTableRow(lines[i])) {
        para.push(lines[i].trim());
        i++;
      }
      html.push("<p>" + inline(para.join(" ")) + "</p>");
    }

    return html.join("\n");
  }

  /* ---------------- init ---------------- */

  buildLanes();
  render();
})();
