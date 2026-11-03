import { redirect } from "next/navigation";
import { createClient } from "./supabase-server";
import { prisma } from "./prisma";
import type { Role, User } from "@prisma/client";

export async function getSessionUser(): Promise<User | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const user = await prisma.user.findUnique({ where: { email: data.user.email ?? "" } });
  if (!user || user.status !== "ACTIVE") return null;
  return user;
}

export async function requireRole(role: Role): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(currentPath())}`);
  if (user.role !== role) redirect("/403");
  return user;
}

export async function requireAnyRole(roles: Role[]): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(currentPath())}`);
  if (!roles.includes(user.role)) redirect("/403");
  return user;
}

function currentPath() {
  return "/";
}
