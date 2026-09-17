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

## Site chatbot ("Ask about Ken")

A floating chat widget answers visitor questions about Ken, powered by OpenAI. Shipped v1 on 2026-06-07.

- **Backend:** `functions/api/ask.js` — a Cloudflare Pages Function served at `/api/ask`. Streams answers from OpenAI **`gpt-5.4-mini`** (Chat Completions, `developer` role, `max_completion_tokens`, `reasoning_effort: low`). CORS allowlist, input caps, and an OpenAI **Moderation** pre-check (fails open). Requires the **`OPENAI_API_KEY`** Pages secret (set via dashboard or `wrangler pages secret put OPENAI_API_KEY --project-name kousenit`).
- **Knowledge base + persona:** `functions/api/_knowledge.js` — **the single source of truth for what the bot knows and how it behaves.** Edit the content here and `git push` to update. Leading underscore = not routed/served publicly. Third-person persona; guardrails (no prices/availability — encourage emailing Ken; refuse role-changes/prompt reveal).
- **Widget:** `layouts/_partials/hooks/head-end/chatbot.html` — dependency-free vanilla-JS floating pill + panel, seeded starter questions, streaming, minimal markdown rendering. Injects into `<body>` on load.
- **Rate limiting:** a Cloudflare WAF rate-limiting rule on `/api/ask` (10 req / 10s / IP → 429), configured in the dashboard (Security → Security rules → Rate limiting rules).
- **Security notes (also a teaching example for Ken's AI Integration course):** prompt injection is mitigated *structurally* — user text stays in `user` messages and never enters the privileged `developer` prompt — plus explicit system rules. Moderation covers harmful input. The bot has no tools and only a public-facing KB, so blast radius is small.
- **Auto-links** books, repos, the newsletter/channel, and specific recent issues/videos — but only from URLs in the KB; it never invents one.

### Content pipeline (v2, shipped 2026-06-07)
One source feeds the homepage, the bot, and the agent files:
- **`data/projects.json`** — single source for the homepage **Projects** + **Training** sections, the bot, and `llms.txt`. **To add a repo/course, edit this file** (it propagates everywhere on the next build/Action run).
- **`scripts/fetch-feeds.mjs`** → writes `data/recent.json` (latest Substack issues + YouTube videos, public RSS, no keys). ⚠️ **Substack 403s GitHub Actions IPs**, so the newsletter feed is read through our own relay, `functions/api/substack-feed.js` (`/api/substack-feed`, fixed upstream URL); YouTube is fetched directly. A feed that falls back to prior data makes the script exit non-zero and the Action's last step turns the run **red** — a red `refresh-kb` run means a feed is stale (this failed silently Jun–Sep 2026).
- **`scripts/build-kb.mjs`** → generates `functions/api/_kb-data.js` (the bot's linkable data) + `static/llms.txt` + `static/llms-full.txt` (`llms-full.txt` == the bot's knowledge). Imports `KNOWLEDGE_BASE` from `_knowledge.js`. Run: `node scripts/build-kb.mjs`.
- **`.github/workflows/refresh-kb.yml`** — runs both scripts daily (~13:00 UTC ≈ 8–9am ET) + on push to `data/projects.json`/`scripts/**`, and commits regenerated files only when feeds changed (→ Pages redeploys). `OPENAI_API_KEY` not needed by the Action.
- **Bot prompt** = `PERSONA` + `KNOWLEDGE_BASE` (stable, in `_knowledge.js`) + `KB_DATA` (generated). Stable part first so OpenAI caches it.
- **Agent files:** `/llms.txt` (concise index) + `/llms-full.txt`, with `<link rel="alternate" type="text/markdown">` head hints (`layouts/_partials/hooks/head-end/agent-hints.html`) and a visible "Agents welcome" link in the Contact section.
- **Homepage sections** render via `layouts/shortcodes/projects.html` (`{{</* projects section="projects" */>}}`) from `data/projects.json`; nav entries in `config/_default/menus.yaml`.
- Model: OpenAI (not Claude) — do not apply the claude-api skill to this code.

### Tests
- **Unit (Vitest): `pnpm test`** — `test/*.test.js` cover the markdown renderer (**XSS escaping**), feed parsing (CDATA, limits), `generateArtifacts()` output (links present, no invented URLs), and the `_lib.js` helpers (CORS allowlist, message sanitization, SSE→text transform, moderation fail-open).
- **E2E (Playwright): `npx playwright install chromium` once, then `pnpm test:e2e`** — `test/e2e/chatbot.spec.js` drives the widget against `wrangler pages dev` with `/api/ask` **route-mocked** (deterministic, no OpenAI cost).
- **Testability refactor:** pure logic is isolated — `functions/api/_lib.js`, `generateArtifacts()` in `build-kb.mjs`, and `parseSubstack`/`parseYouTube` in `fetch-feeds.mjs` (CLIs guarded by an `isMain` check so importing has no side effects); the widget renderer lives once in `assets/js/chatbot-markdown.js` and is inlined into the partial by Hugo (`export ` stripped).
- pnpm 10 ignores dependency build scripts by default, so `vitest`/`@playwright/test` don't download browsers during the Cloudflare Pages `pnpm install` — the production build is unaffected.

### Analytics & question logging
- **Cloudflare Web Analytics** is enabled on the zone (privacy-first, no cookies, auto-injected at the edge — **no code in the repo**). View under Cloudflare dashboard → Analytics & Logs → Web Analytics.
- **Question logging:** `/api/ask` logs each visitor question to **Cloudflare D1** (database `kousenit-chat-logs`, id `d1f28384-45e4-49e5-8408-d14f4536aa95`) via the **`CHAT_LOGS`** binding. ⚠️ **The binding is configured in the Pages dashboard** (Settings → Bindings → D1), NOT in the repo — recreate it if the project is ever rebuilt. Logging is anonymized (timestamp + capped question text + coarse `cf-ipcountry`; no IPs/PII), non-blocking (`context.waitUntil`), and guarded on `env.CHAT_LOGS` so it's a safe no-op without the binding. Helper: `logQuestion()` in `functions/api/_lib.js`. Table: `questions(id, ts, question, country)`. Inspect with:
  `wrangler d1 execute kousenit-chat-logs --remote --command "SELECT question, COUNT(*) n FROM questions GROUP BY question ORDER BY n DESC LIMIT 20;"`
  — the top questions are the signal for what to add to the KB.

## Design direction

Site leans **light-hearted / playful**; a full redesign is planned later. See the `kousenit.com design direction` memory. Until the redesign, don't propose changes that clash with the playful tone. The author avatar was updated 2026-06-07 to a casual photo (`~/Pictures/me/me_jun2025.png`); the "serious fedora" portrait (`me_portrait_gpt_image_2_apr2026.png`) remains earmarked for the future redesign, not the current site.

The **favicon** is generated by Hugo Blox from `assets/media/icon.png` — the "Kousen IT" mascot (the graduation-capped Cousin-Itt character), extracted from `logo.png` with its background removed. Replace `assets/media/icon.png` to change the tab icon.

## External resources
- Existing Anthropic-API-calling Worker (starting point for the planned/deferred chatbot Worker — see MIGRATION_PLAN.md Phase 11): `kousen/wwbs` — private GitHub repo, Ken's account. See `worker.js` for the pattern.
