import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const AREAS = ["/buyer", "/studio", "/admin"];

function areaOf(path: string) {
  return AREAS.find((p) => path === p || path.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        async setAll(cookiesToSet, headers) {
          const response = NextResponse.next();
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;
  const area = areaOf(path);
  if (!area) return NextResponse.next();

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }

  const role = (user.user_metadata?.role as string) ?? "BUYER";
  const allowedArea: Record<string, string> = {
    BUYER: "/buyer",
    ARTISAN: "/studio",
    ADMIN: "/admin",
  };

  if (allowedArea[role] !== area) {
    const url = req.nextUrl.clone();
    url.pathname = "/403";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/buyer/:path*", "/studio/:path*", "/admin/:path*"],
};
