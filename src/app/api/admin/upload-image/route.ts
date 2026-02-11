import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, getCookieName } from "@/lib/admin-auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = "public/uploads";

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(getCookieName())?.value;
  return cookie ? verifySession(cookie) : false;
}

function getExt(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
  };
  return map[mime] ?? ".jpg";
}

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") ?? formData.get("image");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file. Send a field named 'file' or 'image'." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, GIF, WebP allowed." },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 5MB." },
        { status: 400 }
      );
    }

    const dir = path.join(process.cwd(), UPLOAD_DIR);
    await mkdir(dir, { recursive: true });
    const ext = getExt(file.type);
    const name = `blog-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const filePath = path.join(dir, name);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // URL that the browser can load (relative to site root)
    const url = `/uploads/${name}`;
    return NextResponse.json({ url, name });
  } catch (err) {
    console.error("Upload image error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
