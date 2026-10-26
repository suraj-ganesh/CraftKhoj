import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function secretKey() {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? "craftkhoj-dev-secret");
}

const AREAS = ["/buyer", "/studio", "/verifier", "/admin"];

function areaOf(path: string) {
  return AREAS.find((p) => path === p || path.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const area = areaOf(path);
  if (!area) return NextResponse.next();

  const token = req.cookies.get("ck_session")?.value;
  let role: string | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secretKey());
      role = typeof payload.role === "string" ? payload.role : null;
    } catch {
      role = null;
    }
  }

  const url = req.nextUrl.clone();

  if (!role) {
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }

  const allowedArea: Record<string, string> = {
    BUYER: "/buyer",
    ARTISAN: "/studio",
    VERIFIER: "/verifier",
    ADMIN: "/admin",
  };

  if (allowedArea[role] !== area) {
    url.pathname = "/403";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/buyer/:path*", "/studio/:path*", "/verifier/:path*", "/admin/:path*"],
};
