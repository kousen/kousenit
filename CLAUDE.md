# kousenit.com — project notes for Claude

A Hugo static site (Ken Kousen's personal website at https://www.kousenit.com).

## Where to start
- Active migration + chatbot plan: `.claude/MIGRATION_PLAN.md` — read this first if working on infrastructure or new features.
- Project memories: `~/.claude/projects/-Users-kennethkousen-Documents-hugo-apps-kousenit/memory/`

## Key facts not derivable from code

- **Hosting transition in progress**: site is on Heroku (auto-deploys from `github/main`), planned move to Cloudflare Pages — see migration plan.
- **Hugo 0.69.0 (April 2020)** is pinned via Heroku `HUGO_VERSION` config var. Don't bump silently — the theme is from the same era and template syntax may have drifted.
- **Theme**: `raditian-free-hugo-theme` (abandoned upstream at `a25af74`). Tracked as a broken gitlink with no `.gitmodules`; works on Heroku because `.hugotheme` triggers the buildpack to clone at build time. Will need to be vendored or made a proper submodule before Cloudflare Pages migration.

## Book abbreviation convention

Used in `static/img/books/` filenames:

| Abbr | Title | Publisher (linked from button) |
|---|---|---|
| `mmc` | Mockito Made Clear | Pragmatic Bookshelf |
| `hybhy` | Help Your Boss Help You | Pragmatic Bookshelf |
| `kcb` | Kotlin Cookbook | Amazon |
| `mjr` | Modern Java Recipes | Amazon |
| `gra` | Gradle Recipes for Android | Amazon |
| `mjg` | Making Java Groovy | Manning |

Current cover images are `*_cute.jpeg` / `*_cute@2x.jpeg` (AI-generated cute-animal scenes). Original commercial covers are at `*_cover_*.jpeg` — kept on disk for rollback but no longer referenced from `data/homepage.yml`.

## Design direction

Site is currently leaning **light-hearted / playful** (cute animals reading the books). Ken has confirmed a full redesign is planned later. Until that redesign:
- Don't propose changes that clash with the playful tone (e.g. swapping in dramatic/serious imagery).
- A new portrait photo exists at `~/Pictures/me/me_portrait_gpt_image_2_apr2026.png` — earmarked for the future redesign, not for the current site.

## External resources
- Existing Anthropic-API-calling Worker (referenced as starting point for the planned chatbot Worker): `kousen/wwbs` — private GitHub repo, Ken's account. See `worker.js` for the pattern.
