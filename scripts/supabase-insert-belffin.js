const fs = require("fs");
const path = require("path");
const j = fs.readFileSync(path.join(__dirname, "..", "data", "belffin-oneline.json"), "utf8");
const sql = `INSERT INTO blog_posts (id, data) VALUES ('belffin-2026', $json$${j}$json$::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`;
fs.writeFileSync(path.join(__dirname, "..", "data", "insert-belffin.sql"), sql, "utf8");
console.log("SQL length", sql.length);
