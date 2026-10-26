import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { json, badRequest, notFound } from "@/lib/api";

/** GET /api/provenance/verify/:provenanceId — public provenance lookup by ID. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ provenanceId: string }> }) {
  const { provenanceId } = await ctx.params;
  const key = decodeURIComponent(provenanceId).trim().toUpperCase();
  if (!key) return badRequest("A provenance ID is required.");

  const product = await prisma.product.findUnique({
    where: { provenanceId: key },
    include: {
      artisan: { include: { user: { select: { fullName: true } } } },
      category: true,
      images: true,
      provenanceRecord: {
        include: {
          verifier: { select: { fullName: true } },
          events: { orderBy: { eventTime: "asc" as const } },
        },
      },
    },
  });

  if (!product) return notFound("No provenance record found for that ID.");
  return json({ product });
}
