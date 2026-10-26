import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, badRequest, json, unauthorized, notFound } from "@/lib/api";

/** GET /api/categories — public. */
export async function GET() {
  const categories = await prisma.craftCategory.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  return json({ categories });
}

const createSchema = z.object({ name: z.string().min(2).max(100), description: z.string().optional() });

/** POST /api/categories — admin manages categories, regions, craft types. */
export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(["ADMIN"]);
  if (!user) return unauthorized();
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Category name is required.");
  const exists = await prisma.craftCategory.findUnique({ where: { name: parsed.data.name } });
  if (exists) return badRequest("That category already exists.");
  const category = await prisma.craftCategory.create({ data: { name: parsed.data.name, description: parsed.data.description } });
  return json({ category }, { status: 201 });
}

/** DELETE /api/categories — admin. */
export async function DELETE(req: NextRequest) {
  const { user, response } = await requireUser(["ADMIN"]);
  if (!user) return unauthorized();
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return badRequest("Category id required.");
  const category = await prisma.craftCategory.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
  if (!category) return notFound("Category not found");
  if (category._count.products > 0) return badRequest("This category still has products attached.");
  await prisma.craftCategory.delete({ where: { id } });
  return json({ success: true });
}
