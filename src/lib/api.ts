import { NextResponse } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "./auth";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";

export const json = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init);
export const badRequest = (message: string) => NextResponse.json({ error: message }, { status: 400 });
export const unauthorized = (message = "Not authenticated") => NextResponse.json({ error: message }, { status: 401 });
export const forbidden = () => NextResponse.json({ error: "Access denied" }, { status: 403 });
export const notFound = (message = "Not found") => NextResponse.json({ error: message }, { status: 404 });

export async function requireUser(roles?: Role[]) {
  const store = await cookiesOrThrow();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return { user: null, response: unauthorized() };
  const payload = await readSessionToken(token);
  if (!payload) return { user: null, response: unauthorized() };
  const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } });
  if (!user || user.status !== "ACTIVE") return { user: null, response: unauthorized() };
  if (roles && !roles.includes(user.role)) return { user: null, response: forbidden() };
  return { user, response: null };
}

import { cookies } from "next/headers";

function cookiesOrThrow() {
  return cookies();
}
