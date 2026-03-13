import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

const SANITY_WEBHOOK_SECRET = process.env.SANITY_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (SANITY_WEBHOOK_SECRET) {
    const secret = request.headers.get("x-sanity-secret");
    if (secret !== SANITY_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    revalidatePath("/", "layout");
    revalidatePath("/blog/[slug]", "page");
    revalidatePath("/blog/category/[slug]", "page");

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
}
