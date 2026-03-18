/**
 * Migration script: Import existing blog posts from data/blog.json into Sanity.
 *
 * Usage:
 *   1. Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN in .env.local or .env
 *   2. Run: node scripts/migrate-to-sanity.js
 *
 * Requires a Sanity write token (not read-only).
 * Get one from: https://www.sanity.io/manage → Your Project → API → Tokens → Add token (Editor)
 */

const { createClient } = require("@sanity/client");
const fs = require("fs");
const path = require("path");

// Load .env then .env.local so env vars are available when running: node scripts/migrate-to-sanity.js
const root = path.join(__dirname, "..");
for (const file of [".env", ".env.local"]) {
  const p = path.join(root, file);
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, "utf-8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.replace(/\r$/, "").trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m) {
        const val = m[2].replace(/^["']|["']$/g, "").trim();
        process.env[m[1]] = val;
      }
    }
  }
}

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const TOKEN = process.env.SANITY_API_TOKEN;

if (!PROJECT_ID || !TOKEN) {
  console.error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_TOKEN");
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: "2024-01-01",
  token: TOKEN,
  useCdn: false,
});

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function migrate() {
  const blogPath = path.join(__dirname, "..", "data", "blog.json");
  if (!fs.existsSync(blogPath)) {
    console.error("data/blog.json not found. Nothing to migrate.");
    process.exit(1);
  }

  const posts = JSON.parse(fs.readFileSync(blogPath, "utf-8"));
  console.log(`Found ${posts.length} posts to migrate.\n`);

  let success = 0;
  let skipped = 0;

  for (const post of posts) {
    const slug = post.slug || slugify(post.title);

    const existing = await client.fetch(
      `count(*[_type == "blogPost" && slug.current == $slug])`,
      { slug }
    );
    if (existing > 0) {
      console.log(`  SKIP: "${post.title}" (slug "${slug}" already exists)`);
      skipped++;
      continue;
    }

    const doc = {
      _type: "blogPost",
      title: post.title || "Untitled",
      slug: { _type: "slug", current: slug },
      excerpt: post.excerpt || "",
      category: post.category || "Fashion",
      featured: post.featured || false,
      niche: post.niche || [],
      imageAspectRatio: post.imageAspectRatio || undefined,
      publishedDate: post.publishedDate
        ? new Date(post.publishedDate).toISOString()
        : post.createdAt
          ? new Date(post.createdAt).toISOString()
          : new Date().toISOString(),
      metaTitle: post.meta_title || "",
      metaDescription: post.meta_description || "",
      storeSlug: post.storeSlug || "",
      storeCtaLabel: post.storeCtaLabel || "",
    };

    // Convert HTML content to a simple portable text block (plain paragraph)
    if (post.content) {
      doc.content = [
        {
          _type: "block",
          _key: `migrated_${Date.now()}`,
          style: "normal",
          markDefs: [],
          children: [
            {
              _type: "span",
              _key: `span_${Date.now()}`,
              text: `[Migrated HTML – edit in Studio] ${post.content.replace(/<[^>]+>/g, "").slice(0, 500)}`,
              marks: [],
            },
          ],
        },
      ];
    }

    // External image URL – store as reference string (Sanity can't import external URLs as assets automatically)
    // You'll need to manually re-upload images in Studio or use the Sanity CLI asset pipeline.

    try {
      const created = await client.create(doc);
      console.log(`  OK: "${post.title}" → ${created._id}`);
      success++;
    } catch (err) {
      console.error(`  FAIL: "${post.title}" – ${err.message}`);
    }
  }

  console.log(`\nDone! ${success} imported, ${skipped} skipped.`);
}

migrate().catch(console.error);
