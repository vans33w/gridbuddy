"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "../lib/supabase/browser";

export default function HomePage() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, [supabase]);

  async function logout() {
    await supabase.auth.signOut();
    setEmail(null);
    window.location.href = "/login";
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Race Buddy</h1>

      <p className="text-sm opacity-80">
        {email ? `Logged in as: ${email}` : "Not logged in"}
      </p>

      <div className="flex gap-4">
        <Link className="underline" href="/login">Login</Link>
        <Link className="underline" href="/moments">Moments</Link>
        <Link className="underline" href="/tracks">Tracks</Link>
        <Link className="underline" href="/popular-tracks">Popular</Link>
        {email && (
          <button className="underline" onClick={logout}>
            Logout
          </button>
        )}
      </div>
    </main>
  );
}