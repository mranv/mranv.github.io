// Renders the pixel-art emblems (projects without a real screenshot, and the 404 page) with pixelfx,
// https://github.com/patch-gg/pixelfx (MIT). Each one is an existing pixelfx effect, recoloured to the
// site's Blackmoney palette and drawn on a wider 16:9 canvas so it fills the viewer frame without being cropped.
// The backdrop is a flat fill in the colour of the surface the picture sits on, not pixelfx's own scene:
// a picture with a different black and a hard edge reads as pasted on.
//
// Usage:  node scripts/build-emblems.mjs <path to a pixelfx checkout>     (needs ffmpeg on PATH)
// Output: <name>.webp (the loop, lossless animated WebP: about a third of the same GIF) and <name>.png
// (one still: the wheel tile, and what is shown instead of the loop under prefers-reduced-motion).
//
// The outputs are committed; rerun this only to change an emblem. pixelfx is not a dependency of the site.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PIXELFX = process.argv[2];
if (!PIXELFX) {
  console.error("usage: node scripts/build-emblems.mjs <path to a pixelfx checkout>");
  process.exit(1);
}
const load = (file) => import(pathToFileURL(path.resolve(PIXELFX, file)).href);
const core = await load("src/core/index.js");

// 8-step ramps, dark to bright, built around the Blackmoney theme's accent, function and number colours.
const GOLD = ["#140e04", "#33240c", "#5c4318", "#8f6a2a", "#c79a4c", "#e7c58a", "#f6e6c4", "#ffffff"];
const BLUE = ["#050c14", "#0d2233", "#184360", "#2c6c95", "#4d9cc8", "#8fd0ee", "#d2eefb", "#ffffff"];
const EMBER = ["#170804", "#3a140a", "#6b2412", "#a53c1f", "#dc6236", "#f0885b", "#fbcdb5", "#ffffff"];

// effect: pixelfx id. size: canvas in effect pixels (16:9). scale: integer upscale. still: time (s) of the PNG frame.
// bg: the surface behind it. PAGE is the theme background, FRAME the viewer frame (--line) in site/editor.css.
const PAGE = "#0b0b0a";
const FRAME = "#11110f";
const EMBLEMS = [
  // Krustron, one dashboard for many clusters: a projected, turning model.
  { out: "site/shots/krustron", effect: "scifi/hologram", size: [192, 108], scale: 3, still: 1.1, bg: FRAME, options: { palette: BLUE } },
  // Convoy, a whole autonomous system on one host: a core running inside its cage.
  { out: "site/shots/convoy", effect: "scifi/energy-core", size: [192, 108], scale: 3, still: 0.33, bg: FRAME, options: { palette: EMBER } },
  // 404: the answer is no. Tracers hit a shield and do not get through.
  { out: "assets/404", effect: "scifi/force-field", size: [224, 126], scale: 3, still: 0.7, bg: PAGE, options: { palette: GOLD } },
];

function render(mod, { size: [W, H], options, bg: fill }) {
  const meta = { fps: 30, bg: "dark", ...mod.meta };
  const [w0, h0] = meta.size;
  const [ox0, oy0] = meta.origin;
  // Centre horizontally; keep the effect's own floor line, with the spare height added above it.
  const ox = Math.round((W - w0) / 2) + ox0;
  const oy = H - (h0 - oy0);
  const frame = core.createFrame(W, H);
  const bg = new Uint32Array(W * H).fill(core.hex(fill));
  const inst = core.createFx(mod, { x: ox, y: oy, ...options });
  const actor = meta.actor ? inst.options.actor ?? core.stockActor() : null;
  const n = Math.round(meta.duration * meta.fps);
  const frames = [];
  for (let i = 0; i < n; i++) {
    if (i > 0) inst.update(1 / meta.fps);
    core.clearFrame(frame);
    inst.draw(frame, "back");
    if (actor) core.drawActor(core.painterFor(frame).place(ox, oy, false), actor, core.actorAlphaOf(mod, inst.t % meta.duration, inst.options));
    inst.draw(frame, "front");
    frames.push(core.composite(frame, new Uint8ClampedArray(W * H * 4), bg));
  }
  return { frames, fps: meta.fps };
}

// Nearest-neighbour upscale: pixel art must stay hard-edged.
function upscale(rgba, W, H, k) {
  const out = Buffer.alloc(W * k * H * k * 4);
  for (let y = 0; y < H * k; y++) {
    for (let x = 0; x < W * k; x++) {
      const s = ((y / k) | 0) * W * 4 + ((x / k) | 0) * 4;
      out.set(rgba.subarray(s, s + 4), (y * W * k + x) * 4);
    }
  }
  return out;
}

function ffmpeg(args, input) {
  const res = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], { input, maxBuffer: 1 << 30 });
  if (res.error || res.status !== 0) throw new Error(`ffmpeg failed: ${res.error || res.stderr}`);
}

for (const emblem of EMBLEMS) {
  const [W, H] = emblem.size;
  const k = emblem.scale;
  const { frames, fps } = render(await load(`src/fx/${emblem.effect}.js`), emblem);
  const raw = ["-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W * k}x${H * k}`, "-r", String(fps), "-i", "-"];
  const big = frames.map((f) => upscale(f, W, H, k));
  // Quantise to one 128-colour palette first: the glow's soft alpha otherwise makes thousands of near-identical
  // colours, and the lossless file comes out three times larger for no visible gain.
  const quantise = "split[a][b];[a]palettegen=max_colors=128:stats_mode=full[p];[b][p]paletteuse=dither=none";
  ffmpeg([...raw, "-vf", quantise, "-c:v", "libwebp_anim", "-lossless", "1", "-compression_level", "6", "-loop", "0", path.join(ROOT, `${emblem.out}.webp`)], Buffer.concat(big));
  const at = Math.min(frames.length - 1, Math.round(emblem.still * fps));
  ffmpeg([...raw.slice(0, 6), "-i", "-", "-frames:v", "1", path.join(ROOT, `${emblem.out}.png`)], big[at]);
  console.log(`wrote ${emblem.out}.webp ${emblem.out}.png  (${frames.length} frames, ${W * k}x${H * k})`);
}
