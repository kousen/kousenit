import { describe, it, expect } from "vitest";
import { corsHeaders, sanitizeMessages, openAiSseToText, isFlagged } from "../functions/api/_lib.js";

describe("corsHeaders", () => {
  it("echoes an allowed origin", () => {
    expect(corsHeaders("https://kousenit.com")["Access-Control-Allow-Origin"]).toBe("https://kousenit.com");
    expect(corsHeaders("http://localhost:1313")["Access-Control-Allow-Origin"]).toBe("http://localhost:1313");
  });

  it("falls back to the canonical origin for a disallowed one", () => {
    expect(corsHeaders("https://evil.example.com")["Access-Control-Allow-Origin"]).toBe("https://kousenit.com");
    expect(corsHeaders("")["Access-Control-Allow-Origin"]).toBe("https://kousenit.com");
  });
});

describe("sanitizeMessages", () => {
  it("rejects empty or non-array input", () => {
    expect(sanitizeMessages(null).status).toBe(400);
    expect(sanitizeMessages([]).error).toBeTruthy();
  });

  it("rejects an over-long conversation", () => {
    const many = Array.from({ length: 20 }, () => ({ role: "user", content: "hi" }));
    expect(sanitizeMessages(many).error).toMatch(/too long/i);
  });

  it("coerces unknown roles to 'user', trims, and keeps 'assistant'", () => {
    const r = sanitizeMessages([
      { role: "system", content: "  hello  " },
      { role: "assistant", content: "hi" },
    ]);
    expect(r.messages).toEqual([
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi" },
    ]);
  });

  it("caps content length at MAX_CHARS", () => {
    const r = sanitizeMessages([{ role: "user", content: "x".repeat(5000) }], { MAX_TURNS: 12, MAX_CHARS: 4000 });
    expect(r.messages[0].content.length).toBe(4000);
  });

  it("drops blank messages and errors if nothing usable remains", () => {
    expect(sanitizeMessages([{ role: "user", content: "   " }]).error).toBeTruthy();
    expect(sanitizeMessages([{ role: "user", content: 42 }]).error).toBeTruthy();
  });
});

describe("openAiSseToText", () => {
  async function run(chunks) {
    const ts = openAiSseToText();
    const writer = ts.writable.getWriter();
    const reader = ts.readable.getReader();
    const out = [];
    const pump = (async () => {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        out.push(value);
      }
    })();
    for (const c of chunks) await writer.write(c);
    await writer.close();
    await pump;
    return out.join("");
  }

  it("extracts content deltas and ignores [DONE]/keep-alives", async () => {
    const text = await run([
      'data: {"choices":[{"delta":{"content":"Hel"}}]}\n',
      ": keep-alive\n",
      'data: {"choices":[{"delta":{"content":"lo"}}]}\n',
      "data: [DONE]\n",
    ]);
    expect(text).toBe("Hello");
  });

  it("handles a JSON delta split across chunk boundaries", async () => {
    const text = await run(['data: {"choices":[{"delta":{"con', 'tent":"Hi"}}]}\n']);
    expect(text).toBe("Hi");
  });
});

describe("isFlagged (moderation, injectable fetch)", () => {
  it("returns true when the moderation API flags the text", async () => {
    const fakeFetch = async () => ({ ok: true, json: async () => ({ results: [{ flagged: true }] }) });
    expect(await isFlagged("bad", "key", fakeFetch)).toBe(true);
  });

  it("returns false when not flagged", async () => {
    const fakeFetch = async () => ({ ok: true, json: async () => ({ results: [{ flagged: false }] }) });
    expect(await isFlagged("fine", "key", fakeFetch)).toBe(false);
  });

  it("fails OPEN (false) on a network error", async () => {
    const fakeFetch = async () => {
      throw new Error("network down");
    };
    expect(await isFlagged("x", "key", fakeFetch)).toBe(false);
  });

  it("fails OPEN (false) on a non-OK response", async () => {
    const fakeFetch = async () => ({ ok: false });
    expect(await isFlagged("x", "key", fakeFetch)).toBe(false);
  });
});
