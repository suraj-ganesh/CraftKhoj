import { NextRequest, NextResponse } from "next/server";
import { requireUser, badRequest, unauthorized } from "@/lib/api";
import { randomBytes } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_SIZE = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** POST /api/upload — local "server storage" upload (Design.md §6 file upload). */
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
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/uploads/${name}` }, { status: 201 });
}
