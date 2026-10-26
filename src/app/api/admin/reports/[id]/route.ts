import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, badRequest, notFound, json, unauthorized } from "@/lib/api";
import { refreshRiskScore } from "@/lib/algorithms";

const patchSchema = z.object({
  status: z.enum(["OPEN", "RESOLVED", "DISMISSED"]),
  adminRemarks: z.string().max(2000).optional(),
  hideProduct: z.boolean().optional(),
});

/** GET /api/admin/reports/:id — review a single report. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser(["ADMIN"]);
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const report = await prisma.report.findUnique({
    where: { id: Number(id) },
    include: { product: { include: { artisan: { include: { user: { select: { id: true, fullName: true, email: true } } } } } }, reporter: { select: { id: true, fullName: true, email: true } } },
  });
  if (!report) return notFound("Report not found");
  return json({ report });
}

/** PATCH /api/admin/reports/:id — resolve/dismiss a moderation report. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser(["ADMIN"]);
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid moderation update.");
  const { status, adminRemarks, hideProduct } = parsed.data;

  const report = await prisma.report.findUnique({ where: { id: Number(id) } });
  if (!report) return notFound("Report not found");

  await prisma.report.update({
    where: { id: report.id },
    data: { status, adminRemarks: adminRemarks ?? null, resolvedById: user.id },
  });
  if (hideProduct) {
    await prisma.product.update({ where: { id: report.productId }, data: { status: "HIDDEN" } });
  }
  await refreshRiskScore(report.productId);
  return json({ success: true });
}
