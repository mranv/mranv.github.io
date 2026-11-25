# mranv.github.io

The portfolio of Anubhav Gain, security software engineer: <https://mranv.github.io/>

- `/` is a canvas intro over real code from his repositories, with a README below it.
- `/site/` is a Neovim-style editor: work, projects, writing, stack, contribution calendar, eight themes.
  Keys: `j`/`k` move, `enter` opens, `:` runs a command (`:theme`, `:e work`, `:q`).

## Edit

Everything personal lives in `portfolio.config.json`.

```sh
node scripts/build-data.mjs                  # apply the config
node scripts/build-data.mjs --fetch-github   # also refresh GitHub stats, the code wall and blog posts
python3 serve.py 8190                        # preview at http://localhost:8190/
```

Pushing to `main` publishes the site. How the pieces fit, and what not to break, is in [AGENTS.md](AGENTS.md).

## Credits

Built on [dev-portfolio-template](https://github.com/pavanjoshi914/dev-portfolio-template) by Pavan Joshi.
Pixel-art emblems rendered with [pixelfx](https://github.com/patch-gg/pixelfx) (MIT).
Copy and layout reviewed with [unslop](https://github.com/heydamir/unslop) by Damir Sokolovsky (CC BY 4.0).
