// Minimal, escape-first markdown rendering for the chat widget: bold, inline
// code, links, emails, and bullet lists. HTML is escaped BEFORE any regex runs,
// so neither user input nor model output can inject markup (XSS-safe).
//
// This module is the single source: it is unit-tested directly, and inlined
// into the chat widget partial at build time (Hugo strips the `export `
// keywords so the functions live inside the widget's IIFE).
export function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g, '<a href="mailto:$1">$1</a>');
}

export function mdToHtml(md) {
  var lines = String(md).split("\n"), out = "", inList = false;
  for (var i = 0; i < lines.length; i++) {
    var m = lines[i].match(/^\s*[-*]\s+(.*)$/);
    if (m) {
      if (!inList) { out += "<ul>"; inList = true; }
      out += "<li>" + inline(m[1]) + "</li>";
      continue;
    }
    if (inList) { out += "</ul>"; inList = false; }
    if (lines[i].trim() === "") continue;
    out += "<p>" + inline(lines[i]) + "</p>";
  }
  if (inList) out += "</ul>";
  return out;
}
