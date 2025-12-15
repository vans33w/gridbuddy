"use client";

import BackHome from "../components/BackHome";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/browser";

export default function SignupPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    // If already logged in, go to app
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) router.replace("/moments");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSignup() {
    setError("");
    setInfo("");
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // If email confirmations are ON, user may need to confirm first
    if (!data.session) {
      setInfo("Check your email to confirm your account, then come back and log in.");
      return;
    }

    // If confirmations are OFF, they’re logged in immediately
    router.push("/moments");
  }

  return (
    <main className="p-6 space-y-4 max-w-md">
      <BackHome />

      <h1 className="text-2xl font-bold">Sign up</h1>

      <div className="border p-4 space-y-3">
        <input
          className="border p-2 w-full"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          className="border p-2 w-full"
          placeholder="Password (min 6 chars)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        <button
          className="border px-4 py-2 w-full"
          onClick={onSignup}
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        {info && <p className="text-sm opacity-80">{info}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <p className="text-sm opacity-80">
          Already have an account?{" "}
          <Link className="underline" href="/login">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
