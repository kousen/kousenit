// Generates the derived content artifacts from the single source data:
//   1. functions/api/_kb-data.js  — the chatbot's linkable knowledge.
//   2. static/llms-full.txt       — the full agent reference (= the bot's brain).
//   3. static/llms.txt            — a concise agent index per llmstxt.org.
//
// Pure generation lives in generateArtifacts() (unit-tested); file I/O happens
// only when this script is run directly (node scripts/build-kb.mjs), guarded so
// importing it for tests has no side effects.
//
// Sources: functions/api/_knowledge.js (stable bio/themes), data/projects.json,
// data/recent.json (optional), and the BOOKS list below. No third-party deps.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { KNOWLEDGE_BASE } from "../functions/api/_knowledge.js";

export const SITE = "https://www.kousenit.com";

export const SUMMARY =
  "Ken Kousen is a Java Champion, author of seven technical books, and a trainer and speaker on Java, " +
  "Kotlin, Spring, Gradle, Android, and practical AI/LLM integration. He runs Kousen IT, Inc., teaches " +
  'at Trinity College, and publishes the weekly "Tales from the jar side" newsletter and YouTube channel. ' +
  "Contact: ken.kousen@kousenit.com";

export const BOOKS = [
  { title: "Claude Code: Up and Running", slug: "claude-code-up-and-running", note: "agentic coding with Claude Code (O'Reilly, Early Release — 10 of 11 chapters available)" },
  { title: "Mockito Made Clear", slug: "mockito-made-clear", note: "Mockito / testing (Pragmatic Bookshelf)" },
  { title: "Help Your Boss Help You", slug: "help-your-boss-help-you", note: "managing up for technical pros (Pragmatic Bookshelf)" },
  { title: "Kotlin Cookbook", slug: "kotlin-cookbook", note: "Kotlin recipes (O'Reilly)" },
  { title: "Modern Java Recipes", slug: "modern-java-recipes", note: "modern/functional Java (O'Reilly)" },
  { title: "Gradle Recipes for Android", slug: "gradle-recipes-for-android", note: "Gradle for Android (O'Reilly)" },
  { title: "Making Java Groovy", slug: "making-java-groovy", note: "the Groovy/Java intersection (Manning)" },
];

export const LINKS = [
  ["Newsletter (Tales from the jar side)", "https://kenkousen.substack.com"],
  ["YouTube (Tales from the jar side)", "https://youtube.com/@talesfromthejarside"],
  ["Blog (Stuff I've Learned Recently)", "https://kousenit.org"],
  ["GitHub", "https://github.com/kousen"],
  ["LinkedIn", "https://www.linkedin.com/in/kenkousen/"],
  ["Bluesky", "https://bsky.app/profile/kousenit.com"],
];

const bookLink = (b) => `[${b.title}](${SITE}/publications/${b.slug}/)`;

// Pure: turn the data into the three artifact strings.
export function generateArtifacts({
  projects = { projects: [], training: [] },
  recent = { issues: [], videos: [] },
  books = BOOKS,
  knowledgeBase = KNOWLEDGE_BASE,
} = {}) {
  // --- chatbot KB data (terse, link-rich) ---
  const kb = [];
  kb.push("# Books (link to the book's page when you mention it)");
  for (const b of books) kb.push(`- ${bookLink(b)} — ${b.note}`);
  kb.push("", "# Projects & open-source tools (link the GitHub repo; add the live demo if present)");
  for (const p of projects.projects ?? []) {
    let s = `- ${p.name}`;
    if (p.kind) s += ` (${p.kind})`;
    s += ` — ${p.description} GitHub: ${p.repo}`;
    if (p.live) s += ` · Live demo: ${p.live}`;
    kb.push(s);
  }
  kb.push("", "# Training materials (open-source course repos)");
  for (const t of projects.training ?? []) kb.push(`- ${t.name}: ${t.description} GitHub: ${t.repo}`);
  if (recent.issues?.length) {
    kb.push("", "# Recent newsletter issues (link the issue URL when relevant)");
    for (const i of recent.issues) kb.push(`- [${i.title}](${i.url})${i.date ? ` — ${i.date}` : ""}`);
  }
  if (recent.videos?.length) {
    kb.push("", "# Recent YouTube videos (link the video URL when relevant)");
    for (const v of recent.videos) kb.push(`- [${v.title}](${v.url})${v.date ? ` — ${v.date}` : ""}`);
  }
  const kbData = kb.join("\n");

  // --- llms.txt index ---
  const idx = [];
  idx.push("# Ken Kousen", "", `> ${SUMMARY}`, "");
  idx.push("## Books");
  for (const b of books) idx.push(`- ${bookLink(b)}: ${b.note}`);
  idx.push("", "## Projects");
  for (const p of projects.projects ?? []) {
    idx.push(`- [${p.name}](${p.repo}): ${p.description}${p.live ? ` (live: ${p.live})` : ""}`);
  }
  idx.push("", "## Training materials");
  for (const t of projects.training ?? []) idx.push(`- [${t.name}](${t.repo}): ${t.description}`);
  if (recent.issues?.length) {
    idx.push("", "## Recent newsletter issues");
    for (const i of recent.issues) idx.push(`- [${i.title}](${i.url})`);
  }
  if (recent.videos?.length) {
    idx.push("", "## Recent videos");
    for (const v of recent.videos) idx.push(`- [${v.title}](${v.url})`);
  }
  idx.push("", "## Links");
  for (const [label, url] of LINKS) idx.push(`- [${label}](${url})`);
  idx.push("");
  const llms = idx.join("\n");

  const llmsFull =
    "# Ken Kousen — full reference for AI agents\n\n" +
    `> ${SUMMARY}\n\n` +
    "This file is auto-generated from kousenit.com's data and is the same knowledge the site chatbot uses.\n\n" +
    knowledgeBase +
    "\n\n" +
    kbData +
    "\n";

  return { kbData, llms, llmsFull };
}

// --- CLI (only when run directly; importing this module has no side effects) ---
const isMain = import.meta.url === pathToFileURL(process.argv[1] || "").href;
if (isMain) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const read = (p, fb) => (existsSync(join(root, p)) ? JSON.parse(readFileSync(join(root, p), "utf8")) : fb);
  const projects = read("data/projects.json", { projects: [], training: [] });
  const recent = read("data/recent.json", { issues: [], videos: [] });

  const { kbData, llms, llmsFull } = generateArtifacts({ projects, recent });

  writeFileSync(
    join(root, "functions/api/_kb-data.js"),
    "// AUTO-GENERATED by scripts/build-kb.mjs — do not edit by hand.\n" +
      "// Sources: data/projects.json + data/recent.json. Regenerated daily by the\n" +
      "// refresh-kb GitHub Action, or on demand: node scripts/build-kb.mjs\n" +
      `export const KB_DATA = ${JSON.stringify(kbData)};\n`
  );
  writeFileSync(join(root, "static/llms.txt"), llms);
  writeFileSync(join(root, "static/llms-full.txt"), llmsFull);

  console.log(
    `Generated _kb-data.js (${kbData.length} chars), static/llms.txt, static/llms-full.txt ` +
      `[${projects.projects?.length ?? 0} projects, ${projects.training?.length ?? 0} training, ` +
      `${recent.issues?.length ?? 0} issues, ${recent.videos?.length ?? 0} videos]`
  );
}
