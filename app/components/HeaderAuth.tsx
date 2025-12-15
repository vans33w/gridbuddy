"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/browser";

export default function HeaderAuth() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const pathname = usePathname();

  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setEmail(data.user?.email ?? null);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setEmail(data.user?.email ?? null);
      router.refresh();
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setEmail(null);
    router.push("/");
    router.refresh();
  }

  if (!email) {
    return (
      <div className="flex items-center gap-3 text-sm">
        {pathname !== "/login" && (
          <Link href="/login" className="hover:text-red-600">
            Log in
          </Link>
        )}
        {pathname !== "/signup" && (
          <Link href="/signup" className="hover:text-red-600">
            Sign up
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden sm:inline text-xs opacity-70">{email}</span>
      <button
        onClick={logout}
        className="border px-3 py-1 rounded hover:border-red-600 hover:text-red-600 transition"
      >
        Log out
      </button>
    </div>
  );
}
