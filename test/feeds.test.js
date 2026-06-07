import { describe, it, expect } from "vitest";
import { parseSubstack, parseYouTube, decode } from "../scripts/fetch-feeds.mjs";

const SUBSTACK_XML = `<rss><channel>
  <item><title><![CDATA[Issue One &amp; Two]]></title><link>https://kenkousen.substack.com/p/one</link><pubDate>Sun, 31 May 2026 12:00:00 GMT</pubDate></item>
  <item><title>Issue Two</title><link>https://kenkousen.substack.com/p/two</link><pubDate>Sun, 24 May 2026 12:00:00 GMT</pubDate></item>
  <item><title>No Link Here</title></item>
</channel></rss>`;

const YT_XML = `<feed>
  <entry><yt:videoId>abc123</yt:videoId><title>Cool Video</title><link rel="alternate" href="https://www.youtube.com/watch?v=abc123"/><published>2026-03-02T12:00:00+00:00</published></entry>
</feed>`;

describe("decode", () => {
  it("strips CDATA and decodes entities", () => {
    expect(decode("<![CDATA[a &amp; b]]>")).toBe("a & b");
    expect(decode("Tom &#39;s &quot;quote&quot;")).toBe(`Tom 's "quote"`);
  });
});

describe("parseSubstack", () => {
  it("parses items, decoding CDATA + entities, and slices the date", () => {
    const issues = parseSubstack(SUBSTACK_XML);
    expect(issues).toHaveLength(2); // the item missing <link> is dropped
    expect(issues[0]).toMatchObject({
      title: "Issue One & Two",
      url: "https://kenkousen.substack.com/p/one",
      date: "Sun, 31 May 2026",
    });
  });

  it("respects the max-items limit", () => {
    expect(parseSubstack(SUBSTACK_XML, 1)).toHaveLength(1);
  });

  it("returns [] for empty/garbage input", () => {
    expect(parseSubstack("")).toEqual([]);
    expect(parseSubstack("<nope/>")).toEqual([]);
  });
});

describe("parseYouTube", () => {
  it("builds a watch URL from the videoId and slices the date", () => {
    const vids = parseYouTube(YT_XML);
    expect(vids).toHaveLength(1);
    expect(vids[0]).toMatchObject({
      title: "Cool Video",
      url: "https://www.youtube.com/watch?v=abc123",
      date: "2026-03-02",
    });
  });

  it("returns [] when there are no entries", () => {
    expect(parseYouTube("<feed></feed>")).toEqual([]);
  });
});
