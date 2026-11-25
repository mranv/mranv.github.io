# mranv.github.io

Anubhav Gain's portfolio and entity home, served by GitHub Pages at <https://mranv.github.io/>.
A static site with no build step at deploy time: a canvas intro (`/`), a Neovim-style editor (`/site/`)
and a static README on the root page that carries the same facts as readable HTML.
Based on [dev-portfolio-template](https://github.com/pavanjoshi914/dev-portfolio-template) by Pavan Joshi.

## Commands

| Task | Command |
|---|---|
| Apply `portfolio.config.json` (offline, seconds) | `node scripts/build-data.mjs` |
| Also refresh GitHub stats, code wall and blog posts (about 6 minutes, needs `gh` logged in) | `node scripts/build-data.mjs --fetch-github` |
| Preview | `python3 serve.py 8190` then open `http://localhost:8190/` and `/site/` |
| Syntax check | `for f in glimpse.js site/*.js scripts/*.mjs; do node --check "$f"; done` |
| Re-render the pixel-art emblems | `node scripts/build-emblems.mjs <pixelfx checkout>` (needs ffmpeg) |

There is no test suite and no linter. The check is: run the build, serve, open both pages, and confirm
the browser console is clean.

**Deploy:** pushing to `main` publishes the site. There is no staging branch.

## Structure

| Path | What it is |
|---|---|
| `portfolio.config.json` | The single source of every personal fact: identity, work, projects, credentials, SEO |
| `scripts/build-data.mjs` | Writes the config into HTML, JS constants, `site/content.json`, `llms.txt`, `sitemap.xml` |
| `scripts/seo.mjs` | Pure functions for `<head>`, JSON-LD, the README, the no-JS fallback, `llms.txt` |
| `index.html`, `glimpse.js`, `glimpse.css` | The intro: code wall on a canvas |
| `readme.css` | Styles for the static README below the intro |
| `site/` | The editor. `editor.js` is the entry; `content.json`, `stack.json`, `months.json` are generated |
| `site/shots/` | Project screenshots (from the projects' own repos) and two pixel-art emblems |
| `wall.json`, `wall.txt`, `github-snapshot.json`, `themes.json` | Generated data |
| `404.html` | Self-contained, absolute paths |

## Conventions

- Edit facts in `portfolio.config.json`, then run the build. Never edit a generated file or a generated
  region by hand.
- Generated regions are fenced with `<!-- name:start -->` and `<!-- name:end -->` (`seo`, `readme`,
  `static`). The build throws if a pair of markers is missing.
- Source constants the build owns are single `const NAME = ...;` lines: `MESSAGES` and `NOTE_TEXT`
  (`glimpse.js`), `OWNERS` (`site/terminal.js`), `INITIALS` (`site/blueprint.js`), `THEME_KEY` and
  `WORM_KEY` (`site/editor.js`). Their values must not contain `;`.
- Copy rules for anything a visitor reads: no exclamation marks, no claims that cannot be checked
  against a public source, sentence case, one date format per list.
- Commit `site/content.json` and the other generated files together with the config change that
  produced them.

## Landmines

- **The README on `/` is the SEO.** The intro is a canvas, so the `<article class="readme">` below it
  is the only readable content on the canonical URL. Do not move it behind `sr-only`, into `<noscript>`
  or onto another page. `glimpse.js` gives the wheel and the keyboard back to the page once
  `window.scrollY > 0`; remove that guard and readers can no longer scroll back up.
- **JSON-LD `@id`s are public anchors** (`#person`, `#profile`, `#website`, `#photo`). Other profiles
  and earlier crawls refer to them. Do not rename them.
- **`gh` can see private data.** It is logged in as one of the owner's accounts. `build-data.mjs`
  filters every repository to public (`publicOnly`, `isPrivate`) before writing. Keep those filters when
  adding a query. Check the diff of `site/months.json` and `wall.json` before committing an online run.
- **Two GitHub accounts are summed.** Commits co-authored by both count once per account, so the
  contribution total runs about 3% high. The per-month list takes the larger count per repository
  for the same reason.
- **The blog feed is third-party input.** Only title, link and date are kept, links must be on the
  blog's host, and `seo.mjs` escapes everything it writes.
- **Absolute paths.** Fonts, `/themes.json`, `/github-snapshot.json` and `/intros/shared/` are loaded
  from the site root. The site works at a user-site root, not under a project subpath.
- **`site/blueprint.js` `MARK`** is the letter outlines the contribution tree grows into. They must be
  closed shapes without holes inside the 88x80 box.
- **No backend.** The template's visitor counter (`/api/seen`) is removed and its graph is hidden in
  `site/editor.css`. `HAS_FACE` in `glimpse.js` gates the optional portrait layer; it is off because
  the three face files are not in the repo.
- **`404.html` repeats the Blackmoney colours by hand** so it has no dependency that could 404. Change
  them there too if the default theme changes.
- **`.nojekyll` must stay.** Without it GitHub Pages runs Jekyll over the repo and renders the
  Markdown files as pages.

## Credits

- Site design and code: dev-portfolio-template by Pavan Joshi.
- Pixel-art emblems (`site/shots/krustron.*`, `site/shots/convoy.*`, `assets/404.*`): rendered with
  [pixelfx](https://github.com/patch-gg/pixelfx) by Patch, MIT. See its `NOTICE.md` for the work it
  adapts from Hugo Duprez and Hollow Crown.
- The README and 404 page were reviewed against [unslop](https://github.com/heydamir/unslop) by
  Damir Sokolovsky (@heydamir), CC BY 4.0.
