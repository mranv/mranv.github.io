/* Walk, then the map. Content lives in content.js. */
(function () {
  "use strict";

  var data = window.ATLAS;
  if (!data) return;

  var root = document.documentElement;
  var walk = document.getElementById("walk");
  var stage = document.getElementById("stage");
  var world = document.getElementById("world");
  var farLand = null;
  var walker = document.getElementById("walker");
  var hud = document.getElementById("hud");
  var atlas = document.getElementById("atlas");
  var openWalk = null;
  var closeWalk = document.getElementById("close-walk");
  var btnLeft = document.getElementById("walk-left");
  var btnRight = document.getElementById("walk-right");

  var narrowQ = window.matchMedia("(max-width: 800px)");
  var reduceQ = window.matchMedia("(prefers-reduced-motion: reduce)");

  var keys = { left: false, right: false };
  var x = 0;
  var worldWidth = data.world.width;
  var raf = 0;
  var last = 0;
  var arrived = false;
  var found = [];
  var ribbonMode = "written";
  var kickerEl = null;
  var listEl = null;

  function marks() {
    return data.signs.filter(function (s) { return !s.gate; });
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function applyMapFirst(closeOverlay) {
    var on = narrowQ.matches || reduceQ.matches;
    root.classList.toggle("map-first", on);
    if (on && closeOverlay) root.classList.remove("walk-open");
  }

  function maxX() {
    return Math.max(0, worldWidth - stage.clientWidth);
  }

  function fitWorld() {
    var gateX = 0;
    data.signs.forEach(function (s) { if (s.gate) gateX = s.x; });
    var need = gateX + stage.clientWidth * 0.82 + 80;
    worldWidth = Math.max(data.world.width, Math.ceil(need));
    world.style.width = worldWidth + "px";
    layoutLand();
    x = clamp(x, 0, maxX());
    setTransform();
  }

  function layoutLand() {
    if (!farLand) return;
    farLand.style.width = (worldWidth * 1.9) + "px";
    farLand.style.left = (-worldWidth * 0.5) + "px";
  }

  function walkActive() {
    if (root.classList.contains("walk-open")) return true;
    if (root.classList.contains("map-first")) return false;
    var rect = walk.getBoundingClientRect();
    return rect.top < 140 && rect.bottom > 180;
  }

  function setTransform() {
    world.style.transform = "translate3d(" + (-x) + "px,0,0)";
    if (farLand) farLand.style.transform = "translate3d(" + (x * 0.52) + "px,0,0)";
  }

  function sampleDusk() {
    var sample = x + stage.clientWidth * 0.45;
    walk.classList.toggle("is-dusk", sample > 4300);
  }

  function say(text) {
    hud.textContent = text;
  }

  function buildWorld() {
    world.style.width = worldWidth + "px";
    world.appendChild(el("div", "sky"));
    world.appendChild(el("div", "ground"));
    farLand = el("div", "land land-far");
    world.appendChild(farLand);
    world.appendChild(el("div", "land land-near"));
    world.appendChild(el("div", "pathline"));
    layoutLand();

    data.scenery.forEach(function (item) {
      var node = el("div", "scenery scenery-" + item.kind);
      node.style.left = item.x + "px";
      node.setAttribute("aria-hidden", "true");
      world.appendChild(node);
    });

    data.signs.forEach(function (sign) {
      var node = el("div", sign.gate ? "sign sign-gate" : "sign");
      node.style.left = sign.x + "px";
      node.dataset.id = sign.id;
      if (sign.gate) node.dataset.gate = "1";
      if (sign.color) node.style.setProperty("--mark", sign.color);
      node.setAttribute("aria-hidden", "true");

      if (sign.gate) {
        node.appendChild(el("span", "post a"));
        node.appendChild(el("span", "post b"));
        node.appendChild(el("span", "lintel"));
      } else {
        node.appendChild(el("span", "post"));
      }

      var board = el("span", "board");
      var tab = el("span", "tab");
      var year = el("span", "year");
      var place = el("span", "title");
      var line = el("span", "line");
      if (!sign.gate) year.textContent = sign.year;
      place.textContent = sign.place;
      line.textContent = sign.line;
      board.appendChild(tab);
      if (!sign.gate) board.appendChild(year);
      board.appendChild(place);
      board.appendChild(line);
      node.appendChild(board);
      world.appendChild(node);
    });
  }

  function link(href, text) {
    var a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    if (/^https?:/.test(href)) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    return a;
  }

  function placeBlock(item) {
    var article = el("article", "place");
    var tick = el("span", "tick");
    if (item.color) tick.style.setProperty("--mark", item.color);
    var body = el("div", "place-body");
    var h = document.createElement("h3");
    if (item.href) h.appendChild(link(item.href, item.name));
    else h.textContent = item.name;
    var beat = el("p", "beat");
    beat.textContent = item.beat;
    body.appendChild(h);
    body.appendChild(beat);
    if (item.note) {
      var note = el("p", "note");
      if (item.date) {
        var time = document.createElement("time");
        time.dateTime = item.date;
        time.textContent = item.dateLabel || item.date;
        note.appendChild(time);
        note.appendChild(document.createTextNode(" "));
      }
      if (item.noteHref) note.appendChild(link(item.noteHref, item.note));
      else note.appendChild(document.createTextNode(item.note));
      body.appendChild(note);
    }
    article.appendChild(tick);
    article.appendChild(body);
    return article;
  }

  function section(index, title, nodes) {
    var sec = el("section", "sheet");
    var num = el("p", "index");
    num.textContent = index;
    var body = el("div", "sheet-body");
    var h = document.createElement("h2");
    h.textContent = title;
    body.appendChild(h);
    nodes.forEach(function (n) { body.appendChild(n); });
    sec.appendChild(num);
    sec.appendChild(body);
    return sec;
  }

  function buildAtlas() {
    var kicker = el("p", "kicker");
    kicker.textContent = data.person.kicker;

    var h1 = document.createElement("h1");
    h1.textContent = data.person.sentence;

    var where = el("p", "where");
    where.textContent = data.person.where;

    var study = el("p", "study");
    study.textContent = data.person.study;

    var ribbon = el("div", "ribbon");
    kickerEl = el("p", "ribbon-kicker");
    kickerEl.id = "ribbon-kicker";
    kickerEl.setAttribute("aria-live", "polite");
    listEl = document.createElement("ol");
    ribbon.appendChild(kickerEl);
    ribbon.appendChild(listEl);

    var pathLink = document.createElement("a");
    pathLink.className = "path-link return-path";
    pathLink.href = "#walk";
    pathLink.textContent = "Return to the path";

    openWalk = document.createElement("button");
    openWalk.type = "button";
    openWalk.className = "path-link walk-toggle";
    openWalk.id = "open-walk";
    openWalk.textContent = "Walk the path";

    var actions = el("p", "path-actions");
    actions.appendChild(pathLink);
    actions.appendChild(openWalk);

    var sr = el("div", "sr");
    var srH = document.createElement("h2");
    srH.textContent = "Marks on the path";
    var srList = document.createElement("ol");
    marks().forEach(function (sign) {
      var li = document.createElement("li");
      li.textContent = sign.year + ", " + sign.place + ". " + sign.line;
      srList.appendChild(li);
    });
    sr.appendChild(srH);
    sr.appendChild(srList);

    var now = el("p", "now");
    now.textContent = data.person.now;

    var years = document.createElement("ol");
    years.className = "years";
    data.earlier.forEach(function (row) {
      var li = document.createElement("li");
      var when = el("span", "when");
      when.textContent = row.when;
      var text = el("span", "what");
      text.textContent = row.text;
      li.appendChild(when);
      li.appendChild(text);
      years.appendChild(li);
    });

    var hireLead = el("p", "hire-lead");
    hireLead.textContent = "What I take on";

    var hireWrap = el("div", "hire");
    data.hire.forEach(function (row) {
      var block = el("div", "hire-row");
      var h = document.createElement("h3");
      h.textContent = row.title;
      var p = document.createElement("p");
      p.textContent = row.text;
      block.appendChild(h);
      block.appendChild(p);
      hireWrap.appendChild(block);
    });

    var foot = document.createElement("footer");
    foot.className = "colophon";
    var links = el("div", "footlinks");
    data.contact.forEach(function (item) {
      links.appendChild(link(item.href, item.label));
    });
    var colo = el("p", "colo");
    colo.textContent = data.colophon;
    foot.appendChild(links);
    foot.appendChild(colo);

    atlas.appendChild(kicker);
    atlas.appendChild(h1);
    atlas.appendChild(where);
    atlas.appendChild(study);
    atlas.appendChild(ribbon);
    atlas.appendChild(actions);
    atlas.appendChild(sr);
    atlas.appendChild(section("01", "Places", data.places.map(placeBlock)));
    atlas.appendChild(section("02", "Practices", data.practices.map(placeBlock)));
    atlas.appendChild(section("03", "Tools", data.tools.map(placeBlock)));

    var workSec = section("04", "Work", []);
    workSec.querySelector(".sheet-body").appendChild(now);
    workSec.querySelector(".sheet-body").appendChild(years);
    workSec.querySelector(".sheet-body").appendChild(hireLead);
    workSec.querySelector(".sheet-body").appendChild(hireWrap);
    atlas.appendChild(workSec);
    atlas.appendChild(foot);

    renderRibbon("written");
  }

  function renderRibbon(mode) {
    ribbonMode = mode;
    var items = mode === "walked" ? found : marks();
    kickerEl.textContent = mode === "walked"
      ? "Collected while walking, in the order found."
      : "The path, in the order it was written.";
    listEl.replaceChildren();
    items.forEach(function (sign) {
      var li = document.createElement("li");
      var swatch = el("span", "swatch");
      swatch.style.background = sign.color;
      var name = el("span", "swatch-name");
      name.textContent = sign.label || sign.place;
      li.appendChild(swatch);
      li.appendChild(name);
      listEl.appendChild(li);
    });
    if (items.length) {
      root.style.setProperty("--accent", items[items.length - 1].color);
    }
  }

  function collect(node) {
    var id = node.dataset.id;
    var sign = null;
    data.signs.forEach(function (s) { if (s.id === id) sign = s; });
    if (!sign || sign.gate || node.classList.contains("is-found")) return;
    node.classList.add("is-found");
    found.push(sign);
    renderRibbon("walked");
    say(sign.place + ", " + sign.year + ". " + found.length + " of " + marks().length + ".");
  }

  function checkSigns() {
    var wb = walker.getBoundingClientRect();
    var wx = wb.left + wb.width / 2;
    var nodes = world.querySelectorAll(".sign");
    for (var i = 0; i < nodes.length; i++) {
      var s = nodes[i];
      var rect = s.getBoundingClientRect();
      var sx = rect.left + rect.width / 2;
      if (Math.abs(sx - wx) > 96) continue;
      if (s.dataset.gate === "1") arrive();
      else collect(s);
    }
  }

  function arrive() {
    if (arrived) return;
    arrived = true;
    keys.left = false;
    keys.right = false;
    walk.classList.add("is-arrived");
    say("The path ends. The map is next.");
    var reduce = reduceQ.matches;
    window.setTimeout(function () {
      if (root.classList.contains("walk-open")) root.classList.remove("walk-open");
      atlas.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }, reduce ? 0 : 720);
  }

  function kick() {
    if (!raf) {
      last = 0;
      raf = window.requestAnimationFrame(frame);
    }
  }

  function frame(t) {
    if (!last) last = t;
    var dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    var dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    walker.classList.toggle("face-left", keys.left && !keys.right);
    stage.classList.toggle("is-walking", dir !== 0);

    if (dir !== 0 && !(arrived && dir > 0)) {
      if (arrived && dir < 0) {
        arrived = false;
        walk.classList.remove("is-arrived");
      }
      x = clamp(x + dir * data.world.speed * dt, 0, maxX());
      setTransform();
      sampleDusk();
      checkSigns();
      raf = window.requestAnimationFrame(frame);
    } else {
      raf = 0;
      last = 0;
      stage.classList.remove("is-walking");
    }
  }

  function dirFrom(e) {
    var code = e.code || "";
    var key = e.key || "";
    if (code === "KeyA" || key === "a" || key === "A" || code === "ArrowLeft" || key === "ArrowLeft") return "left";
    if (code === "KeyD" || key === "d" || key === "D" || code === "ArrowRight" || key === "ArrowRight") return "right";
    return null;
  }

  function bindHold(button, dir) {
    function down(e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      try { button.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
      keys[dir] = true;
      kick();
    }
    function up() { keys[dir] = false; }
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", up);
    button.addEventListener("keydown", function (e) {
      if (e.key !== " " && e.key !== "Enter") return;
      if (e.repeat) return;
      e.preventDefault();
      keys[dir] = true;
      kick();
    });
    button.addEventListener("keyup", function (e) {
      if (e.key !== " " && e.key !== "Enter") return;
      keys[dir] = false;
    });
  }

  function bindSwipe() {
    var ptr = null;
    stage.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button, a")) return;
      ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, active: false };
    });
    stage.addEventListener("pointermove", function (e) {
      if (!ptr || e.pointerId !== ptr.id) return;
      var dx = e.clientX - ptr.x;
      var dy = e.clientY - ptr.y;
      if (!ptr.active) {
        if (Math.hypot(dx, dy) < 14) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          ptr = null;
          return;
        }
        ptr.active = true;
        try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
      keys.right = dx > 10;
      keys.left = dx < -10;
      kick();
    });
    function end(e) {
      if (!ptr || e.pointerId !== ptr.id) return;
      keys.left = false;
      keys.right = false;
      ptr = null;
    }
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
  }

  function openPath() {
    root.classList.add("walk-open");
    x = 0;
    arrived = false;
    walk.classList.remove("is-arrived");
    fitWorld();
    sampleDusk();
    say("A or D to walk. Five marks, then the map.");
    closeWalk.focus();
  }

  function leavePath() {
    root.classList.remove("walk-open");
    keys.left = false;
    keys.right = false;
    if (openWalk) openWalk.focus();
  }

  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && root.classList.contains("walk-open")) {
      leavePath();
      return;
    }
    var dir = dirFrom(e);
    if (!dir || !walkActive()) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault();
    if (!e.repeat) {
      keys[dir] = true;
      kick();
    } else {
      keys[dir] = true;
    }
  });

  window.addEventListener("keyup", function (e) {
    var dir = dirFrom(e);
    if (!dir) return;
    keys[dir] = false;
  });

  narrowQ.addEventListener("change", function () { applyMapFirst(true); });
  reduceQ.addEventListener("change", function () { applyMapFirst(true); });

  buildWorld();
  fitWorld();
  buildAtlas();
  bindHold(btnLeft, "left");
  bindHold(btnRight, "right");
  bindSwipe();
  openWalk.addEventListener("click", openPath);
  closeWalk.addEventListener("click", leavePath);
  document.querySelector(".return-path").addEventListener("click", function () {
    arrived = false;
    walk.classList.remove("is-arrived");
  });
  say("A or D to walk. Five marks, then the map.");
  sampleDusk();
  applyMapFirst(false);

  window.addEventListener("resize", function () {
    fitWorld();
    sampleDusk();
  });
})();
