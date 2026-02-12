import { readFile } from "fs/promises";
import path from "path";
import { getSupabase, SUPABASE_CLICKS_TABLE } from "./supabase-server";

const getClicksPath = () => path.join(process.cwd(), "data", "clicks.json");

type ClickRecord = { id: string; storeId: string; createdAt: string };

async function readClicksFromFile(): Promise<ClickRecord[]> {
  try {
    const data = await readFile(getClicksPath(), "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/** Returns click count per coupon/store id (storeId = coupon id when clicked from store page). Uses Supabase on live so counts persist. */
export async function getClickCounts(): Promise<Record<string, number>> {
  const supabase = getSupabase();
  if (supabase) {
    const { data: rows, error } = await supabase
      .from(SUPABASE_CLICKS_TABLE)
      .select("store_id");
    if (!error && rows?.length) {
      const counts: Record<string, number> = {};
      for (const r of rows) {
        const id = (r as { store_id: string }).store_id;
        if (id) counts[id] = (counts[id] ?? 0) + 1;
      }
      return counts;
    }
  }
  const clicks = await readClicksFromFile();
  const counts: Record<string, number> = {};
  for (const c of clicks) {
    counts[c.storeId] = (counts[c.storeId] ?? 0) + 1;
  }
  return counts;
}
