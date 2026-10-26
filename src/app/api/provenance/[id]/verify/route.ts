import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, badRequest, notFound, json } from "@/lib/api";
import { generateProvenanceId, refreshRiskScore, refreshTrustScore } from "@/lib/algorithms";

const schema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "CHANGES_REQUESTED"]),
  remarks: z.string().max(2000).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

/** PUT /api/provenance/:id/verify — verifier approves/rejects provenance claims. */
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { user, response } = await requireUser(["VERIFIER", "ADMIN"]);
  if (!user) return response!;
  const { id } = await ctx.params;
  const recordId = Number(id);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Decision must be APPROVED, REJECTED, or CHANGES_REQUESTED.");
  const { decision, remarks } = parsed.data;

  const record = await prisma.provenanceRecord.findUnique({
    where: { id: recordId },
    include: { product: { include: { artisan: true, category: true } } },
  });
  if (!record) return notFound("Provenance record not found");
  if (record.verificationStatus !== "PENDING" && decision !== record.verificationStatus) {
    return badRequest("This provenance record has already been verified.");
  }

  let provenanceId = record.product.provenanceId;

  const updatedRecord = await prisma.$transaction(async (tx) => {
    const updated = await tx.provenanceRecord.update({
      where: { id: recordId },
      data: {
        verificationStatus: decision,
        verificationNote: remarks ?? null,
        verifierId: user!.id,
        verifiedAt: new Date(),
      },
    });

    if (decision === "APPROVED") {
      const district = record.product.artisan.district ?? record.product.origin ?? "NP";
      provenanceId = provenanceId ?? (await generateProvenanceId(district));
      await tx.product.update({
        where: { id: record.productId },
        data: { status: "APPROVED", provenanceId },
      });
    } else {
      await tx.product.update({
        where: { id: record.productId },
        data: { status: "REJECTED", provenanceId: null },
      });
    }

    await tx.provenanceEvent.create({
      data: {
        provenanceRecordId: recordId,
        eventType: decision,
        description:
          remarks ||
          {
            APPROVED: "Evidence accepted — Craft Provenance ID issued.",
            REJECTED: "Evidence insufficient — provenance rejected.",
            CHANGES_REQUESTED: "Changes requested — see verification remarks.",
          }[decision],
        performedById: user!.id,
      },
    });

    await tx.verificationLog.create({
      data: {
        verifierId: user!.id,
        decision,
        remarks,
        provenanceRecordId: recordId,
      },
    });

    return updated;
  });

  await refreshRiskScore(record.productId);
  await refreshTrustScore(record.product.artisanId);

  return json({
    provenanceRecord: {
      id: updatedRecord.id,
      status: updatedRecord.verificationStatus,
      provenanceId,
    },
  });
}
