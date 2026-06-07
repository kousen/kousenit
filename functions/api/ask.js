// Cloudflare Pages Function — POST /api/ask
// Streams a chatbot answer about Ken from OpenAI, with the system prompt + knowledge
// base held server-side (never trusted from the client).
// Pure helpers live in _lib.js (unit-tested); this file wires them to the request.
import { PERSONA, KNOWLEDGE_BASE } from "./_knowledge.js";
import { KB_DATA } from "./_kb-data.js";
import {
  LIMITS,
  corsHeaders,
  jsonResponse,
  sanitizeMessages,
  isFlagged,
  openAiSseToText,
} from "./_lib.js";

const MODEL = "gpt-5.4-mini";

// Assemble the system prompt: stable PERSONA + KNOWLEDGE_BASE first (so OpenAI
// caches that long prefix across requests), then the generated KB_DATA (books,
// repos, and — once the daily Action runs — recent newsletter issues + videos).
const SYSTEM_PROMPT = `${PERSONA}

========================================
KNOWLEDGE BASE (everything you know about Ken)
========================================

${KNOWLEDGE_BASE}

${KB_DATA}`;

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

  const result = sanitizeMessages(body?.messages);
  if (result.error) return jsonResponse({ error: result.error }, result.status, headers);
  const conversation = result.messages;

  // Defense-in-depth: run the newest user message through OpenAI's (free)
  // Moderation API before answering. This catches genuinely harmful input.
  // NOTE: prompt injection ("ignore previous instructions") is a SEPARATE concern —
  // handled structurally (user text never enters the privileged developer prompt)
  // plus the system rules, not by moderation.
  const latestUser = [...conversation].reverse().find((m) => m.role === "user");
  if (latestUser && (await isFlagged(latestUser.content, env.OPENAI_API_KEY))) {
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
        messages: [{ role: "developer", content: SYSTEM_PROMPT }, ...conversation],
        max_completion_tokens: LIMITS.MAX_OUTPUT_TOKENS,
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
    headers: { ...headers, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
