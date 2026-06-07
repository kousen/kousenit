// Pure, framework-agnostic helpers for the /api/ask function, split out so they
// can be unit-tested in plain Node (they use only standard web APIs: Response,
// TransformStream, fetch). The leading underscore keeps Cloudflare Pages from
// routing this file.

export const ALLOWED_ORIGINS = new Set([
  "https://kousenit.com",
  "https://www.kousenit.com",
  "http://localhost:1313",
  "http://127.0.0.1:1313",
]);

export const LIMITS = {
  MAX_TURNS: 12, // max messages accepted from the client
  MAX_CHARS: 4000, // max characters per message
  MAX_OUTPUT_TOKENS: 700,
};

// CORS headers. An allowed Origin is echoed back; anything else falls back to the
// canonical site origin (so other sites' browsers can't read the response).
export function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : "https://kousenit.com";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export function jsonResponse(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

// Validate + normalize the client's messages. Returns { messages } on success,
// or { error, status } describing why it was rejected.
export function sanitizeMessages(incoming, limits = LIMITS) {
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return { error: "No message provided.", status: 400 };
  }
  if (incoming.length > limits.MAX_TURNS) {
    return { error: "This conversation is too long — please start a new one.", status: 400 };
  }
  const messages = [];
  for (const m of incoming) {
    const role = m?.role === "assistant" ? "assistant" : "user";
    const content = typeof m?.content === "string" ? m.content.slice(0, limits.MAX_CHARS).trim() : "";
    if (content) messages.push({ role, content });
  }
  if (messages.length === 0) return { error: "Empty message.", status: 400 };
  return { messages };
}

// Returns true if OpenAI's Moderation API flags the text. Deliberately "fails
// open" (returns false on any error) so a moderation outage never blocks
// legitimate visitors. `doFetch` is injectable for testing.
export async function isFlagged(text, apiKey, doFetch = fetch) {
  try {
    const res = await doFetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.results?.[0]?.flagged);
  } catch (err) {
    console.error("Moderation check failed (failing open):", err);
    return false;
  }
}

// Log a visitor question to D1 for product insight. Minimal + anonymized:
// timestamp, the (capped) question text, and a coarse country code — no IPs or
// PII. Returns the run() promise for the caller to pass to waitUntil, or null
// if there's no DB binding / no question (so logging is a safe no-op until the
// CHAT_LOGS binding is configured).
export function logQuestion(db, question, country = "") {
  if (!db || !question) return null;
  return db
    .prepare("INSERT INTO questions (ts, question, country) VALUES (?, ?, ?)")
    .bind(new Date().toISOString(), question.slice(0, 500), country)
    .run();
}

// Parse OpenAI chat-completions SSE text and emit only the assistant content
// deltas. Handles chunk boundaries that split mid-line.
export function openAiSseToText() {
  let buffer = "";
  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // keep any partial line for the next chunk
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) controller.enqueue(delta);
        } catch {
          // ignore keep-alive lines / partial JSON
        }
      }
    },
  });
}
