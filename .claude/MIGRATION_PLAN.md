# kousenit.com — Migration + Chatbot Plan

**Drafted:** 2026-04-19
**Last updated:** 2026-06-07
**Status:** ✅ **FULLY COMPLETE (2026-06-07), incl. Phase 13.** Production on Cloudflare Pages over HTTPS, served from `main`. **Heroku retired — bill is $0.** Branch promotion done. **Registrar transferred Hover → Cloudflare (2026-06-07):** WHOIS now `Cloudflare, Inc.` (IANA 1910), expiry extended to 2028-03-07, all DNS/email verified intact post-transfer. Entire stack (DNS + hosting + registration) now consolidated on Cloudflare at-cost. **Remaining: just account-closure housekeeping** — close Heroku (empty), cancel DNSimple (only zone was kousenit.com, already bypassed since the 06-06 NS move), and close Hover (after confirming kousenit.com was its only domain).

**Site chatbot v1 shipped 2026-06-07 (Phases 11–12, re-architected).** Instead of the deferred Anthropic `wwbs`-style Worker, it's a Cloudflare **Pages Function** at `/api/ask` using **OpenAI `gpt-5.4-mini`** (streaming), plus a floating vanilla-JS widget. KB + persona live in `functions/api/_knowledge.js`; secret `OPENAI_API_KEY` set; WAF rate limit (10 req/10s/IP) active; OpenAI Moderation + structural prompt-injection defenses in place. Full details in `CLAUDE.md` → "Site chatbot". **Phase 2 (next): auto-updating RSS feed integration** — pull recent Substack issues + YouTube videos (with per-item links) into a separate, non-cached trailing KB section so the stable KB stays prompt-cached. Also a planned teaching example for Ken's Fall AI Integration course.

### Phase 8 & 9 completion (2026-06-07)
- **Heroku:** `heroku apps:destroy -a kousenit` done; "You have no apps"; git `heroku` remote auto-removed. Bill now $0.
- **Promotion:** `main` fast-forwarded to the Hugo Blox tree (clean, no force-push); pushed; Pages `production_branch` switched `spike-hugo-blox` → `main` via API (GitHub source connection preserved); production deploy `17d5230a` (main @ `89fd8ed`) succeeded and is live. `.hugotheme` dropped off automatically.
- **Branches:** `spike-hugo-blox` deleted (local + remote), `spike-blowfish` deleted (local). Only `main` remains.
- **Site verified live:** `kousenit.com` + `www` HTTP 200, new portrait + tightened spacing present.
- **Note:** Dependabot is active on the repo (saw a `dependabot/npm_and_yarn/preact-*` preview build) — there may be open dependency-update PRs worth a look.
- **Also done this session:** homepage author portrait updated to `me_jun2025.png`; bio→Books spacing tightened. Dark-mode default left as `system` (decided against forcing dark).

## Cutover record (2026-06-06)

- **Cloudflare zone:** `kousenit.com`, zone ID `77fa387dccdb61de98eb8de8c54b8675`, account `612d35857ad57160f86b64091b4d6030`. Active as of 2026-06-06T22:15Z.
- **Nameservers (set at Hover):** `delilah.ns.cloudflare.com`, `mitchell.ns.cloudflare.com`.
- **DNS record source of truth at cutover:** `.claude/dns-baseline-kousenit-2026-05-21.md` + live pull 2026-06-06 (26 records, 21 non-system). Cloudflare's auto-scan imported only 17 — the 7 missing (Railway CNAMEs, `updates` subdomain SES/Resend mail, railway-verify TXTs) were backfilled via API. **Lesson: never trust the quick-scan for TXT/subdomain records.**
- **No DNSSEC** (no DS at registry) — the plan's earlier worry was unfounded.
- **Apex:** served via proxied `CNAME kousenit.com → kousenit.pages.dev` (Cloudflare flattening). `www` likewise. Both Pages custom domains active with SSL.
- **certificate-service already on Railway** (`nt7d1e32.up.railway.app`) — Phase 10 was already done before this session; CNAME came across in the move.
- **Content note:** old `/fiction/` was a Python `http.server` directory listing (not real content); the one file is preserved at `/fiction/st_tile` on Pages.
- **Rollback (if needed during soak):** repoint apex+www back to Heroku — apex to 4 A records `99.83.183.127 / 3.33.193.101 / 15.197.246.237 / 52.223.46.195` (grey), `www` CNAME → `www.kousenit.com.herokudns.com` (grey). TTLs are 60s.

---

## Where things stand right now (snapshot)

### Production (visible to the public, unchanged)
- `https://kousenit.com` → Heroku → old Raditian Hugo 0.69 site
- `https://www.kousenit.com` → Heroku → same
- Heroku auto-deploys from `github/main`. Last deploy was the date-fix commit `bb6e5f3` from this morning.

### New site (built but not yet at the public URL)
- `https://kousenit.pages.dev` → Cloudflare Pages → new Hugo Blox site (fully polished)
- Pages project name: `kousenit` (Cloudflare account: `Ken.kousen@kousenit.com`)
- Production branch in Pages: **`spike-hugo-blox`** (not `main`)
- Last deployed commit: `8ffa126` (Add DEPLOYMENT.md)

### Branches
| Branch | Commit | Where |
|---|---|---|
| `main` | `bb6e5f3` | Old Raditian site, on GitHub + Heroku |
| `spike-blowfish` | `cb85872` | First spike (rejected), local-only |
| `spike-hugo-blox` | `8ffa126` | Chosen direction, on GitHub + Pages |

### Cloudflare side
- **Pages custom domain `www.kousenit.com`** is still **registered** in the Pages project but DNS no longer points at it (rolled back during the 04-25 session — see "What went wrong" below). Harmless. Remove or leave; up to us.
- **Pages custom domain `kousenit.com`** was **never registered** (Cloudflare blocked it pending DNS transfer).
- Existing Worker `wwbs-proxy` at `wwbs-proxy.ken-kousen.workers.dev` is untouched.

### Wrangler CLI
- Logged in as `Ken.kousen@kousenit.com`. CLI works.

---

## Lessons from the 2026-04-25 cutover attempt (read this BEFORE next session)

### What went wrong

Two related issues bit us:

1. **Cloudflare requires DNS transfer for apex custom domains.** Pages will let you add a subdomain (`www.kousenit.com`) as a custom domain via external DNS (CNAME), but the apex (`kousenit.com`) is gated behind moving the entire zone to Cloudflare DNS. Their UI insists.

2. **DNSimple's free-tier `URL` (redirect) record only supports HTTP, not HTTPS.** We considered using `URL kousenit.com → https://www.kousenit.com` as a workaround, but the destination would not have served HTTPS — modern browsers (which try HTTPS first) would have hit a TLS error. The "Upgrade your plan" upsell on DNSimple was the giveaway.

3. **Partial migration broke styling.** When we pointed `www` at Pages but left apex on Heroku, visiting `https://kousenit.com` showed broken styles. Cause: the OLD Heroku site has `baseURL = "https://www.kousenit.com/"` hardcoded in `config.toml`, so all CSS/JS in its HTML are absolute URLs to www. Browsers fetched those from the new Pages site (which has totally different asset paths) → 404s → unstyled HTML. Lesson: with absolute baseURL, you cannot do an apex-vs-www split between two different sites.

### Conclusion

**The right path is to move DNS to Cloudflare and migrate apex + www atomically.** We rolled the partial change back at end-of-session. Next session does the full move.

---

## Reference: complete DNSimple records as of 2026-04-25

Full inventory so the Cloudflare import can be verified record-by-record. **All 26 records must survive the move.** Three categories:

### Category 1 — Records that CHANGE during cutover

| # | Type | Name | Current content | New content |
|---|---|---|---|---|
| 1 | ALIAS | `kousenit.com` (apex) | `kousenit.com.herokudns.com` | (deleted; Cloudflare uses internal proxy/flattening to point apex at Pages) |
| 2 | CNAME | `www.kousenit.com` | `www.kousenit.com.herokudns.com` | `kousenit.pages.dev` (or whatever Pages assigns when re-adding www after DNS move) |

### Category 2 — Records that STAY (must not be lost in Cloudflare's import)

| # | Type | Name | Content | Why it exists |
|---|---|---|---|---|
| 3 | CNAME | `certificate-service.kousenit.com` | `frozen-castle-06owka1oz1hcczj1ty980hab.herokudns.com` | Ken's "certificate service" app on Heroku. Stays until that app is migrated separately (next phase after the homepage is done). |
| 4 | CNAME | `mockhub.kousenit.com` | `9ztrr0ak.up.railway.app` | Railway-hosted MockHub MCP server. Unrelated. |
| 5 | MX | `kousenit.com` | `5 alt1.aspmx.l.google.com` | Google Workspace email. **Critical.** |
| 6 | MX | `kousenit.com` | `10 alt3.aspmx.l.google.com` | Google Workspace email. **Critical.** |
| 7 | MX | `kousenit.com` | `5 alt2.aspmx.l.google.com` | Google Workspace email. **Critical.** |
| 8 | MX | `kousenit.com` | `10 alt4.aspmx.l.google.com` | Google Workspace email. **Critical.** |
| 9 | MX | `kousenit.com` | `1 aspmx.l.google.com` | Google Workspace email (highest priority). **Critical.** |
| 10 | MX | `send.updates.kousenit.com` | `10 feedback-smtp.us-east-1.amazonses.com` | Amazon SES bounce/complaint reports for the `updates` subdomain. |
| 11 | TXT | `kousenit.com` | `domain-verification=70b557db4f0be9230da453e1dd118311e76fdd3103ea58a2c21d96b322208604` | Some service's domain verification (origin unclear; leave). |
| 12 | TXT | `kousenit.com` | `openai-domain-verification=dv-oumLel1pbLfryj8B5txVVBbY` | OpenAI domain verification (probably for a custom GPT or API integration). |
| 13 | TXT | `kousenit.com` | `v=spf1 include:_spf.google.com ~all` | SPF for Google Workspace email. **Critical.** |
| 14 | TXT | `kousenit.com` | `google-site-verification=q_8O6PeO4Td-3CKGytXvGiJvXw9ElOUlDk_FSeV_isg` | Google Search Console verification. |
| 15 | TXT | `_atproto.kousenit.com` | `did=did:plc:dk2qm47sjyljrlurojujc7nu` | Bluesky / AT Protocol custom domain handle (this is what makes `bsky.app/profile/kousenit.com` work). |
| 16 | TXT | `_dmarc.kousenit.com` | `v=DMARC1; p=reject; rua=mailto:dmarc-reports@kousenit.com; adkim=r; aspf=r` | DMARC policy. **Critical for email deliverability.** |
| 17 | TXT | `google._domainkey.kousenit.com` | `v=DKIM1; k=rsa; p=MIIBIjAN...` (long RSA key) | Google Workspace DKIM signing key. **Critical.** |
| 18 | TXT | `_railway-verify.mockhub.kousenit.com` | `railway-verify=d083f47844aab4d8662802cbf140ffa81c25fa96cd7e654f49529ebc951b38e4` | Railway domain ownership verification for `mockhub`. |
| 19 | TXT | `resend._domainkey.updates.kousenit.com` | `p=MIGfMA0G...` (RSA key) | Resend DKIM for the `updates` subdomain. |
| 20 | TXT | `send.updates.kousenit.com` | `v=spf1 include:amazonses.com ~all` | SPF for Amazon SES on the `updates` subdomain. |

### Category 3 — DNSimple-managed system records (Cloudflare will replace these with its own equivalents on import)

| # | Type | Name | Content | Notes |
|---|---|---|---|---|
| 21 | NS | `kousenit.com` | `ns4.dnsimple-edge.org` | Replaced by Cloudflare nameservers when Hover delegates to Cloudflare. |
| 22 | NS | `kousenit.com` | `ns1.dnsimple.com` | Same. |
| 23 | NS | `kousenit.com` | `ns2.dnsimple-edge.net` | Same. |
| 24 | NS | `kousenit.com` | `ns3.dnsimple.com` | Same. |
| 25 | SOA | `kousenit.com` | `ns1.dnsimple.com admin.dnsimple.com 1716222317 86400 7200 604800 300` | Cloudflare generates its own SOA. |

### Category 4 — Deprecated / auto-generated, ignore

| # | Type | Name | Content | Notes |
|---|---|---|---|---|
| 26 | TXT | `kousenit.com` | `"ALIAS for kousenit.com.herokudns.com"` | DNSimple legacy auto-mirror of the ALIAS record. Marked deprecated; auto-cleanup scheduled by DNSimple for 2026-05-18. Don't touch. |

---

## Architecture context (registrar / DNS / hosting)

```
Hover (registrar — owns kousenit.com registration; ~$15/year)
  └─ delegates DNS to DNSimple via NS records  ← this changes during the move
      └─ DNSimple holds the zone ($1/month)     ← will be migrated to Cloudflare DNS (free)
          └─ records point at:
              - Heroku (apex + www → old site, certificate-service → Ken's app)
              - Railway (mockhub MCP server)
              - Google Workspace (email)
              - Amazon SES (transactional email subdomain)
              - Bluesky AT Protocol (handle verification)
```

After the move:
```
Hover (still the registrar)
  └─ delegates DNS to Cloudflare (NS change at Hover)
      └─ Cloudflare DNS holds the zone (free)
          └─ records point at:
              - Cloudflare Pages (apex + www → new site, via CNAME flattening)
              - Heroku (certificate-service → Ken's app, until that's also migrated)
              - Railway, Google Workspace, Amazon SES, Bluesky (unchanged)
```

---

## Plan for next session — Cloudflare DNS move

**Estimated time:** 60-90 minutes. **Do this when you have an uninterrupted hour and the screenshot of the records list handy.**

### Pre-flight
- [ ] Re-read the "Lessons" section above.
- [ ] Confirm rollback held (Heroku still serves both apex and www).
- [ ] Have Hover login ready (the registrar — separate from DNSimple).

### Phase 1 — Add the domain to Cloudflare (DOES NOT change live traffic yet)

1. Cloudflare dashboard → **Add a domain** → enter `kousenit.com` → choose Free plan.
2. Cloudflare scans DNSimple and shows imported records.
3. **Verify against the table in this document.** Every record in Category 1 + 2 must be present. Especially:
   - All 5 MX records to Google
   - SPF (TXT v=spf1...)
   - DMARC (TXT _dmarc...)
   - DKIM (TXT google._domainkey...)
   - Bluesky `_atproto`
   - Resend DKIM for updates subdomain
   - Amazon SES SPF for updates subdomain
   - All 4 verification TXT records (domain-verification, openai-domain-verification, google-site-verification, _railway-verify)
   - mockhub CNAME → Railway
   - certificate-service CNAME → Heroku
4. **Do NOT proceed until all records are confirmed.** If any are missing, add them manually in Cloudflare BEFORE moving nameservers. Cloudflare has bulk import via BIND zone file if needed.
5. Cloudflare shows two assigned nameservers (e.g. `nina.ns.cloudflare.com` and `walter.ns.cloudflare.com`). **Write these down.**

### Phase 2 — Change nameservers at Hover

1. Log into Hover.
2. Find `kousenit.com` → DNS / nameserver settings.
3. Change nameservers from `ns1.dnsimple.com` etc. to the two Cloudflare nameservers from Phase 1.
4. Save.

### Phase 3 — Wait for propagation

- Usually 5-30 minutes; can be up to 24 hours.
- Verify with: `dig NS kousenit.com +short` — should eventually return Cloudflare's nameservers.
- Cloudflare dashboard will show "Active" once it detects the delegation.

### Phase 4 — Update DNS to point at Pages (in Cloudflare DNS now)

1. Cloudflare → DNS for `kousenit.com`. Find the **ALIAS / apex record** that's currently `kousenit.com → kousenit.com.herokudns.com`.
2. **Delete** it (we don't need it anymore — Cloudflare flattens CNAMEs at the apex, so we can use a CNAME on the apex itself).
3. **Create a new CNAME** at the apex: `kousenit.com → kousenit.pages.dev`. Toggle the "Proxied" cloud icon **ON** (orange) — this is what enables CNAME flattening + Cloudflare's edge.
4. **Update the existing `www` CNAME** (currently `www.kousenit.com.herokudns.com`) to `kousenit.pages.dev`. Toggle Proxied ON.
5. **Leave certificate-service CNAME at Heroku for now** (Ken's other app).
6. **Leave all other records (MX, TXT, mockhub) untouched.**

### Phase 5 — Add custom domains to Pages

1. Cloudflare → Workers & Pages → kousenit project → Custom domains.
2. Add `kousenit.com` (this time it should accept it without complaining about DNS transfer, because DNS is now at Cloudflare).
3. Confirm `www.kousenit.com` is still registered there (we left it from the previous attempt).
4. Activate both. SSL provisions automatically (1-5 minutes).

### Phase 6 — Smoke test

- `https://kousenit.com` should serve the new Hugo Blox site over HTTPS.
- `https://www.kousenit.com` should also serve the new site over HTTPS (or 301 to apex if Pages does that automatically — either is fine).
- All static training resources still resolve (`/gradle/`, `/groovy/`, `/fiction/`, favicons, etc.).
- Search bar works (Pagefind index loads).
- `dig MX kousenit.com +short` — should return Google's MX records (verify email isn't broken).
- Send a test email TO `ken.kousen@kousenit.com` — verify it lands.
- Bluesky still recognizes `kousenit.com` as your handle (check `bsky.app/profile/kousenit.com`).

### Phase 7 — Soak (~48 hours)

- Watch Pages analytics and Cloudflare DNS logs for 404s or unexpected 5xxs.
- Heroku stays running as fallback during this window. Don't disable yet.

### Phase 8 — Retire Heroku (apex + www only — NOT certificate-service yet)

When you're confident:
1. Heroku dashboard → kousenit app → Settings → Disable GitHub integration.
2. Optional: delete the Heroku app entirely.
3. Locally: `git remote remove heroku`.
4. Delete `.hugotheme` from the repo (Heroku-buildpack-specific).
5. Note: keep the `certificate-service.kousenit.com` CNAME at Heroku — that's a different app you'll migrate separately.

### Phase 9 — Promote spike-hugo-blox to main

Optional cleanup. After the cutover is stable:
1. `git checkout main && git merge spike-hugo-blox` (or rebase, your call).
2. `git push github main`.
3. In Pages: change production branch from `spike-hugo-blox` to `main`.
4. Delete the `spike-hugo-blox` branch (`git branch -d spike-hugo-blox && git push github :spike-hugo-blox`).
5. Delete the `spike-blowfish` branch (`git branch -D spike-blowfish` — not pushed, local only).

---

## Phase 10 — Migrate the certificate-service app off Heroku

(Mentioned by Ken on 2026-04-25: the `certificate-service.kousenit.com` CNAME points to one of his own Heroku apps. After homepage migration is done, that app moves too, so Heroku can be retired entirely.)

This is its own project — not blocked by anything in this plan. Will need:
- Decide where it goes (Cloudflare Workers? Render? Railway? somewhere on the existing Cloudflare account?)
- Migrate the app code
- Update the `certificate-service.kousenit.com` CNAME at Cloudflare DNS to point at the new host
- Retire the Heroku app

---

## Phase 11 — Chatbot Worker (deferred)

(Original Phase 2 from the pre-cutover plan. Still on the roadmap, just not prioritized while the homepage migration is in progress.)

See "Reference: existing Worker pattern" + "Cloudflare MCP servers" sections below for context. Key points unchanged from the original plan:
- Server owns the system prompt (do NOT accept it from the client)
- Add prompt caching
- Add streaming
- Add rate limiting
- CORS allowlist includes kousenit.com
- Custom route at `chat.kousenit.com/ask` or `kousenit.com/api/ask` (Pages Functions can also handle this since we're now on Cloudflare for everything)

---

## Phase 12 — Chatbot UI on the Hugo site (deferred)

Same as original plan. Add a fourth nav menu item for "Chat" once the Worker is up. Vanilla JS partial in the Hugo Blox theme via `layouts/_partials/hooks/head-end/`.

---

## Phase 13 — Transfer domain registration Hover → Cloudflare Registrar

**Why:** Ken has no positive feeling for Hover. Once DNS is on Cloudflare (Phase 1-3), putting registration there too gives one pane of glass for DNS + registration + hosting, and Cloudflare Registrar charges at-cost — roughly **$10-11/year for `.com` (confirm exact at transfer time — Verisign has raised `.com` wholesale) vs Hover's ~$19/year** (confirmed by Ken 2026-06-07), with WHOIS privacy included free and no renewal upsells. **Lifetime saving ~$8-9/year.**

**Prerequisites:**
- ✅ Phase 1 done (Cloudflare zone for `kousenit.com` exists).
- ✅ Phase 2 done (Hover NS already changed to Cloudflare's nameservers — DNS now lives at Cloudflare).
- ✅ Site has soaked on the new infra for **at least a week** with no issues. The registrar transfer itself doesn't take the site offline, but soaking first means a smaller blast radius if anything else surfaces.

**Steps:**

1. **At Hover:** Unlock `kousenit.com` for transfer (DNS settings → Transfer lock OFF) and get the **auth/EPP code**.
2. **At Cloudflare:** dashboard → kousenit.com → **Registrar** tab → start transfer → paste auth code → confirm contact info.
3. **Approve the transfer email** Cloudflare sends to the WHOIS contact (or to you directly if WHOIS privacy is on).
4. Hover sends a "domain transfer in progress" notice and may give you a 5-day window to deny it. Don't deny it.
5. **Wait 5-7 days** for the transfer to complete. Domain stays live throughout — only the registrar of record changes; DNS at Cloudflare is unaffected.
6. After transfer completes:
   - Re-enable auto-renewal at Cloudflare (default on).
   - Re-enable Transfer Lock at Cloudflare (recommended, default on).
   - Close the Hover account if no other domains live there.

**Concentration risk acknowledgement:** This puts DNS + hosting + registration all at Cloudflare. If they ever suspend the account, all three go down. Negligible probability for a personal site on a paying plan, but if it bugs you, **Porkbun** (~$10/yr for `.com`) is a well-regarded alternative independent of Cloudflare. Pick one provider; don't agonize.

**Worth noting:** ICANN imposes a **60-day registrar lock** after any transfer. If the domain has been transferred in the last 60 days (it hasn't, by all indications), wait until that window closes.

---

## Reference: existing Worker pattern (`kousen/wwbs/worker.js`)

Already reviewed. Key points the chatbot Worker should inherit:
- POST endpoint, CORS-locked via origin allowlist (currently `kousen.github.io` + localhost).
- Client sends `{system, messages, model?, max_tokens?}`, Worker forwards to Anthropic `/v1/messages`.
- `ANTHROPIC_API_KEY` as a Worker secret via `wrangler secret put`.
- Default model `claude-sonnet-4-6`.
- No streaming, no prompt caching yet.
- No `wrangler.toml` in the repo.

---

## Cloudflare MCP servers to install (recommended before Phase 11)

All remote, SSE-based, no install beyond adding URLs to MCP client config. **Verify URLs at `developers.cloudflare.com/agents/model-context-protocol/` before adding — endpoints can move.**

| Server | URL | Why |
|---|---|---|
| Cloudflare Docs | `https://docs.mcp.cloudflare.com/sse` | Current Pages/Workers docs; avoids stale training data |
| Workers Bindings | `https://bindings.mcp.cloudflare.com/sse` | Provision KV/R2/D1 via prompts |
| Workers Builds | `https://builds.mcp.cloudflare.com/sse` | Build logs without leaving Claude Code |
| Observability | `https://observability.mcp.cloudflare.com/sse` | Live Worker analytics/logs post-launch |

---

## Open questions for next session

1. **Cloudflare Free plan vs. Pro:** Free is fine for everything in this plan. Pro adds image optimization, more page rules, lossless image compression — none of which we need today.
2. **Bot Fight Mode + WAF settings:** Cloudflare's defaults are sensible. Probably leave at "Essentially Off" for a personal site to avoid blocking Pagefind crawler / RSS readers / etc.
3. **Email Routing:** Cloudflare offers free email routing (`*@kousenit.com → forward elsewhere`). You're on Google Workspace via MX records — keep that, don't enable Cloudflare Email Routing or it will break inbound mail.
4. **DNSSEC:** DNSimple has it enabled (NS records suggest as much). Cloudflare also supports DNSSEC. Decision: enable on Cloudflare side too, or skip. Skipping is fine for personal sites.
