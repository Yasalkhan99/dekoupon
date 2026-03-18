const fs = require("fs");
const path = require("path");

const BELFFIN_LINK = "https://commissionbag.com/go/4upburui";
const A_TAG = `<a href="${BELFFIN_LINK}" target="_blank" rel="noopener noreferrer">`;

const blogPath = path.join(__dirname, "..", "data", "blog.json");
const posts = JSON.parse(fs.readFileSync(blogPath, "utf-8"));
const post = posts.find((p) => p.id === "belffin-2026");
if (!post || !post.content) {
  console.log("Belffin post not found");
  process.exit(1);
}

let content = post.content;

// 1) H1 – title
content = content.replace(
  /<h1>Latest Belffin Coupon Codes &amp; Promo Offers \(2026 Updated\)<\/h1>/,
  `${A_TAG}<h1>Latest Belffin Coupon Codes &amp; Promo Offers (2026 Updated)</h1></a>`
);

// 2) H2/H3 headings – wrap with link
const headings = [
  "<h2>Active Belffin Coupon Code (2026)</h2>",
  "<h2>Types of Belffin Discount Offerings</h2>",
  "<h3>Belffin Promo Code Offers</h3>",
  "<h3>Belffin Exclusive Online Coupons</h3>",
  "<h3>Discounts on Sectionals and Modulars</h3>",
  "<h3>Free Shipping Offers</h3>",
  "<h3>Belffin Clearance Sale</h3>",
  "<h2>Updated Belffin Savings for 2026 on SavingsHub4u</h2>",
  "<h2>How to Apply a Belffin Coupon Code?</h2>",
];

for (const h of headings) {
  const inner = h.replace(/^<h[23]>|<\/h[23]>$/g, "");
  content = content.replace(h, `${A_TAG}${h}</a>`);
}

// 3) Images – wrap <p><img ... /></p> with link
content = content.replace(
  /<p>(<img[^>]+\/>)<\/p>/g,
  (match, img) => `<p>${A_TAG}${img}</a></p>`
);

// 4) Link brand name everywhere (Belffin, Belfin, belffin, Belfins') only when NOT already inside an <a>
const OPEN = "\u0001O\u0001";
const CLOSE = "\u0001C\u0001";
content = content.replace(
  /<a href="https:\/\/commissionbag\.com\/go\/4upburui"[^>]*>/g,
  OPEN
);
content = content.replace(/<\/a>/g, CLOSE);
const parts = content.split(CLOSE);
content = parts
  .map((part, i) => {
    const segs = part.split(OPEN);
    return segs
      .map((seg, j) => {
        if (j % 2 === 1) return seg;
        return seg.replace(/(Belffin|Belfin|belffin|Belfins')/gi, (m) => `${A_TAG}${m}</a>`);
      })
      .join(OPEN);
  })
  .join(CLOSE);
content = content.split(OPEN).join('<a href="https://commissionbag.com/go/4upburui" target="_blank" rel="noopener noreferrer">');
content = content.split(CLOSE).join("</a>");

post.content = content;
fs.writeFileSync(blogPath, JSON.stringify(posts, null, 2), "utf-8");
console.log("Belffin links added (headings, images, brand names).");
