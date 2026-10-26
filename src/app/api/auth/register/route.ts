import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, hashPassword } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/auth";
import { badRequest } from "@/lib/api";

const schema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email().max(150),
  password: z.string().min(8).max(72),
  role: z.enum(["BUYER", "ARTISAN"]),
  craftSpecialty: z.string().optional(),
  district: z.string().optional(),
  workshopAddress: z.string().optional(),
  bio: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

  const { fullName, email, password, role } = parsed.data;
  const emailNorm = email.toLowerCase().trim();

  const exists = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (exists) return badRequest("This email is already registered. Please log in instead.");

  const passwordHash = await hashPassword(password);

  const user = role === "ARTISAN"
    ? await prisma.user.create({
        data: {
          fullName,
          email: emailNorm,
          passwordHash,
          role: "ARTISAN",
          artisanProfile: {
            create: {
              craftSpecialty: parsed.data.craftSpecialty ?? "",
              bio: parsed.data.bio ?? "",
              district: parsed.data.district ?? "",
              workshopAddress: parsed.data.workshopAddress ?? "",
            },
          },
        },
        include: { artisanProfile: true },
      })
    : await prisma.user.create({
        data: { fullName, email: emailNorm, passwordHash, role: "BUYER" },
        include: { artisanProfile: true },
      });

  const token = await createSessionToken({ sub: String(user.id), role: user.role, email: user.email });
  const res = NextResponse.json({ user: { id: user.id, fullName: user.fullName, role: user.role } }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
