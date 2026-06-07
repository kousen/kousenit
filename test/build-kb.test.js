import { describe, it, expect } from "vitest";
import { generateArtifacts } from "../scripts/build-kb.mjs";

const projects = {
  projects: [
    {
      name: "MockHub",
      repo: "https://github.com/kousen/mockhub",
      live: "https://mockhub.kousenit.com",
      kind: "MCP server",
      description: "A marketplace.",
    },
  ],
  training: [
    { name: "Claude Code", repo: "https://github.com/kousen/claude-code-training", description: "CC course." },
  ],
};
const recent = {
  issues: [{ title: "Issue One", url: "https://kenkousen.substack.com/p/one", date: "Sun, 31 May 2026" }],
  videos: [{ title: "A Video", url: "https://www.youtube.com/watch?v=abc", date: "2026-03-02" }],
};

describe("generateArtifacts", () => {
  const { kbData, llms, llmsFull } = generateArtifacts({ projects, recent, knowledgeBase: "STABLE-BIO" });

  it("links each book to its publication page", () => {
    expect(kbData).toContain("[Mockito Made Clear](https://www.kousenit.com/publications/mockito-made-clear/)");
  });

  it("lists projects with repo and live-demo URLs", () => {
    expect(kbData).toContain("GitHub: https://github.com/kousen/mockhub");
    expect(kbData).toContain("Live demo: https://mockhub.kousenit.com");
  });

  it("lists training repos", () => {
    expect(kbData).toContain("Claude Code: CC course. GitHub: https://github.com/kousen/claude-code-training");
  });

  it("includes recent issues + videos with their real URLs", () => {
    expect(kbData).toContain("[Issue One](https://kenkousen.substack.com/p/one)");
    expect(kbData).toContain("https://www.youtube.com/watch?v=abc");
  });

  it("never emits an empty or undefined URL", () => {
    expect(kbData).not.toMatch(/\]\(\s*\)/); // empty markdown link
    expect(kbData).not.toContain("undefined");
    expect(llms).not.toContain("undefined");
  });

  it("llms.txt follows the llmstxt.org shape", () => {
    expect(llms.startsWith("# Ken Kousen\n")).toBe(true);
    expect(llms).toContain("> Ken Kousen is a Java Champion");
    expect(llms).toContain("## Books");
    expect(llms).toContain("## Projects");
    expect(llms).toContain("## Training materials");
    expect(llms).toContain("## Links");
  });

  it("llms-full.txt embeds the stable knowledge base + the generated data", () => {
    expect(llmsFull).toContain("STABLE-BIO");
    expect(llmsFull).toContain("[Mockito Made Clear]");
  });

  it("omits the recent sections entirely when there is no recent data", () => {
    const { kbData: empty } = generateArtifacts({ projects, recent: { issues: [], videos: [] } });
    expect(empty).not.toContain("Recent newsletter issues");
    expect(empty).not.toContain("Recent YouTube videos");
  });

  it("does not throw on completely empty input", () => {
    expect(() => generateArtifacts()).not.toThrow();
  });
});
