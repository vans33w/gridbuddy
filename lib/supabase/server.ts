import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars. Check .env.local and restart npm run dev."
    );
  }

  const cookieStore = await cookies();

  // TypeScript mismatch in some Next versions; runtime works fine.
  const cookieStoreAny = cookieStore as any;

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStoreAny.getAll();
      },
      setAll(cookiesToSet) {
        // In some contexts cookies are read-only; ignore if setting fails.
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStoreAny.set(name, value, options);
          });
        } catch {}
      },
    },
  });
}
