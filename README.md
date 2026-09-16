# kousenit.com

Ken Kousen's personal website — [www.kousenit.com](https://www.kousenit.com).

A static [Hugo](https://gohugo.io/) site built on the **Hugo Blox** *academic-cv*
template, deployed on **Cloudflare Pages**, with a built-in **AI chatbot** and an
**agent-friendly** content layer (`llms.txt`).

---

## Features

- **Static site** — bio, seven books (one in Early Release), projects/apps, AI-tool training
  materials, and contact, rendered by Hugo. Client-side search via Pagefind.
- **"Ask about Ken" chatbot** — a floating widget backed by a Cloudflare Pages
  Function (`/api/ask`) that streams answers from OpenAI, with the system prompt
  and knowledge base held server-side. It links to real books, repos, newsletter
  issues, and videos — and never invents a URL.
- **Self-updating knowledge** — a daily GitHub Action refreshes the bot's view of
  the latest newsletter issues and YouTube videos from public RSS feeds.
- **Agent-friendly** — `/llms.txt` (index) and `/llms-full.txt` (full reference,
  == the bot's knowledge) per [llmstxt.org](https://llmstxt.org), plus
  `<link rel="alternate" type="text/markdown">` hints in the page head.
- **Tested** — Vitest unit tests + Playwright end-to-end tests.
- **Observability** — Cloudflare Web Analytics (privacy-first, no cookies), and the chatbot logs each question to a Cloudflare D1 database (anonymized) so you can see what visitors ask.

## Tech stack

| Area | Tooling |
|---|---|
| Site generator | Hugo (extended) + Hugo Blox `academic-cv` (Go modules) |
| Styling / search | Tailwind CSS v4, Pagefind |
| Chatbot backend | Cloudflare Pages Function, OpenAI `gpt-5.4-mini` (streaming) |
| Package manager | pnpm |
| Tests | Vitest (unit), Playwright (e2e) |
| Hosting / DNS / registrar | Cloudflare (Pages + DNS + Registrar) |

## Local development

**Prerequisites:** Hugo **extended** (≥ 0.162), Node 20+, and [pnpm](https://pnpm.io/).

```bash
pnpm install

# Site only (fast, no chatbot backend):
pnpm dev                 # hugo server at http://localhost:1313

# Full site + chatbot backend (Pages Functions):
echo "OPENAI_API_KEY=sk-..." > .dev.vars   # gitignored; your OpenAI key
hugo --minify
pnpm exec wrangler pages dev public         # http://localhost:8788
```

Build for production: `pnpm build` (`hugo --minify` + Pagefind index).

## The chatbot

- **Backend:** `functions/api/ask.js` (served at `/api/ask`), with pure helpers in
  `functions/api/_lib.js`. Requires an `OPENAI_API_KEY` Pages secret in production.
- **Knowledge + persona:** `functions/api/_knowledge.js` is the stable, hand-edited
  source (persona, bio, guardrails). The linkable, frequently-changing part
  (`functions/api/_kb-data.js`) is **generated** — do not edit it by hand.

### Content pipeline (one source, many outputs)

`data/projects.json` is the single source of truth for the homepage **Projects** /
**Training** sections, the chatbot, and `llms.txt`. To add a repo or course, edit
that one file. Two scripts turn the data + feeds into the derived artifacts:

```bash
pnpm kb   # fetch-feeds.mjs (Substack + YouTube RSS -> data/recent.json)
          # then build-kb.mjs (-> _kb-data.js, llms.txt, llms-full.txt)
```

The **`.github/workflows/refresh-kb.yml`** Action runs this daily (and on changes to
`data/projects.json` / `scripts/`), committing only when the feeds changed.

## Tests

```bash
pnpm test                          # Vitest unit tests
pnpm test:watch                    # watch mode
npx playwright install chromium    # one-time, for e2e
pnpm test:e2e                      # Playwright (widget flows, /api/ask mocked)
```

Unit tests cover the markdown renderer's HTML-escaping, RSS/Atom parsing, the
KB/`llms.txt` generation, and the request helpers (CORS, sanitization, the SSE
stream transform, moderation fail-open).

## Deployment

Cloudflare Pages builds and deploys automatically on push to **`main`**
(production branch). The OpenAI key lives as the `OPENAI_API_KEY` Pages secret, and
a WAF rate-limiting rule protects `/api/ask`. DNS and the domain registration are
also on Cloudflare. See **[`DEPLOYMENT.md`](DEPLOYMENT.md)** for the hosting setup.

## Project structure

```
content/_index.md      Homepage section blocks (bio, books, projects, training, …)
data/projects.json     Single source for projects/training (site + bot + llms.txt)
data/authors/me.yaml   Bio, links, education, experience, awards
config/_default/        Hugo + Hugo Blox config (params, menus, modules)
layouts/                Custom partials & shortcodes (chat widget, projects cards)
assets/                 Logos, the favicon source (media/icon.png), widget JS
functions/api/          Cloudflare Pages Functions (the /api/ask chatbot)
scripts/                Feed fetcher + KB/llms generator
static/                 llms.txt / llms-full.txt (generated) + static files
test/                   Vitest unit tests + Playwright e2e (test/e2e/)
```

## More docs

- **[`CLAUDE.md`](CLAUDE.md)** — detailed architecture notes (chatbot internals,
  content pipeline, tests, conventions). The authoritative deep reference.
- **[`DEPLOYMENT.md`](DEPLOYMENT.md)** — Cloudflare Pages / hosting setup.
- **[`.claude/MIGRATION_PLAN.md`](.claude/MIGRATION_PLAN.md)** — history of the
  2026 Heroku → Cloudflare migration.
