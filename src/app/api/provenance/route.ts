import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, badRequest, notFound, json } from "@/lib/api";
import { refreshRiskScore } from "@/lib/algorithms";

const schema = z.object({
  productId: z.coerce.number().int().positive(),
  workshopLocation: z.string().optional(),
  productionDate: z.string().optional(),
  productionMethod: z.string().optional(),
  processNotes: z.string().max(3000).optional(),
  processImageUrl: z.string().optional(),
});

/** POST /api/provenance — artisan submits provenance details for a product. */
export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(["ARTISAN"]);
  if (!user) return response!;
  const profile = await prisma.artisanProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return badRequest("Artisan profile missing.");

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid provenance data.");
  const p = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: p.productId } });
  if (!product) return notFound("Product not found");
  if (product.artisanId !== profile.id) return badRequest("Not your product.");

  const record = await prisma.provenanceRecord.findUnique({ where: { productId: p.productId } });
  if (!record) return notFound("No provenance record for that product yet.");

  const wasPending = record.verificationStatus === "PENDING";

  const updated = await prisma.provenanceRecord.update({
    where: { id: record.id },
    data: {
      workshopLocation: p.workshopLocation ?? record.workshopLocation,
      productionDate: p.productionDate ? new Date(p.productionDate) : record.productionDate,
      productionMethod: p.productionMethod ?? record.productionMethod,
      processNotes: p.processNotes ?? record.processNotes,
      processImageUrl: p.processImageUrl ?? record.processImageUrl,
      verificationStatus: "PENDING",
    },
  });

  if (!wasPending) {
    await prisma.provenanceEvent.create({
      data: {
        provenanceRecordId: record.id,
        eventType: "SUBMITTED",
        description: "Provenance details updated by artisan — awaiting verification.",
        performedById: user.id,
      },
    });
    if (product.status === "APPROVED") {
      await prisma.product.update({ where: { id: product.id }, data: { status: "PENDING" } });
    }
  }

  await refreshRiskScore(product.id);
  return json({ provenanceRecord: { id: updated.id, status: updated.verificationStatus } });
}

/** GET /api/provenance?productId=… — read provenance record + events for dashboard views. */
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) return badRequest("productId is required.");
  const record = await prisma.provenanceRecord.findUnique({
    where: { productId: Number(productId) },
    include: { events: { orderBy: { eventTime: "asc" as const } } },
  });
  if (!record) return notFound("No provenance record yet");
  return json({ provenanceRecord: record });
}
