"use client";

import { useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/browser";

export default function LoginPage() {
  const supabase = supabaseBrowser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
  }

  async function handleSignup() {
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) setError(error.message);
  }

  return (
    <main className="p-6 space-y-4 max-w-sm">
      <h1 className="text-2xl font-bold">Login</h1>

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

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-2">
        <button
          className="border px-4 py-2"
          onClick={handleLogin}
        >
          Login
        </button>

        <button
          className="border px-4 py-2"
          onClick={handleSignup}
        >
          Sign up
        </button>
      </div>
    </main>
  );
}
