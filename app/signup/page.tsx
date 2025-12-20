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
  const [username, setUsername] = useState("");
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

  function validateUsername(value: string): string | null {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.length < 3) return "Username must be at least 3 characters";
    if (trimmed.length > 20) return "Username must be 20 characters or less";
    if (!/^[a-z0-9_]+$/.test(trimmed))
      return "Only lowercase letters, numbers, and underscores";
    return null;
  }

  async function onSignup() {
    setError("");
    setInfo("");

    // Validate username format
    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    setLoading(true);

    // Check username availability (skip if function doesn't exist)
    try {
      const { data: available, error: rpcError } = await supabase.rpc(
        "is_username_available",
        { p_username: username.trim().toLowerCase() }
      );

      // Only block if we got a definitive "not available" response
      if (!rpcError && available === false) {
        setError("Username is already taken");
        setLoading(false);
        return;
      }
    } catch {
      // RPC function might be gone, continue with signup
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: username.trim().toLowerCase(),
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // If email confirmations are ON, user may need to confirm first
    if (!data.session) {
      setInfo(
        "Check your email to confirm your account, then come back and log in."
      );
      return;
    }

    // If confirmations are OFF, they're logged in immediately
    router.push("/moments");
  }

  return (
    <main className="space-y-6 max-w-md">
      <BackHome />

      <h1 className="text-2xl font-bold">Sign up</h1>

      <div className="card p-4 space-y-3">
        <input
          className="border p-2 w-full"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />

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
          className="btn-primary px-4 py-2 w-full"
          onClick={onSignup}
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        {info && <p className="text-sm opacity-80">{info}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <p className="text-sm opacity-80">
          Already have an account?{" "}
          <Link className="btn-text" href="/login">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
