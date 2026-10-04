// Fetches Ken's latest newsletter issues (Substack RSS) and YouTube videos
// (channel Atom feed) and writes data/recent.json. Both feeds are public — no
// API keys. The XML parsing is exported + unit-tested against fixtures; the
// network fetch + file write run only when executed directly.
//
// Run: node scripts/fetch-feeds.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

// Read via our own Pages Function (functions/api/substack-feed.js): Substack
// 403s GitHub Actions IPs, but not Cloudflare's.
export const SUBSTACK = "https://www.kousenit.com/api/substack-feed";
export const YT_CHANNEL = "UCWmOARV8Lj5TE6LB1uGiguw";
export const YOUTUBE = `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL}`;
export const MAX_ITEMS = 6;

export const decode = (s) =>
  (s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .trim();

export const pick = (block, tag) => {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decode(m[1]) : "";
};

// Pure: parse a Substack RSS feed into newsletter issues.
export function parseSubstack(xml, max = MAX_ITEMS) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    .slice(0, max)
    .map((m) => ({
      title: pick(m[1], "title"),
      url: pick(m[1], "link"),
      date: (pick(m[1], "pubDate") || "").slice(0, 16),
    }))
    .filter((i) => i.title && i.url);
}

// Pure: parse a YouTube channel Atom feed into videos.
export function parseYouTube(xml, max = MAX_ITEMS) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
    .slice(0, max)
    .map((m) => {
      const id = pick(m[1], "yt:videoId");
      const href = (m[1].match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/i) || [])[1];
      return {
        title: pick(m[1], "title"),
        url: id ? `https://www.youtube.com/watch?v=${id}` : decode(href || ""),
        date: (pick(m[1], "published") || "").slice(0, 10),
      };
    })
    .filter((v) => v.title && v.url);
}

// Retries 429/5xx (Substack intermittently rate-limits the relay's egress IPs);
// a 4xx that isn't 429 is a real problem and fails immediately.
async function getText(url, tries = 3) {
  for (let i = 1; ; i++) {
    const res = await fetch(url, { headers: { "User-Agent": "kousenit-feed-bot/1.0" } });
    if (res.ok) return res.text();
    if (i >= tries || (res.status !== 429 && res.status < 500)) throw new Error(`${url} -> HTTP ${res.status}`);
    console.error(`${url} -> HTTP ${res.status}, retry ${i}/${tries - 1}`);
    await new Promise((r) => setTimeout(r, 15_000 * i)); // 15s, then 30s
  }
}

// --- CLI (network + write) ---
const isMain = import.meta.url === pathToFileURL(process.argv[1] || "").href;
if (isMain) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const recentPath = join(root, "data/recent.json");
  let prior = { issues: [], videos: [] };
  try { prior = JSON.parse(readFileSync(recentPath, "utf8")); } catch { /* first run */ }

  const [issuesFresh, vidsFresh] = await Promise.all([
    getText(SUBSTACK).then((x) => parseSubstack(x)).catch((e) => { console.error("newsletter:", e.message); return []; }),
    getText(YOUTUBE).then((x) => parseYouTube(x)).catch((e) => { console.error("youtube:", e.message); return []; }),
  ]);

  // Resilience: if a feed returns nothing (down / rate-limited), keep the prior
  // data for that feed rather than wiping it from the KB.
  const issues = issuesFresh.length ? issuesFresh : prior.issues || [];
  const videos = vidsFresh.length ? vidsFresh : prior.videos || [];

  if (!issues.length && !videos.length) {
    console.error("No data and nothing to preserve — leaving data/recent.json unchanged.");
    process.exit(1);
  }

  writeFileSync(recentPath, JSON.stringify({ issues, videos }, null, 2) + "\n");
  console.log(
    `Wrote data/recent.json: ${issues.length} issues (${issuesFresh.length} fresh), ` +
      `${videos.length} videos (${vidsFresh.length} fresh)`
  );
  // A feed that fell back to prior data still exits non-zero, so CI goes red
  // instead of silently serving stale items (Substack 403'd for 3 months in 2026).
  if (!issuesFresh.length || !vidsFresh.length) process.exitCode = 1;
}
