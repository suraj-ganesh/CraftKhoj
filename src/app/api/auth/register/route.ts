import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
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

  const supabase = createClient();
  const { error: signUpError } = await supabase.auth.signUp({
    email: emailNorm,
    password,
    options: {
      data: {
        fullName,
        role,
        craftSpecialty: parsed.data.craftSpecialty ?? undefined,
        district: parsed.data.district ?? undefined,
        workshopAddress: parsed.data.workshopAddress ?? undefined,
        bio: parsed.data.bio ?? undefined,
      },
    },
  });
  if (signUpError) return badRequest(signUpError.message);

  const user = role === "ARTISAN"
    ? await prisma.user.create({
        data: {
          fullName,
          email: emailNorm,
          passwordHash: await hashPassword(password),
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
        data: { fullName, email: emailNorm, passwordHash: await hashPassword(password), role: "BUYER" },
        include: { artisanProfile: true },
      });

  const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({ email: emailNorm, password });
  if (signInError || !sessionData.session) {
    return NextResponse.json({ user: { id: user.id, fullName: user.fullName, role: user.role } }, { status: 201 });
  }

  return NextResponse.json({ user: { id: user.id, fullName: user.fullName, role: user.role } }, { status: 201 });
}
