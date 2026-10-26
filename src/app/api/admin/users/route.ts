import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, badRequest, notFound, json, unauthorized } from "@/lib/api";

/** GET /api/admin/users — manage all users and roles. */
export async function GET(req: NextRequest) {
  const { user, response } = await requireUser(["ADMIN"]);
  if (!user) return unauthorized();
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const users = await prisma.user.findMany({
    where: q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : undefined,
    include: { artisanProfile: true },
    orderBy: { createdAt: "desc" },
  });
  return json({
    users: users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      artisanProfileId: u.artisanProfile?.id ?? null,
      trustScore: u.artisanProfile ? Number(u.artisanProfile.trustScore) : null,
      verificationStatus: u.artisanProfile?.verificationStatus ?? null,
    })),
  });
}

const patchSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(["ACTIVE", "DEACTIVATED"]).optional(),
  role: z.enum(["BUYER", "ARTISAN", "VERIFIER", "ADMIN"]).optional(),
});

/** PATCH /api/admin/users — activate/deactivate or change role (TC-10 protection). */
export async function PATCH(req: NextRequest) {
  const { user, response } = await requireUser(["ADMIN"]);
  if (!user) return unauthorized();
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid user update.");
  const { id, status, role } = parsed.data;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return notFound("User not found");
  if (target.id === user.id && (status === "DEACTIVATED" || (role && role !== "ADMIN"))) {
    return badRequest("You cannot deactivate or demote your own admin account.");
  }
  const updated = await prisma.user.update({ where: { id }, data: { ...(status && { status }), ...(role && { role }) } });
  return json({ user: { id: updated.id, role: updated.role, status: updated.status } });
}
