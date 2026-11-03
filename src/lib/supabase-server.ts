import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = () =>
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
    {
      cookies: {
        async getAll() {
          const c = await cookies();
          return c.getAll();
        },
        async setAll(cookiesToSet) {
          const c = await cookies();
          for (const { name, value } of cookiesToSet) {
            c.set(name, value);
          }
        },
      },
    }
  );
