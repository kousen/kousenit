// Cloudflare Pages Function — POST /api/ask
// Streams a chatbot answer about Ken from OpenAI, with the system prompt + knowledge
// base held server-side (never trusted from the client).
import { SYSTEM_PROMPT } from "./_knowledge.js";

const MODEL = "gpt-5.4-mini";
const MAX_TURNS = 12; // max messages accepted from the client
const MAX_CHARS = 4000; // max characters per message
const MAX_OUTPUT_TOKENS = 700;

const ALLOWED_ORIGINS = new Set([
  "https://kousenit.com",
  "https://www.kousenit.com",
  "http://localhost:1313",
  "http://127.0.0.1:1313",
]);

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : "https://kousenit.com";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function jsonResponse(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

export function onRequestOptions({ request }) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("Origin") || ""),
  });
}

export async function onRequestPost({ request, env }) {
  const headers = corsHeaders(request.headers.get("Origin") || "");

  if (!env.OPENAI_API_KEY) {
    return jsonResponse({ error: "The assistant is not configured yet." }, 500, headers);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request." }, 400, headers);
  }

  const incoming = Array.isArray(body?.messages) ? body.messages : null;
  if (!incoming || incoming.length === 0) {
    return jsonResponse({ error: "No message provided." }, 400, headers);
  }
  if (incoming.length > MAX_TURNS) {
    return jsonResponse({ error: "This conversation is too long — please start a new one." }, 400, headers);
  }

  // Sanitize: only user/assistant roles and string content, with a length cap.
  const conversation = [];
  for (const m of incoming) {
    const role = m?.role === "assistant" ? "assistant" : "user";
    const content = typeof m?.content === "string" ? m.content.slice(0, MAX_CHARS).trim() : "";
    if (content) conversation.push({ role, content });
  }
  if (conversation.length === 0) {
    return jsonResponse({ error: "Empty message." }, 400, headers);
  }

  // Layer 1 of "defense in depth": run the newest user message through OpenAI's
  // (free) Moderation API before we answer. This catches genuinely harmful input
  // (hate, threats, etc.). NOTE: prompt injection ("ignore previous instructions")
  // is a SEPARATE concern — it's handled structurally (user text never enters the
  // privileged developer prompt) plus the system rules, not by moderation.
  const latestUser = [...conversation].reverse().find((m) => m.role === "user");
  if (latestUser && (await isFlagged(latestUser.content, env.OPENAI_API_KEY))) {
    // Return a friendly refusal as a normal text reply so the widget renders it inline.
    return new Response(
      "I'm just here to chat about Ken and his work — happy to help with anything along those lines!",
      { headers: { ...headers, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } }
    );
  }

  let upstream;
  try {
    upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        // The stable system prompt goes first so OpenAI auto-caches it across requests.
        messages: [{ role: "developer", content: SYSTEM_PROMPT }, ...conversation],
        max_completion_tokens: MAX_OUTPUT_TOKENS,
        reasoning_effort: "low",
        stream: true,
      }),
    });
  } catch (err) {
    console.error("OpenAI fetch failed:", err);
    return jsonResponse({ error: "The assistant is unavailable right now. Please try again." }, 502, headers);
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error("OpenAI error", upstream.status, detail.slice(0, 500));
    return jsonResponse({ error: "The assistant is unavailable right now. Please try again." }, 502, headers);
  }

  // Convert OpenAI's SSE stream into a plain-text stream of answer tokens.
  const textStream = upstream.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(openAiSseToText())
    .pipeThrough(new TextEncoderStream());

  return new Response(textStream, {
    headers: {
      ...headers,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// Returns true if OpenAI's Moderation API flags the text as harmful.
// Deliberately "fails open" (returns false on any error) so a moderation outage
// never blocks legitimate visitors — a tradeoff worth discussing in class.
async function isFlagged(text, apiKey) {
  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
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

// Parse OpenAI chat-completions SSE chunks and emit only the assistant text deltas.
function openAiSseToText() {
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
