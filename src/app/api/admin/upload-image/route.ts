import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, getCookieName } from "@/lib/admin-auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSupabase, SUPABASE_UPLOADS_BUCKET } from "@/lib/supabase-server";

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

    const ext = getExt(file.type);
    const name = `blog-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.storage
        .from(SUPABASE_UPLOADS_BUCKET)
        .upload(name, file, { contentType: file.type, upsert: false });
      if (error) {
        const hint = error.message?.toLowerCase().includes("bucket") || error.message?.toLowerCase().includes("not found")
          ? ` Create a public bucket named "${SUPABASE_UPLOADS_BUCKET}" in Supabase Dashboard → Storage → New bucket, then set it to Public.`
          : "";
        return NextResponse.json(
          { error: `Supabase Storage: ${error.message}.${hint}` },
          { status: 500 }
        );
      }
      const { data: urlData } = supabase.storage.from(SUPABASE_UPLOADS_BUCKET).getPublicUrl(data.path);
      return NextResponse.json({ url: urlData.publicUrl, name });
    }

    // Live (e.g. Vercel) has read-only filesystem – require Supabase
    const isVercel = process.env.VERCEL === "1";
    if (isVercel) {
      return NextResponse.json(
        {
          error:
            "Featured image upload on live needs Supabase. In Vercel: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. In Supabase Dashboard: Storage → New bucket → name 'uploads' → Public.",
        },
        { status: 503 }
      );
    }

    const dir = path.join(process.cwd(), UPLOAD_DIR);
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, name);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));
    return NextResponse.json({ url: `/uploads/${name}`, name });
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e?.code === "EROFS" || e?.code === "EACCES") {
      return NextResponse.json(
        {
          error:
            "Image upload needs Supabase. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel, then create a public Storage bucket named 'uploads'.",
        },
        { status: 503 }
      );
    }
    console.error("Upload image error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
