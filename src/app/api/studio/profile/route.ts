import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, badRequest, json } from "@/lib/api";
import { refreshTrustScore } from "@/lib/algorithms";

const schema = z.object({
  craftSpecialty: z.string().max(200).optional(),
  district: z.string().max(80).optional(),
  bio: z.string().max(2000).optional(),
  workshopAddress: z.string().max(200).optional(),
  portraitUrl: z.string().optional(),
});

/** PUT /api/studio/profile — artisan edits their own workshop profile. */
export async function PUT(req: NextRequest) {
  const { user, response } = await requireUser(["ARTISAN"]);
  if (!user) return response!;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid profile data.");

  const profile = await prisma.artisanProfile.update({
    where: { userId: user.id },
    data: {
      ...(parsed.data.craftSpecialty !== undefined && { craftSpecialty: parsed.data.craftSpecialty }),
      ...(parsed.data.district !== undefined && { district: parsed.data.district }),
      ...(parsed.data.bio !== undefined && { bio: parsed.data.bio }),
      ...(parsed.data.workshopAddress !== undefined && { workshopAddress: parsed.data.workshopAddress }),
      ...(parsed.data.portraitUrl !== undefined && { portraitUrl: parsed.data.portraitUrl }),
    },
  });

  await refreshTrustScore(profile.id);
  return json({ profile });
}

/** GET /api/studio/profile — the artisan's own profile. */
export async function GET() {
  const { user, response } = await requireUser(["ARTISAN"]);
  if (!user) return response!;
  const profile = await prisma.artisanProfile.findUnique({
    where: { userId: user.id },
    include: { user: { select: { fullName: true, email: true } } },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return json({ profile });
}
