# pixelfx (vendored)

An unmodified copy of part of [pixelfx](https://github.com/patch-gg/pixelfx) at commit `5294518`, MIT License
(see `LICENSE` and `NOTICE.md` here): `src/core/` and the three effects this site plays.

- Loaded only by `site/fx.js`, lazily, when an emblem is on screen. Nothing else imports it.
- Do not edit these files. To update, copy the same paths from a newer pixelfx checkout and change the
  commit above. To add an effect, copy its file (and any `_lib.js` it imports) into `src/fx/<category>/`.
