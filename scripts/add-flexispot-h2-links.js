const fs = require("fs");
const path = require("path");

const LINK = "https://commissionbag.com/go/iuhhi2-_";
const wrapH2 = (html) =>
  html
    .replace(/<h2>/g, `<a href="${LINK}" target="_blank" rel="noopener noreferrer"><a href="${LINK}" target="_blank" rel="noopener noreferrer"><h2>`)
    .replace(/<\/h2>/g, `</h2></a></a>`);

const blogPath = path.join(__dirname, "..", "data", "blog.json");
const posts = JSON.parse(fs.readFileSync(blogPath, "utf-8"));
const post = posts.find((p) => p.id === "flexispot-2026");
if (!post) {
  console.log("FlexiSpot post not found.");
  process.exit(1);
}
post.content = wrapH2(post.content);
fs.writeFileSync(blogPath, JSON.stringify(posts, null, 2), "utf-8");
console.log("H2 links added to FlexiSpot post.");
