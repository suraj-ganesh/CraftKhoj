import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, readSessionToken } from "./auth";
import { prisma } from "./prisma";
import type { Role, User } from "@prisma/client";

export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await readSessionToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } });
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
