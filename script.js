"use strict";

/* Hero video scrub settings */
const FRAME_COUNT = 96; // number of still frames kept in memory
const MAX_FRAME_SIDE = 1280; // longest side of a stored frame, in px
const PLAYBACK_RATE = 2; // speed of the capture playthrough
const CAPTURE_RUNS = 3; // max playthroughs before falling back to seeking
const EASE = 0.12; // how quickly the scrub catches up to the cursor
const FOCUS_X = 0.55; // where the subject sits across the video (0 = left, 1 = right); kept in view when the sides are cropped

const VIDEO_WEBM = "assets/hero.webm"; // VP9
const VIDEO_MP4 = "assets/hero.mp4"; // H.264 fallback for browsers without VP9
const END_MARGIN = 0.05; // stop this far before the end so the last slot is a real frame

/* ==========================================================================
   Live local time in Mumbai
   ========================================================================== */

const localTime = document.getElementById("localTime");

if (localTime) {
  const timeFormat = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  });

  const updateTime = () => {
    localTime.textContent = `${timeFormat.format(new Date())} IST`;
  };

  updateTime();
  setInterval(updateTime, 30000);
}

/* ==========================================================================
   Hero video scrub
   ========================================================================== */

const hero = document.getElementById("hero");
const canvas = document.getElementById("heroCanvas");

if (hero && canvas) {
  const ctx = canvas.getContext("2d");
  const frames = new Array(FRAME_COUNT).fill(null);

  let target = 0;
  let current = 0;
  let lastIndex = -1;
  let lastBitmap = null;
  let dirty = true;

  /* ---- Drawing ---------------------------------------------------------- */

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = hero.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    dirty = true;
  }

  // Nearest loaded frame to `index`, searching outward in both directions.
  function nearestFrame(index) {
    for (let d = 0; d < FRAME_COUNT; d++) {
      if (frames[index - d]) return frames[index - d];
      if (frames[index + d]) return frames[index + d];
    }
    return null;
  }

  // Draw like `object-fit: cover`, centred on FOCUS_X when the sides are cropped.
  function draw(bitmap) {
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / bitmap.width, ch / bitmap.height);
    const w = bitmap.width * scale;
    const h = bitmap.height * scale;
    const x = Math.min(0, Math.max(cw - w, cw / 2 - w * FOCUS_X));
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(bitmap, x, (ch - h) / 2, w, h);
  }

  function tick() {
    current += (target - current) * EASE;
    const index = Math.round(current);
    const bitmap = nearestFrame(index);

    if (bitmap && (dirty || index !== lastIndex || bitmap !== lastBitmap)) {
      draw(bitmap);
      lastIndex = index;
      lastBitmap = bitmap;
      dirty = false;
    }
    requestAnimationFrame(tick);
  }

  /* ---- Input ------------------------------------------------------------ */

  function setTargetFromX(clientX) {
    const rect = hero.getBoundingClientRect();
    const progress = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    target = progress * (FRAME_COUNT - 1);
  }

  hero.addEventListener("mousemove", (e) => setTargetFromX(e.clientX));
  hero.addEventListener("touchstart", (e) => setTargetFromX(e.touches[0].clientX), { passive: true });
  hero.addEventListener("touchmove", (e) => setTargetFromX(e.touches[0].clientX), { passive: true });

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  requestAnimationFrame(tick);

  /* ---- Frame extraction ------------------------------------------------- */

  const video = document.createElement("video");
  video.src = video.canPlayType('video/webm; codecs="vp9"') ? VIDEO_WEBM : VIDEO_MP4;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.setAttribute("aria-hidden", "true");
  // Kept in the DOM (but invisible) so browsers keep presenting frames to it.
  video.style.cssText =
    "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;";
  document.body.appendChild(video);

  // Scratch canvas: copies the current video frame synchronously at the
  // target size, then gets turned into an ImageBitmap.
  const scratch = document.createElement("canvas");
  const scratchCtx = scratch.getContext("2d");

  const once = (el, type) => new Promise((resolve) => el.addEventListener(type, resolve, { once: true }));

  /* ---- Loader ----------------------------------------------------------- */

  const loader = document.getElementById("loader");
  const loaderFill = document.getElementById("loaderFill");
  const loaderPct = document.getElementById("loaderPct");
  const loaderBar = loaderFill && loaderFill.parentElement;
  let loadedCount = 0;

  function updateLoader() {
    if (!loader) return;
    const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
    loaderFill.style.transform = `scaleX(${loadedCount / FRAME_COUNT})`;
    loaderPct.textContent = `${pct}%`;
    loaderBar.setAttribute("aria-valuenow", pct);
  }

  function hideLoader() {
    if (loader) loader.classList.add("is-done");
  }

  function captureFrame(slot) {
    scratchCtx.drawImage(video, 0, 0, scratch.width, scratch.height);
    return createImageBitmap(scratch).then((bitmap) => {
      if (frames[slot]) {
        bitmap.close();
        return;
      }
      frames[slot] = bitmap;
      loadedCount++;
      updateLoader();
    });
  }

  // Browsers pause (or stall) video in background tabs, so only extract
  // while the page is visible.
  function whenVisible() {
    if (!document.hidden) return Promise.resolve();
    return new Promise((resolve) => {
      const check = () => {
        if (document.hidden) return;
        document.removeEventListener("visibilitychange", check);
        resolve();
      };
      document.addEventListener("visibilitychange", check);
    });
  }

  // Pass 1: play through at speed, grabbing each presented frame into the
  // slot that matches its media time. Resolves "done", "hidden" (the page was
  // hidden mid-run, so it doesn't count) or "failed" (playback refused).
  function playthrough(endTime) {
    return new Promise((resolve) => {
      const pending = [];
      const claimed = new Set();
      let done = false;

      const finish = (result = "done") => {
        if (done) return;
        done = true;
        clearTimeout(safety);
        video.removeEventListener("ended", onEnded);
        video.removeEventListener("pause", onPause);
        video.pause();
        Promise.all(pending).then(() => resolve(result));
      };
      const onEnded = () => finish();
      const onPause = () => finish(document.hidden ? "hidden" : "done");

      const onFrame = (_now, meta) => {
        if (done) return;        const slot = Math.min(
          FRAME_COUNT - 1,
          Math.max(0, Math.round((meta.mediaTime / endTime) * (FRAME_COUNT - 1)))
        );
        if (!frames[slot] && !claimed.has(slot)) {
          claimed.add(slot);
          pending.push(captureFrame(slot));
        }
        if (meta.mediaTime >= endTime) finish();
        else video.requestVideoFrameCallback(onFrame);
      };

      // Guard against a stalled playthrough.
      const safety = setTimeout(
        () => finish(document.hidden ? "hidden" : "done"),
        (endTime / PLAYBACK_RATE) * 1000 + 4000
      );

      video.currentTime = 0;
      once(video, "seeked").then(() => {
        // The first frame is already presented before playback starts, so
        // requestVideoFrameCallback never reports it: grab it now.
        if (!frames[0]) {
          claimed.add(0);
          pending.push(captureFrame(0));
        }
        video.playbackRate = PLAYBACK_RATE;
        video.requestVideoFrameCallback(onFrame);
        video
          .play()
          .then(() => {
            video.addEventListener("ended", onEnded);
            video.addEventListener("pause", onPause);
          })
          .catch(() => finish(document.hidden ? "hidden" : "failed"));
      });
    });
  }

  // Pass 2: seek only to the slots that are still empty.
  async function fillMissing(endTime) {
    for (let slot = 0; slot < FRAME_COUNT; slot++) {
      if (frames[slot]) continue;
      await whenVisible();
      video.currentTime = (slot / (FRAME_COUNT - 1)) * endTime;
      await once(video, "seeked");
      await captureFrame(slot);
    }
  }

  async function extractFrames() {
    if (video.readyState < 1) await once(video, "loadedmetadata");

    const scale = Math.min(1, MAX_FRAME_SIDE / Math.max(video.videoWidth, video.videoHeight));
    scratch.width = Math.round(video.videoWidth * scale);
    scratch.height = Math.round(video.videoHeight * scale);

    const endTime = Math.max(0, video.duration - END_MARGIN);

    if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
      let runs = 0;
      while (runs < CAPTURE_RUNS && frames.includes(null)) {
        await whenVisible();
        const result = await playthrough(endTime);        if (result === "failed") break;
        if (result === "done") runs++;
      }
    }
    await fillMissing(endTime);

    video.pause();
    video.removeAttribute("src");
    video.load();
    video.remove();
  }

  extractFrames()
    .catch((err) => console.error("Hero video scrub failed:", err))
    .finally(hideLoader);
}

/* ==========================================================================
   Marquee
   ========================================================================== */

const MARQUEE_SPEED = 60; // px per second
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const marqueeRows = [...document.querySelectorAll(".marquee__row")];

if (marqueeRows.length && !reduceMotion) {
  const rows = marqueeRows.map((row) => {
    const track = row.querySelector(".marquee__track");
    const group = track.querySelector(".marquee__group");
    return {
      track,
      group,
      dir: row.classList.contains("marquee--reverse") ? 1 : -1,
      width: 0,
      offset: 0,
    };
  });

  // Clone the group until the track covers the row plus one extra group,
  // so wrapping by one group width is seamless.
  function measureMarquee() {
    for (const r of rows) {
      r.track.querySelectorAll(".marquee__group[data-clone]").forEach((c) => c.remove());
      r.width = r.group.getBoundingClientRect().width;
      if (!r.width) continue;
      const needed = Math.ceil(r.track.parentElement.offsetWidth / r.width) + 1;
      for (let i = 0; i < needed; i++) {
        const clone = r.group.cloneNode(true);
        clone.dataset.clone = "";
        r.track.appendChild(clone);
      }
      r.offset %= r.width;
    }
  }

  let visible = true;
  let boost = 0;
  let lastScrollY = window.scrollY;
  let lastTime = performance.now();

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }).observe(marqueeRows[0].closest(".marquee"));

  function marqueeTick(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // Scroll velocity (px/s) adds a smoothed speed boost.
    const scrollY = window.scrollY;
    const velocity = dt > 0 ? Math.abs(scrollY - lastScrollY) / dt : 0;
    lastScrollY = scrollY;
    const boostTarget = Math.min(velocity * 0.4, 900);
    boost += (boostTarget - boost) * 0.08;

    if (visible) {
      const step = (MARQUEE_SPEED + boost) * dt;
      for (const r of rows) {
        if (!r.width) continue;
        r.offset = (r.offset + step) % r.width;
        // Left-moving rows go 0 → -width; right-moving rows go -width → 0.
        const x = r.dir < 0 ? -r.offset : r.offset - r.width;
        r.track.style.transform = `translate3d(${x}px, 0, 0)`;
      }
    }
    requestAnimationFrame(marqueeTick);
  }

  measureMarquee();
  document.fonts.ready.then(measureMarquee);
  window.addEventListener("resize", measureMarquee);
  requestAnimationFrame(marqueeTick);
}

/* ==========================================================================
   Work: horizontal scroll
   ========================================================================== */

const work = document.getElementById("work");
const workTrack = document.getElementById("workTrack");

if (work && workTrack) {
  const workProgress = document.getElementById("workProgress");
  const workCurrent = document.getElementById("workCurrent");
  const cards = [...workTrack.querySelectorAll(".project")];
  let distance = 0;

  function measureWork() {
    distance = Math.max(0, workTrack.scrollWidth - window.innerWidth);
    work.style.height = `${distance + window.innerHeight}px`;
    updateWork();
  }

  function updateWork() {
    const top = work.getBoundingClientRect().top;
    const progress = distance ? Math.min(Math.max(-top / distance, 0), 1) : 0;

    workTrack.style.transform = `translate3d(${-progress * distance}px, 0, 0)`;
    workProgress.style.width = `${progress * 100}%`;

    // Current project = the card closest to a reference point that travels
    // from the left edge (progress 0) to the right edge (progress 1), so the
    // first and last cards both get counted. offsetLeft is measured from the
    // sticky panel, so add the track's shift.
    const center = window.innerWidth * progress + progress * distance;
    let current = 0;
    let best = Infinity;
    cards.forEach((card, i) => {
      const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      if (d < best) {
        best = d;
        current = i;
      }
    });
    workCurrent.textContent = String(current + 1).padStart(2, "0");
  }

  window.addEventListener("scroll", updateWork, { passive: true });
  window.addEventListener("resize", measureWork);
  document.fonts.ready.then(measureWork);
  measureWork();
}

/* ==========================================================================
   Nav: dark variant over light sections
   ========================================================================== */

const nav = document.querySelector(".nav");
const lightSections = [...document.querySelectorAll('[data-nav="light"]')];

if (nav && lightSections.length) {
  let navQueued = false;

  function updateNav() {
    navQueued = false;
    const navRect = nav.getBoundingClientRect();
    const y = navRect.top + navRect.height / 2;
    const overLight = lightSections.some((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= y && rect.bottom >= y;
    });
    nav.classList.toggle("nav--dark", overLight);
  }

  function queueNav() {
    if (navQueued) return;
    navQueued = true;
    requestAnimationFrame(updateNav);
  }

  window.addEventListener("scroll", queueNav, { passive: true });
  window.addEventListener("resize", queueNav);
  updateNav();
}

/* ==========================================================================
   Cursor image trail
   ========================================================================== */

const SPACING = 90; // px of pointer travel between images
const LIFETIME = 1150; // ms each image lives (pop 260 → hold → shrink 450)
const TRAIL_MAX_PER_MOVE = 6;
const TRAIL_IMAGES = [1, 2, 3, 4].map((n) => `assets/trail/c${n}.webp`);

const trail = document.getElementById("trail");

if (trail) {
  // Preload so the first images don't pop in blank.
  TRAIL_IMAGES.forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  let pressed = false;
  let imageIndex = 0;
  let lastX = 0;
  let lastY = 0;

  const random = (min, max) => min + Math.random() * (max - min);

  function spawn(x, y, dirX = 0, dirY = 0) {
    const img = document.createElement("img");
    img.src = TRAIL_IMAGES[imageIndex];
    img.alt = "";
    img.decoding = "async";
    imageIndex = (imageIndex + 1) % TRAIL_IMAGES.length;

    const width = random(110, 180);
    const tilt = random(-20, 20);
    const spin = tilt < 0 ? -18 : 18; // keeps rotating the way it leans
    // Nudge slightly in the direction of travel.
    img.style.width = `${width}px`;
    img.style.left = `${x + dirX * 14}px`;
    img.style.top = `${y + dirY * 14}px`;
    trail.appendChild(img);

    const t = (dy, rot, scale) =>
      `translate(-50%, -50%) translateY(${dy}px) rotate(${rot}deg) scale(${scale})`;

    const anim = img.animate(
      [
        { offset: 0, transform: t(0, tilt, 0), opacity: 1, easing: "cubic-bezier(0.34, 1.7, 0.64, 1)" },
        { offset: 260 / LIFETIME, transform: t(0, tilt, 1), opacity: 1, easing: "ease-out" },
        { offset: 700 / LIFETIME, transform: t(0, tilt + spin * 0.15, 0.94), opacity: 1, easing: "cubic-bezier(0.55, 0, 0.75, 0.2)" },
        { offset: 1, transform: t(40, tilt + spin, 0.1), opacity: 0 },
      ],
      { duration: LIFETIME, fill: "forwards" }
    );
    anim.onfinish = () => img.remove();
  }

  function endTrail() {
    if (!pressed) return;
    pressed = false;
    document.body.classList.remove("is-trailing");
  }

  window.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    pressed = true;
    lastX = e.clientX;
    lastY = e.clientY;
    document.body.classList.add("is-trailing");
    spawn(lastX, lastY);
  });

  window.addEventListener("pointermove", (e) => {
    if (!pressed) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const dist = Math.hypot(dx, dy);
    const steps = Math.floor(dist / SPACING);
    if (!steps) return;

    const dirX = dx / dist;
    const dirY = dy / dist;
    // Fast strokes: spread at most TRAIL_MAX_PER_MOVE images evenly up to the cursor.
    const count = Math.min(steps, TRAIL_MAX_PER_MOVE);
    const step = steps > TRAIL_MAX_PER_MOVE ? dist / count : SPACING;

    for (let i = 1; i <= count; i++) {
      spawn(lastX + dirX * step * i, lastY + dirY * step * i, dirX, dirY);
    }
    lastX += dirX * step * count;
    lastY += dirY * step * count;
  });

  window.addEventListener("pointerup", endTrail);
  window.addEventListener("pointercancel", endTrail);
  window.addEventListener("blur", endTrail);
}
