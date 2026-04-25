# Cloudflare Pages — kousenit.com deployment

Setup notes for putting this site on Cloudflare Pages. This file is informational only — the Pages project itself is created in the Cloudflare dashboard.

## One-time Pages project setup (dashboard)

1. **Cloudflare dashboard → Compute → Workers & Pages → Create → Pages → Connect to Git**.
2. Authorize the Cloudflare GitHub app for `kousen/kousenit` (or the user/org level — your choice).
3. Pick the repository: `kousen/kousenit`.
4. **Production branch:** `spike-hugo-blox` initially. We'll switch to `main` after the spike merges.

### Build configuration

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `pnpm install && pnpm run build` |
| Build output directory | `public` |
| Root directory | (leave blank) |

### Environment variables

Apply both **Production** and **Preview**:

| Name | Value | Why |
|---|---|---|
| `HUGO_VERSION` | `0.160.1` | Pin Hugo to the same version used in dev |
| `HUGO_VERSION_EXTENDED` | `true` | Hugo Blox uses Sass; needs the extended build |
| `NODE_VERSION` | `22` | Tailwind v4 + Pagefind require modern Node |

### Deploy

Click **Save and Deploy**. First build takes ~3-5 minutes (downloads modules, installs ~350 npm packages, builds Hugo, runs Pagefind).

When it succeeds, the site is at `https://kousenit-XXXX.pages.dev` (Cloudflare assigns the subdomain).

## Custom domain (`kousenit.com`)

Do this **after** verifying the Pages URL works.

Two paths:

### Path A — Move DNS to Cloudflare (recommended)

1. Cloudflare dashboard → **Add a domain** → enter `kousenit.com`. Cloudflare will scan existing DNS records.
2. At the registrar (where the domain is currently registered), change the nameservers to the two Cloudflare nameservers shown.
3. Wait for nameserver propagation (usually <1 hr; can take up to 24 hr).
4. In the Pages project → **Custom domains** → add `kousenit.com` and `www.kousenit.com`. Cloudflare auto-provisions SSL.

Trade-off: gives you Cloudflare's full feature set (free CDN, DDoS protection, analytics) but moves DNS authority.

### Path B — Keep DNS at the registrar

1. Pages project → **Custom domains** → add `kousenit.com`. Cloudflare gives you a CNAME target like `kousenit.pages.dev`.
2. At the registrar, add a CNAME record pointing `www` to that target. (Apex `kousenit.com` requires ALIAS/ANAME or CNAME flattening — depends on registrar.)
3. SSL is still auto-provisioned.

Simpler if DNS lives somewhere else for organizational reasons. Less Cloudflare value.

## Heroku retire (after Pages cutover succeeds)

1. Watch Pages logs for ~48 hours. Confirm no 404s on important paths.
2. Heroku dashboard → kousenit app → Settings → **Disable GitHub integration**.
3. (Optional) **Delete app** entirely once you're confident.
4. Locally: `git remote remove heroku`.
5. Delete `.hugotheme` from the repo (Heroku-buildpack-specific).

## Troubleshooting

- **Build fails with `hugo: command not found`**: `HUGO_VERSION` env var not set, or missing.
- **Build fails with `pagefind: command not found`**: `pnpm install` skipped — verify build command starts with `pnpm install`.
- **Build fails with Sass errors**: `HUGO_VERSION_EXTENDED=true` not set.
- **Site renders but search doesn't work**: Pagefind didn't run. Confirm `pnpm run build` succeeded end to end.
- **404s on `/gradle/...` or `/groovy/...` paths**: Static training resources. They live under `static/` and should publish unchanged. Verify they're in the `public/` directory after a local `pnpm run build`.
