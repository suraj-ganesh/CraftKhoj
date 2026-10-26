import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, badRequest, notFound, json, unauthorized } from "@/lib/api";
import { refreshTrustScore } from "@/lib/algorithms";

const schema = z.object({ decision: z.enum(["APPROVED", "REJECTED"]), remarks: z.string().max(2000).optional() });

type Ctx = { params: Promise<{ id: string }> };

/** PUT /api/verifier/artisans/:id — verifier approves/rejects artisan registration. */
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { user, response } = await requireUser(["VERIFIER", "ADMIN"]);
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const profileId = Number(id);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Decision must be APPROVED or REJECTED.");
  const { decision, remarks } = parsed.data;

  const profile = await prisma.artisanProfile.findUnique({ where: { id: profileId } });
  if (!profile) return notFound("Artisan profile not found");

  await prisma.$transaction([
    prisma.artisanProfile.update({
      where: { id: profileId },
      data: { verificationStatus: decision, verificationNote: remarks ?? null },
    }),
    prisma.verificationLog.create({
      data: { verifierId: user.id, decision, remarks, artisanProfileId: profileId },
    }),
  ]);

  const score = await refreshTrustScore(profileId);
  return json({ ok: true, trustScore: score });
}
