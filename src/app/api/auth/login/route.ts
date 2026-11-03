import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
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
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
  if (error || !data.session) return unauthorized("Invalid email or password.");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE") {
    await supabase.auth.signOut();
    return unauthorized("This account has been deactivated. Contact an administrator.");
  }

  return NextResponse.json({ user: { id: user.id, fullName: user.fullName, role: user.role } });
}
