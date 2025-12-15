"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/browser";

export default function LoginPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already logged in, don’t stay on login page
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        router.replace("/");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin() {
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // ✅ SUCCESS → redirect immediately
    router.push("/");
  }

  return (
    <main className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Log in</h1>

      <div className="border rounded-xl p-4 space-y-3">
        <input
          className="border p-2 w-full"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border p-2 w-full"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="border px-4 py-2 w-full"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in…" : "Log in"}
        </button>

        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>

      {/* ✅ Clear signup link */}
      <p className="text-sm opacity-80">
        Don’t have an account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
