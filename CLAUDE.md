# kousenit.com — project notes for Claude

Ken Kousen's personal website (https://www.kousenit.com), built with **Hugo Blox** and hosted on **Cloudflare Pages**.

## Where to start
- Project memories: `~/.claude/projects/-Users-kennethkousen-Documents-hugo-apps-kousenit/memory/`
- `.claude/MIGRATION_PLAN.md` — historical record of the 2026 Heroku→Cloudflare migration (now complete). Read it for context on how the infra got here; the only open item is the optional Phase 13 registrar transfer.

## Key facts not derivable from code

- **Hosting / deploy**: **Cloudflare Pages**, which auto-builds on every push to the **`main`** branch (production) and builds previews for other branches. There is no manual deploy step — `git push github main` ships it. DNS is on Cloudflare too. *(Heroku was retired 2026-06-07; the bill is $0.)*
- **Theme**: **Hugo Blox `academic-cv`** template, pulled in as Go modules — see `go.mod` (`github.com/HugoBlox/kit/...`). This is an actively maintained theme; updates come via the module versions, not a vendored copy. Build tooling also uses npm (`package.json`), which is why **Dependabot** opens dependency PRs.
- **Hugo version**: Cloudflare Pages builds with a modern Hugo (local dev here is 0.162 extended). Pages uses its own build config / `HUGO_VERSION`, **not** the leftover `netlify.toml` (an academic-cv template artifact that Pages ignores).
- **Cloudflare API access**: the Cloudflare API MCP (`mcp__plugin_cloudflare_cloudflare-api__*`) must be re-authenticated each session (OAuth doesn't persist). Pages project name `kousenit`, zone ID `77fa387dccdb61de98eb8de8c54b8675`, account `612d35857ad57160f86b64091b4d6030`.

## Content map (where to edit things)

- **Bio / name / role / links / education / experience / awards**: `data/authors/me.yaml`. The homepage avatar is `assets/media/authors/me.png` (Hugo smart-crops it to a circle).
- **Site config** (title, menus, theme mode, fonts): `config/_default/*.yaml`. Theme appearance is `params.yaml` → `theme.mode` (currently `system` — follows the visitor's OS; a manual toggle is also shown).
- **Homepage**: `content/_index.md` — a list of Hugo Blox section blocks. ⚠️ The **Books grid, Education cards, and Interest pills are hand-rolled HTML-in-markdown** (raw Tailwind classes), not data-driven. Adding a book means copy-pasting an `<a>` block that links to `/publications/<slug>/featured.jpeg`.
- **Books**: one page bundle per book under `content/publications/<slug>/` (`index.md` + `featured.jpeg`). Slugs: `mockito-made-clear`, `help-your-boss-help-you`, `kotlin-cookbook`, `modern-java-recipes`, `gradle-recipes-for-android`, `making-java-groovy`. Publishers: Pragmatic Bookshelf (Mockito, Help Your Boss), Amazon (Kotlin Cookbook, Modern Java Recipes, Gradle Recipes), Manning (Making Java Groovy).
- **Custom CSS overrides**: `layouts/_partials/hooks/head-end/custom-styles.html` (e.g. the homepage section-spacing tweaks live here).

## Design direction

Site leans **light-hearted / playful**; a full redesign is planned later. See the `kousenit.com design direction` memory. Until the redesign, don't propose changes that clash with the playful tone. The author avatar was updated 2026-06-07 to a casual photo (`~/Pictures/me/me_jun2025.png`); the "serious fedora" portrait (`me_portrait_gpt_image_2_apr2026.png`) remains earmarked for the future redesign, not the current site.

## External resources
- Existing Anthropic-API-calling Worker (starting point for the planned/deferred chatbot Worker — see MIGRATION_PLAN.md Phase 11): `kousen/wwbs` — private GitHub repo, Ken's account. See `worker.js` for the pattern.
