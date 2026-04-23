/**
 * Import Supabase-style CSV (columns: id, data) into public.stores.
 *
 * Usage:
 *   node scripts/import-stores-csv.mjs
 *   node scripts/import-stores-csv.mjs path/to/stores_rows.csv
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env then .env.local (local overrides).
 */

import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFile(rel) {
  const envPath = path.join(process.cwd(), rel);
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1).replace(/\\n/g, "\n");
    }
    process.env[key] = val;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local or export before running."
  );
  process.exit(1);
}

const csvPath =
  process.argv[2] ?? path.join(process.cwd(), "public", "stores_rows.csv");

if (!fs.existsSync(csvPath)) {
  console.error("CSV not found:", csvPath);
  process.exit(1);
}

console.log("Reading", csvPath);
const content = fs.readFileSync(csvPath, "utf8");

const records = parse(content, {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,
  bom: true,
});

if (!records.length) {
  console.error("No rows parsed (check CSV header: id,data)");
  process.exit(1);
}

const missing = records.find((r) => !r.id || r.data === undefined);
if (missing) {
  console.error("Row missing id or data:", Object.keys(missing));
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Small batches: each row's data jsonb can be large (base64 logos). */
const BATCH = 8;
let ok = 0;

for (let i = 0; i < records.length; i += BATCH) {
  const slice = records.slice(i, i + BATCH);
  const chunk = [];
  for (const row of slice) {
    try {
      const dataObj = JSON.parse(row.data);
      chunk.push({ id: String(row.id).trim(), data: dataObj });
    } catch (e) {
      console.error("JSON.parse failed for id", row.id, e.message);
      process.exit(1);
    }
  }

  const { error } = await supabase.from("stores").upsert(chunk, { onConflict: "id" });
  if (error) {
    console.error("Upsert error at offset", i, error.message);
    process.exit(1);
  }
  ok += chunk.length;
  console.log("Upserted", ok, "/", records.length);
}

console.log("Done. Total rows:", ok);
