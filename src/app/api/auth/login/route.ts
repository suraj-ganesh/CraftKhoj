import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, createSessionToken, verifyPassword } from "@/lib/auth";
import { badRequest, unauthorized } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest("Email and password are required.");

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return unauthorized("No account found with that email.");

  if (user.status !== "ACTIVE") {
    return unauthorized("This account has been deactivated. Contact an administrator.");
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return unauthorized("Incorrect password. Please try again.");

  const token = await createSessionToken({ sub: String(user.id), role: user.role, email: user.email });
  const res = NextResponse.json({ user: { id: user.id, fullName: user.fullName, role: user.role } });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
