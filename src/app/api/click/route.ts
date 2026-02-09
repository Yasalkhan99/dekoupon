import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const getClicksPath = () => path.join(process.cwd(), "data", "clicks.json");

type ClickRecord = { id: string; storeId: string; createdAt: string };

async function readClicks(): Promise<ClickRecord[]> {
  try {
    const data = await readFile(getClicksPath(), "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function appendClick(storeId: string): Promise<void> {
  const dir = path.dirname(getClicksPath());
  await mkdir(dir, { recursive: true });
  const clicks = await readClicks();
  clicks.push({
    id: crypto.randomUUID(),
    storeId,
    createdAt: new Date().toISOString(),
  });
  await writeFile(getClicksPath(), JSON.stringify(clicks, null, 2), "utf-8");
}

/** GET /api/click?storeId=xxx&redirect=https://... - log click and redirect */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");
  const redirectUrl = searchParams.get("redirect");

  if (!storeId || !redirectUrl) {
    return NextResponse.json({ error: "storeId and redirect required" }, { status: 400 });
  }

  const decoded = decodeURIComponent(redirectUrl);
  if (!decoded.startsWith("http://") && !decoded.startsWith("https://")) {
    return NextResponse.json({ error: "Invalid redirect URL" }, { status: 400 });
  }

  try {
    await appendClick(storeId);
  } catch {
    // On Vercel/serverless, data/ may be read-only; still redirect the user
  }
  return NextResponse.redirect(decoded, 302);
}
