# DNS baseline — kousenit.com

**Captured:** 2026-05-21 (UTC) via `dnsimple zones records list kousenit.com --all --json`
**Account:** ken.kousen@kousenit.com (DNSimple account 150620)
**Raw export:** [`dns-baseline-kousenit-2026-05-21.json`](dns-baseline-kousenit-2026-05-21.json) — exact record IDs/content for rollback.

This is the "known-good, still-on-Heroku" state captured **before** switching the live home page
over to Cloudflare Pages. If a cutover goes wrong, restore the three site-hosting records below
to these values.

## How DNS is wired

- The registrar (Hover) delegates the zone to **DNSimple's nameservers**
  (`ns1`/`ns3.dnsimple.com`, `ns2.dnsimple-edge.net`, `ns4.dnsimple-edge.org`).
- All record edits therefore happen at **DNSimple** via the `dnsimple` CLI — Hover only holds
  the NS delegation. The Cloudflare Pages cutover can be done entirely here **as long as the zone
  stays on DNSimple's nameservers** (don't move the zone into Cloudflare, or every record below
  must be recreated there).

## 🌐 Site hosting — points at Heroku (THE CUTOVER TARGETS)

These three are the only records that change when moving the site to Cloudflare Pages.
Everything else must stay untouched.

| ID | Type | Name | Content | TTL |
|---|---|---|---|---|
| 75647767 | ALIAS | `@` (apex) | `kousenit.com.herokudns.com` | 3600 |
| 55222676 | CNAME | `www` | `www.kousenit.com.herokudns.com` | 3600 |
| 63710148 | CNAME | `certificate-service` | `frozen-castle-06owka1oz1hcczj1ty980hab.herokudns.com` | 3600 |

> The apex **ALIAS** (ID 75647767) was created 2026-04-25, matching the first Cloudflare Pages
> cutover attempt; it currently resolves back to Heroku.

### Rollback commands (restore to Heroku)

```shell
dnsimple zones records update kousenit.com 75647767 --content kousenit.com.herokudns.com
dnsimple zones records update kousenit.com 55222676 --content www.kousenit.com.herokudns.com
# certificate-service CNAME is Heroku ACM; leave as-is unless it was changed.
```

## 📬 Google Workspace email — DO NOT TOUCH

| Type | Name | Content | Priority |
|---|---|---|---|
| MX | `@` | `aspmx.l.google.com` | 1 |
| MX | `@` | `alt1.aspmx.l.google.com` | 5 |
| MX | `@` | `alt2.aspmx.l.google.com` | 5 |
| MX | `@` | `alt3.aspmx.l.google.com` | 10 |
| MX | `@` | `alt4.aspmx.l.google.com` | 10 |
| TXT | `@` (SPF) | `v=spf1 include:_spf.google.com ~all` | |
| TXT | `google._domainkey` (DKIM) | `v=DKIM1; k=rsa; p=MIIBIjAN...` | |
| TXT | `_dmarc` | `v=DMARC1; p=reject; rua=mailto:dmarc-reports@kousenit.com; adkim=r; aspf=r` | |

## ✉️ Resend / Amazon SES — `updates` subdomain (transactional mail) — DO NOT TOUCH

| Type | Name | Content | Priority |
|---|---|---|---|
| TXT | `resend._domainkey.updates` (DKIM) | `p=MIGfMA0GCSq...` | |
| MX | `send.updates` | `feedback-smtp.us-east-1.amazonses.com` | 10 |
| TXT | `send.updates` (SPF) | `v=spf1 include:amazonses.com ~all` | |

## 🚂 Other services — DO NOT TOUCH

| Type | Name | Content |
|---|---|---|
| CNAME | `mockhub` | `9ztrr0ak.up.railway.app` |
| TXT | `_railway-verify.mockhub` | `railway-verify=d083f478...` |

## ✅ Ownership / verification TXT (apex) — DO NOT TOUCH

| Name | Content |
|---|---|
| `@` | `openai-domain-verification=dv-oumLel1pbLfryj8B5txVVBbY` |
| `@` | `google-site-verification=q_8O6PeO4Td-3CKGytXvGiJvXw9ElOUlDk_FSeV_isg` |
| `@` | `domain-verification=70b557db4f0be9230da453e1dd118311e76fdd3103ea58a2c21d96b322208604` |
| `_atproto` | `did=did:plc:dk2qm47sjyljrlurojujc7nu` (Bluesky handle) |

## ⚙️ System (DNSimple-managed) — DO NOT TOUCH

- SOA `@`
- NS `@` → `ns1.dnsimple.com`, `ns2.dnsimple-edge.net`, `ns3.dnsimple.com`, `ns4.dnsimple-edge.org`
