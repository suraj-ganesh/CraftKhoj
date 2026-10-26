import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, badRequest, notFound, json } from "@/lib/api";
import { refreshRiskScore } from "@/lib/algorithms";

const schema = z.object({
  productId: z.coerce.number().int().positive(),
  reason: z.string().min(1).max(80).optional(),
  description: z.string().min(10).max(2000),
});

/** POST /api/reports — a user reports a misleading or suspicious product. */
export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return notFound();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Please describe the problem (at least 10 characters).");
  const { productId, reason, description } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return notFound("Product not found");

  const report = await prisma.report.create({
    data: { productId, reporterId: user.id, reason: reason ?? "OTHER", description },
  });
  await refreshRiskScore(productId);

  return json({ report: { id: report.id, status: report.status } }, { status: 201 });
}
