# kousenit.com — Migration + Chatbot Plan

**Drafted:** 2026-04-19
**Last updated:** 2026-04-25
**Status:** Planning complete; small content/cleanup work shipped; major migration phases still pending.

---

## Context at plan time

### Current state of this repo
- Hugo site deployed on Heroku via the `roperzh/heroku-buildpack-hugo`.
- Theme: `raditian-free-hugo-theme` (Radity). Upstream is abandoned; local HEAD (`a25af74`) already matches origin/master.
- Theme is tracked as a **broken gitlink** at `themes/raditian-free-hugo-theme` (mode `160000`) with **no `.gitmodules` file**. Works on Heroku only because `.hugotheme` tells the buildpack to clone the URL at build time.
- No JS (`package.json`), no Go modules, no other dependency manifests. "Dependencies" here really means Hugo + theme + buildpack.
- Hugo version is not pinned in the repo — whatever the Heroku buildpack grabs.
- Dependabot alerts from a prior stale `package.json` are all auto-resolved ("state: fixed") — no live vulnerabilities.

### Completed (2026-04-19 session — repo plumbing)
- Git remote fixed: was Heroku-only, now tracks `github/main` (with `heroku` remote retained as manual escape hatch).
- GitHub default branch renamed `master` → `main`; old `master` deleted.
- Heroku GitHub integration active: auto-deploys from `github/main`.
- `public/` and `.hugo_build.lock` added to `.gitignore`; IDE files (`.idea/*`) untracked.
- Confirmed `HUGO_VERSION=0.69.0` already pinned in Heroku config vars (pre-existing — explains site stability).
- Two pipeline deploys validated end-to-end.

### Completed (2026-04-25 session — content + cleanup, while on Heroku)
- **Book covers replaced** with AI-generated cute-animal images. Each book section now shows the corresponding animal reading the book (otter/Kotlin Cookbook, koala/Mockito Made Clear, cat/Help Your Boss Help You, sambar/Modern Java Recipes, hedgehog/Gradle Recipes for Android, red panda/Making Java Groovy). Resized to 600px @1x / 1200px @2x JPEGs (q85). Original `*_cover_*.jpeg` files retained on disk for rollback.
- Kotlin Cookbook image is intentionally landscape — shows otter on shore with the other 5 books in view; deliberate visual variety.
- **HYBHY link fixed** to point to Pragmatic Bookshelf (`pragprog.com/titles/kkmanage/help-your-boss-help-you/`) — button text already said "Pragmatic Programmers" but URL went to Amazon.
- **Trinity College roles added** to Experience section — two concurrent appointments since July 2024 (Professor of the Practice in CS; Associate Director for STEM Initiatives, Elting Innovation and Entrepreneurship Center).
- Section description updated from "Technical Trainer, Software Developer, Research Scientist" to "Educator, Technical Trainer, Software Developer".

### Notes for future sessions
- Ken's "Associate Director for STEM Initiatives" title is expected to change to "Director, Hartford AI Center" at some future date (also saved in memory).
- A new portrait photo (`~/Pictures/me/me_portrait_gpt_image_2_apr2026.png`) exists and is a strong image — fedora, dark moody studio background, serious gaze. **Deliberately NOT swapped into the current site** because its tone clashes with the playful cute-animals direction. Earmark for the future redesign.
- Ken explicitly confirmed (2026-04-25): "looking for a more light-hearted approach, and eventually will probably do a full redesign." This validates the cute-animals direction and tells us the next major visual refresh will be holistic, not incremental.

### Target state
- Hugo site on **Cloudflare Pages** (free tier, auto-deploy from GitHub, native Hugo support).
- A **chatbot Worker** extending the pattern in `kousen/wwbs` (private repo) to answer "should we work together?" — using a system prompt built from Ken's bio + engagement preferences.
- Heroku retired.

---

## Reference: existing Worker pattern (`kousen/wwbs/worker.js`)

Already reviewed. Key points the chatbot Worker should inherit:
- POST endpoint, CORS-locked via origin allowlist (currently `kousen.github.io` + localhost).
- Client sends `{system, messages, model?, max_tokens?}`, Worker forwards to Anthropic `/v1/messages`.
- `ANTHROPIC_API_KEY` as a Worker secret via `wrangler secret put`.
- Default model `claude-sonnet-4-6`.
- No streaming, no prompt caching yet.
- No `wrangler.toml` in the repo (deploys likely via dashboard or untracked local config).

Key changes for the chatbot Worker vs. the wwbs pattern:
- **Server owns the system prompt** — do NOT accept `system` from the client (security).
- Add **prompt caching** on the system prompt.
- Add `kousenit.com` to CORS allowlist.
- Add **streaming** (SSE) so chat feels responsive.
- Add **rate limiting** via Cloudflare's built-in.

---

## Cloudflare MCP servers to install (recommended before Phase 2)

All remote, SSE-based, no install beyond adding URLs to MCP client config. **Verify URLs at `developers.cloudflare.com/agents/model-context-protocol/` before adding — endpoints can move.**

| Server | URL | Why |
|---|---|---|
| Cloudflare Docs | `https://docs.mcp.cloudflare.com/sse` | Current Pages/Workers docs; avoids stale training data |
| Workers Bindings | `https://bindings.mcp.cloudflare.com/sse` | Provision KV/R2/D1 via prompts (useful if chatbot persistence is added later) |
| Workers Builds | `https://builds.mcp.cloudflare.com/sse` | Build logs without leaving Claude Code |
| Observability | `https://observability.mcp.cloudflare.com/sse` | Live Worker analytics/logs post-launch |

**Minimum for this project:** Docs + Bindings. Others become useful after launch.

No Cloudflare-specific Skill is known to exist. Wrangler CLI + these MCP servers cover the workflow.

---

## Phase 1 — Hosting migration to Cloudflare Pages

**Goal:** kousenit.com served by Pages, Heroku retired.

### 1.1 Fix repo hygiene (required — Pages won't rescue this like Heroku did)
- Resolve the broken gitlink at `themes/raditian-free-hugo-theme`. Two options:
  - **(A) Vendor-in** — remove gitlink, add theme files directly to repo. Recommended for an abandoned upstream; simpler; no clone step needed.
  - **(B) Proper submodule** — add `.gitmodules` pointing at `https://github.com/radity/raditian-free-hugo-theme` and pin to `a25af74`. Keeps history traceable but adds a clone step.
- Decide and pin Hugo version (e.g., `HUGO_VERSION` env var in Pages, or `.tool-versions` file).

### 1.2 Create Pages project
- Connect to `kousen/kousenit` GitHub repo, branch `main`.
- Build command: `hugo --minify` (or `hugo --gc --minify`).
- Output directory: `public`.
- Env vars: `HUGO_VERSION` pinned.

### 1.3 Verify preview
- Check `kousenit.pages.dev` (or whatever subdomain Pages assigns).
- Visual diff vs. current kousenit.com.
- Check key pages: home, category pages, any custom static content under `/static/`.

### 1.4 DNS cutover
- Add `kousenit.com` + `www.kousenit.com` as custom domains in Pages.
- If registrar NS records aren't already pointed at Cloudflare, update them.
- Confirm SSL provisioning completes.

### 1.5 Parallel-run
- Leave Heroku running ~48h as rollback.
- Monitor Pages analytics for 404s, build failures.

### 1.6 Retire Heroku
- Disconnect GitHub integration on Heroku.
- Archive or delete the `kousenit` Heroku app.
- Remove `heroku` git remote locally.
- Delete `.hugotheme` (buildpack-specific, no longer needed).

---

## Phase 2 — Chatbot backend Worker

**Goal:** An endpoint the site can call to ask "should we work together?" questions.

### 2.1 Decide repo layout (see open question #3 below)
- **(a)** Add endpoint to existing `wwbs` Worker.
- **(b)** New repo `kousenit-chat`.
- **(c)** `worker/` subdirectory in the `kousenit` Hugo repo. **Recommended** — site + bot ship together, Pages ignores non-Hugo dirs.

### 2.2 Design the system prompt (the non-delegatable part)
Ken writes this, Claude can help refine. Must include:
- Professional bio & specialties (Java, Spring, Kotlin, Groovy, Android, AI/LLM, reactive, etc.).
- Teaching/consulting engagement types accepted (training, consulting, conference talks, video production).
- Engagements *not* accepted (so the bot doesn't over-commit).
- Tone guidance (direct, warm, plain-language — match Ken's voice).
- Guardrails for off-topic or out-of-scope questions.
- Disclosure that it's an AI, not Ken personally.

### 2.3 Implement the Worker (extend `wwbs/worker.js` pattern)
- Endpoint `/ask` (POST).
- Server constructs system prompt, client only sends messages.
- Prompt caching on the system prompt (`cache_control: {type: "ephemeral"}` on the system block).
- CORS allowlist includes `kousenit.com`, `www.kousenit.com`, localhost for dev.
- Streaming enabled (`stream: true` to Anthropic, SSE response to client).
- Rate limit via Cloudflare's built-in rate limiter (e.g., 20 req/min per IP).
- `ANTHROPIC_API_KEY` via `wrangler secret put`.
- `wrangler.toml` committed this time (unlike wwbs).

### 2.4 Deploy
- Custom route — e.g., `chat.kousenit.com/ask` or `kousenit.com/api/ask` (Pages Functions can also handle this if we want to avoid a separate Worker route).

---

## Phase 3 — Chatbot UI on the Hugo site

**Goal:** Visitors can actually use the bot.

### 3.1 Placement (see open question #4 below)
- Dedicated page at `/chat/` linked from contact section.
- Modal triggered from a button in the showcase/about section.
- Floating widget bottom-right, site-wide.

### 3.2 Implementation
- Vanilla JS in `static/js/chat.js` (no framework).
- Hugo partial at `layouts/partials/chat.html`.
- Styles in `static/css/chat.css` matching Raditian theme colors.
- Streaming token-by-token rendering.
- In-memory conversation state only — no persistence, no auth, no cookies. Keeps GDPR trivial.
- Clear AI disclosure at top of widget.

---

## Open questions (answer before implementation)

1. **Theme handling:** vendor-in (recommended) or proper submodule at `a25af74`?
2. **Hugo version:** pin to latest stable (currently ~0.140+), or test an upgrade first to catch deprecations?
3. **Worker home:** option (c) — `worker/` in this repo? Or a separate repo?
4. **Chatbot UI placement:** dedicated page, modal, or floating widget?
5. **Bot scope:** strictly "should we work together" Q&A, or also general tech authority questions (Java/Spring/Kotlin)?

---

## Suggested implementation sequence

1. Phase 1.1 alone (~1 hr) — fix gitlink + pin Hugo. Independently valuable; unblocks everything.
2. Phases 1.2–1.6 (~1-2 hr) — Pages project, cutover, Heroku retire.
3. Phase 2.2 — system prompt design conversation. Longest thinking piece.
4. Phases 2.3–2.4 (~1-2 hr) — Worker implementation.
5. Phase 3 (~1-2 hr) — UI.
