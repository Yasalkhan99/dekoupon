/**
 * Demote `<h1>` tags in CMS HTML so the page keeps a single document `<h1>`
 * (e.g. hero title on blog posts). Safe for repeated application.
 */
export function demoteHtmlH1ToH2(html: string): string {
  if (!html) return html;
  return html.replace(/<\/h1>/gi, "</h2>").replace(/<h1\b/gi, "<h2");
}
