import { NextRequest, NextResponse } from "next/server";
import { requireUser, badRequest, unauthorized } from "@/lib/api";
import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";

const MAX_SIZE = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const BUCKET = "craftkhoj-uploads";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_PUBLISHABLE_KEY ?? ""
);

/** POST /api/upload — Supabase Storage upload (server storage) (Design.md A6 file upload). */
export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return unauthorized();

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return badRequest("A file is required.");
  if (!ALLOWED.includes(file.type)) return badRequest("Only JPEG, PNG, WebP, or GIF images are allowed.");
  if (file.size > MAX_SIZE) return badRequest("File is larger than 4MB.");

  const ext = file.type === "image/webp" ? "webp" : file.type === "image/gif" ? "gif" : file.type === "image/png" ? "png" : "jpg";
  const name = `${randomBytes(10).toString("hex")}.${ext}`;
  const filePath = `uploads/${name}`;

  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === BUCKET);
  if (!bucketExists) {
    await supabase.storage.createBucket(BUCKET, { public: true });
  }

  const { data, error } = await supabase.storage.from(BUCKET).upload(filePath, file);
  if (error) return badRequest(error.message);
  const { data: { publicUrl } } = await supabase.storage.from(BUCKET).getPublicUrl(filePath);

  return NextResponse.json({ url: publicUrl }, { status: 201 });
}
