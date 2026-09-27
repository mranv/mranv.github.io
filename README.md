# Living atlas

Personal site for Anubhav Gain. Act I is a walk. Act II is the map. The previous résumé site is in [`old/`](old/).

No build step. GitHub Pages serves the files at the root.

## Edit the life, not the layout

All of the words, colors, links, and the path live in [`js/content.js`](js/content.js).

- **Sentence, places, practices, tools, work, contact.** Change the strings in `person`, `places`, `practices`, `tools`, `earlier`, `hire`, and `contact`.
- **Colors.** Each walk sign has a `color`. That color is the mark on the map. The order you meet them becomes the strip under the opening sentence. Set `label` when two signs share a place name, so the strip can say Ahmedabad ’23 and Ahmedabad ’24.
- **Path.** `signs[].x` is the center of a sign, in pixels from the left of the world. `scenery[].x` is the left edge of a tree, pond, building, wire, rack, hill, or stone. `world.width` is the length of the path. `world.speed` is pixels per second.
- **The gate.** The sign with `gate: true` ends the walk and fades into the map. It is not a color.

## Change the character

The figure is two drawings, [`assets/walker-a.svg`](assets/walker-a.svg) and [`assets/walker-b.svg`](assets/walker-b.svg). The page swaps them while he walks. He stands at `left: 22%` of the stage (`.walker`).

The places on the path are the other files in `assets/`: `pond`, `reed`, `bush`, `tree`, `campus`, `wires`, `rack`, `stone`, and `gate`. `ridge.svg` and `ridge-far.svg` repeat along the whole path, so the land stays continuous. `favicon.svg` is the tab icon. `og.png` is the image used when the page is shared. Replace a file and keep its name if you want a different drawing.

## How the handoff works

Desktop shows the walk first. A and D, or the arrow keys, move him. On-screen buttons do the same if you hold them. A sideways swipe does it on a touch screen. Signs you pass are collected. The gate fades the path into the map.

The strip under the opening sentence says “in the order it was written” until you collect something. After that it says “collected while walking” and follows the order you actually found.

A viewport under 800px, or `prefers-reduced-motion`, opens the map first. “Walk the path” still opens the walk. Escape, or “Leave the path”, closes it.

## Files

- `index.html` — the page, the figure, and the skip link
- `css/atlas.css` — paper, ink, the path, the map
- `js/content.js` — everything you should edit
- `js/atlas.js` — walk and rendering
- `old/` — the previous site, still linked from the map
