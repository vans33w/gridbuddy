"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/browser";

export default function HeaderAuth() {
  const supabase = supabaseBrowser();
  const pathname = usePathname();

  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    setLoading(true);
    const { data } = await supabase.auth.getUser();
    setEmail(data.user?.email ?? null);
    setLoading(false);
  }

  useEffect(() => {
    refreshUser();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refreshUser();
    });

    return () => {
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setEmail(null);

    // ✅ Guaranteed update: full reload to a logged-out state
    window.location.href = "/";
  }

  if (loading) return <div className="text-xs opacity-60">Checking…</div>;

  if (!email) {
    return (
      <div className="flex items-center gap-3 text-sm">
        {pathname !== "/login" && (
          <Link href="/login" className="hover:text-red-600 transition-colors">
            Log in
          </Link>
        )}
        {pathname !== "/signup" && (
          <Link href="/signup" className="hover:text-red-600 transition-colors">
            Sign up
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden sm:inline text-xs opacity-70">{email}</span>
      <button onClick={logout} className="btn-secondary px-3 py-1">
        Log out
      </button>
    </div>
  );
}
