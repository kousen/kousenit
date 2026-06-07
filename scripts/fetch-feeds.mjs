// Fetches Ken's latest newsletter issues (Substack RSS) and YouTube videos
// (channel Atom feed) and writes data/recent.json. Both feeds are public — no
// API keys. Run by the weekly refresh-kb GitHub Action; then build-kb.mjs folds
// this into the chatbot KB + llms files.
//
// Run: node scripts/fetch-feeds.mjs

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SUBSTACK = "https://kenkousen.substack.com/feed";
const YT_CHANNEL = "UCWmOARV8Lj5TE6LB1uGiguw";
const YOUTUBE = `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL}`;
const MAX_ITEMS = 6;

const decode = (s) =>
  (s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .trim();

const pick = (block, tag) => {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decode(m[1]) : "";
};

async function getText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "kousenit-feed-bot/1.0" } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

async function newsletterIssues() {
  const xml = await getText(SUBSTACK);
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, MAX_ITEMS);
  return items.map((m) => {
    const b = m[1];
    return {
      title: pick(b, "title"),
      url: pick(b, "link"),
      date: (pick(b, "pubDate") || "").slice(0, 16),
    };
  }).filter((i) => i.title && i.url);
}

async function videos() {
  const xml = await getText(YOUTUBE);
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, MAX_ITEMS);
  return entries.map((m) => {
    const b = m[1];
    const id = pick(b, "yt:videoId");
    const href = (b.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/i) || [])[1];
    return {
      title: pick(b, "title"),
      url: id ? `https://www.youtube.com/watch?v=${id}` : decode(href || ""),
      date: (pick(b, "published") || "").slice(0, 10),
    };
  }).filter((v) => v.title && v.url);
}

const [issues, vids] = await Promise.all([
  newsletterIssues().catch((e) => { console.error("newsletter:", e.message); return []; }),
  videos().catch((e) => { console.error("youtube:", e.message); return []; }),
]);

// Preserve whatever still fetched; only fail hard if BOTH feeds failed.
if (!issues.length && !vids.length) {
  console.error("Both feeds failed — leaving data/recent.json unchanged.");
  process.exit(1);
}

writeFileSync(
  join(root, "data/recent.json"),
  JSON.stringify({ issues, videos: vids }, null, 2) + "\n"
);
console.log(`Wrote data/recent.json: ${issues.length} issues, ${vids.length} videos`);
