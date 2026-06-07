import { describe, it, expect } from "vitest";
import { esc, inline, mdToHtml } from "../assets/js/chatbot-markdown.js";

describe("markdown renderer — XSS safety (the important one)", () => {
  it("esc escapes HTML special characters", () => {
    expect(esc("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(esc("a & b < c > d")).toBe("a &amp; b &lt; c &gt; d");
  });

  it("inline neutralizes injected HTML before any formatting", () => {
    const out = inline('<img src=x onerror="alert(1)">');
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;img");
  });

  it("does NOT turn a javascript: pseudo-URL into a link", () => {
    expect(inline("[click](javascript:alert(1))")).not.toContain('<a href="javascript');
  });

  it("keeps injected HTML escaped inside list items", () => {
    expect(mdToHtml("- <b>x</b>")).toContain("&lt;b&gt;x&lt;/b&gt;");
  });
});

describe("markdown renderer — formatting", () => {
  it("renders bold and inline code", () => {
    expect(inline("**hi**")).toContain("<strong>hi</strong>");
    expect(inline("`x`")).toContain("<code>x</code>");
  });

  it("renders http(s) markdown links with safe attributes", () => {
    const out = inline("[site](https://kousenit.com)");
    expect(out).toContain('<a href="https://kousenit.com"');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('target="_blank"');
  });

  it("autolinks bare emails to mailto:", () => {
    expect(inline("ken.kousen@kousenit.com")).toContain('<a href="mailto:ken.kousen@kousenit.com">');
  });

  it("mdToHtml renders bullet lists", () => {
    expect(mdToHtml("- one\n- two")).toBe("<ul><li>one</li><li>two</li></ul>");
  });

  it("mdToHtml wraps prose lines in paragraphs and skips blank lines", () => {
    expect(mdToHtml("hello\n\nworld")).toBe("<p>hello</p><p>world</p>");
  });
});
