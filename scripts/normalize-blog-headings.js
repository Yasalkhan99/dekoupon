const fs = require("fs");
const path = require("path");

const blogPath = path.join(__dirname, "..", "data", "blog.json");
const posts = JSON.parse(fs.readFileSync(blogPath, "utf-8"));

function normalizePost(post) {
  if (!post.meta_title || !["belffin-2026", "flexispot-2026"].includes(post.id)) return;
  let c = post.content;

  // 1) H3 -> H2
  c = c.replace(/<h3>/gi, "<h2>").replace(/<\/h3>/gi, "</h2>");

  // 2) Single H1 = meta_title (escape & for HTML)
  const metaTitle = post.meta_title.replace(/&/g, "&amp;");
  if (post.id === "belffin-2026") {
    // Belffin: replace inner content of H1 (any content including nested <a>) with meta_title; keep outer <a><a> wrapper
    c = c.replace(
      /(<a href="https:\/\/commissionbag\.com\/go\/4upburui"[^>]*><a href="https:\/\/commissionbag\.com\/go\/4upburui"[^>]*><h1>)[\s\S]*?(<\/h1><\/a><\/a>)/,
      `$1${metaTitle}$2`
    );
  } else if (post.id === "flexispot-2026") {
    c = c.replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${metaTitle}</h1>`);
  }

  // 3) Move first image (before first H2) to right after first H2
  // Match first <p> that contains only <a><img...></a> - the intro image
  const imgBlockRegex = /<p><a href="[^"]*"[^>]*><img[^>]+\/><\/a><\/p>/;
  const firstImgMatch = c.match(imgBlockRegex);
  if (!firstImgMatch) return post.content;
  const firstImgBlock = firstImgMatch[0];
  // Remove first image from current position
  c = c.replace(firstImgBlock, "");
  // Find first H2 close so we insert image after it (and after </a></a> if wrapped)
  const match = c.match(/<\/h2>(<\/a><\/a>)?/);
  if (!match) return post.content;
  const firstH2End = c.indexOf(match[0]);
  const insertAt = firstH2End + match[0].length; // after </h2> or </h2></a></a>
  c = c.slice(0, insertAt) + "\n" + firstImgBlock + "\n" + c.slice(insertAt);

  post.content = c;
}

posts.forEach(normalizePost);
fs.writeFileSync(blogPath, JSON.stringify(posts, null, 2), "utf-8");
console.log("Normalized Belffin and FlexiSpot: single H1 = meta_title, all H3 -> H2, first image under first H2.");
