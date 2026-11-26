// Live pixel-art emblems: plays a pixelfx effect (site/pixelfx/, vendored, MIT) on a canvas, recoloured to
// the current theme. Used by the project viewer (terminal.js) and the 404 page.
//
// Contract:
//   * Progressive: every emblem also exists as a baked loop and a still (scripts/build-emblems.mjs). This
//     module only draws over them. If it fails to load, or the visitor asked for reduced motion, or the
//     theme is light (additive glow needs a dark ground), the baked picture simply stays.
//   * Lazy: pixelfx (about 150 KB of modules) is imported on the first mount, never at page load.
//   * Cheap: one canvas at the effect's own pixel size, stepped at the effect's frame rate, and stopped
//     while the canvas is off screen or the tab is hidden.
// The layout maths (origin, spare height above the floor line) mirrors scripts/build-emblems.mjs so the
// live picture lands exactly on the baked one.

const BASE = new URL("./pixelfx/src/", import.meta.url);
const hexOf = (value) => {
  const probe = document.createElement("canvas").getContext("2d");
  probe.fillStyle = value;
  return probe.fillStyle; // normalised to #rrggbb
};
const mix = (a, b, t) => "#" + [1, 3, 5].map((k) => Math.round(parseInt(a.slice(k, k + 2), 16) * (1 - t) + parseInt(b.slice(k, k + 2), 16) * t).toString(16).padStart(2, "0")).join("");

// pixelfx palettes are 8-step ramps, dark to bright. Built from one colour the way the hand-made ramps in
// scripts/build-emblems.mjs are: five steps up from black, the colour itself at step six, one tint, white.
// Putting the colour any lower makes the upper half of the ramp near-white and the picture washes out.
export function ramp(color) {
  const c = hexOf(color);
  return [...[0.09, 0.22, 0.4, 0.62, 0.85].map((t) => mix("#000000", c, t)), c, mix(c, "#ffffff", 0.55), "#ffffff"];
}

export const canPlay = () => !matchMedia("(prefers-reduced-motion: reduce)").matches && document.documentElement.style.colorScheme !== "light";

// host: a positioned element the canvas fills. effect: a pixelfx id such as "scifi/hologram".
// color: any CSS colour. size: [w, h] in effect pixels. Resolves to { destroy() }, or null if it will not play.
export async function mountFx(host, { effect, color, size = [192, 108] }) {
  if (!canPlay() || !/^[a-z-]+\/[a-z-]+$/.test(effect)) return null;
  const [core, mod] = await Promise.all([import(new URL("core/index.js", BASE).href), import(new URL(`fx/${effect}.js`, BASE).href)]);
  const [W, H] = size;
  const meta = { fps: 30, ...mod.meta };
  const ox = Math.round((W - meta.size[0]) / 2) + meta.origin[0];
  const oy = H - (meta.size[1] - meta.origin[1]);
  const frame = core.createFrame(W, H);
  const inst = core.createFx(mod, { x: ox, y: oy, palette: ramp(color) });
  const actor = meta.actor ? inst.options.actor ?? core.stockActor() : null;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  canvas.className = "fx-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const g = canvas.getContext("2d");
  const image = g.createImageData(W, H);
  host.append(canvas);

  const step = 1 / meta.fps;
  let raf = 0;
  let last = 0;
  let owed = step;
  let visible = true;
  let live = true;

  function draw() {
    core.clearFrame(frame);
    inst.draw(frame, "back");
    if (actor) core.drawActor(core.painterFor(frame).place(ox, oy, false), actor, core.actorAlphaOf(mod, inst.t % meta.duration, inst.options));
    inst.draw(frame, "front");
    core.composite(frame, image.data, null);
    g.putImageData(image, 0, 0);
  }

  function tick(now) {
    raf = 0;
    if (!live) return;
    owed += Math.min(0.1, last ? (now - last) / 1000 : step);
    last = now;
    if (owed >= step) {
      // After a pause, do not replay the gap: advance at most two steps.
      const n = Math.min(2, Math.floor(owed / step));
      for (let k = 0; k < n; k++) inst.update(step);
      owed %= step;
      draw();
    }
    if (visible && !document.hidden) raf = requestAnimationFrame(tick);
  }

  const wake = () => {
    if (live && visible && !document.hidden && !raf) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    wake();
  });
  observer.observe(canvas);
  document.addEventListener("visibilitychange", wake);
  draw();
  wake();

  return {
    destroy() {
      live = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", wake);
      canvas.remove();
    },
  };
}
