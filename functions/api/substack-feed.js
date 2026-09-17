// Relays Ken's Substack RSS feed. Substack 403s GitHub Actions IPs but not
// Cloudflare's, so scripts/fetch-feeds.mjs reads the feed through here.
// The upstream URL is fixed — this is not an open proxy.
const FEED = "https://kenkousen.substack.com/feed";

export async function onRequestGet() {
  const res = await fetch(FEED, { headers: { "User-Agent": "kousenit-feed-bot/1.0" } });
  return new Response(res.body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/xml" },
  });
}
