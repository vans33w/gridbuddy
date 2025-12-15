"use client";

import BackHome from "../components/BackHome";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/browser";

type CatalogTrack = {
  id: number;
  slug: string | null;
  name: string;
  country: string | null;
};

type UserTrack = {
  id: number;
  track_id: number;
  status: "been" | "want";
  created_at: string;
};

export default function TracksPage() {
  const supabase = supabaseBrowser();

  const [catalog, setCatalog] = useState<CatalogTrack[]>([]);
  const [userTracks, setUserTracks] = useState<UserTrack[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  async function requireUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw new Error(error.message);
    if (!data.user) {
      window.location.href = "/login";
      throw new Error("Not logged in");
    }
    return data.user;
  }

  async function loadCatalog() {
    const { data, error } = await supabase
      .from("tracks_catalog")
      .select("id,slug,name,country")
      .order("name");

    if (error) {
      setError(error.message);
      return;
    }

    setCatalog((data as CatalogTrack[]) ?? []);
  }

  async function loadUserTracks() {
    setError("");
    try {
      const user = await requireUser();

      const { data, error } = await supabase
        .from("user_tracks")
        .select("id,track_id,status,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        return;
      }

      setUserTracks((data as UserTrack[]) ?? []);
    } catch {}
  }

  async function setStatus(trackId: number, status: "want" | "been") {
    setError("");
    try {
      const user = await requireUser();
      const existing = userTracks.find((ut) => ut.track_id === trackId);

      if (existing) {
        const { error } = await supabase
          .from("user_tracks")
          .update({ status })
          .eq("id", existing.id);
        if (error) setError(error.message);
      } else {
        const { error } = await supabase.from("user_tracks").insert({
          user_id: user.id,
          track_id: trackId,
          status,
        });
        if (error) setError(error.message);
      }

      await loadUserTracks();
    } catch {}
  }

  async function removeUserTrack(userTrackId: number) {
    setError("");
    const { error } = await supabase.from("user_tracks").delete().eq("id", userTrackId);
    if (error) setError(error.message);
    await loadUserTracks();
  }

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((t) => t.name.toLowerCase().includes(q));
  }, [catalog, query]);

  function trackById(trackId: number) {
    return catalog.find((c) => c.id === trackId) ?? null;
  }

  useEffect(() => {
    loadCatalog();
    loadUserTracks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="p-6 space-y-6 max-w-2xl">
      <BackHome />

      <h1 className="text-2xl font-bold">Tracks</h1>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <section className="border p-4 space-y-3">
        <div className="font-semibold">Browse tracks</div>

        <input
          className="border p-2 w-full"
          placeholder="Search all tracks (e.g. Silverstone)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="border max-h-72 overflow-y-auto">
          {filteredCatalog.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between px-3 py-2 border-b"
            >
              {t.slug ? (
                <Link className="underline" href={`/tracks/${t.slug}`}>
                  {t.name}
                  {t.country ? ` — ${t.country}` : ""}
                </Link>
              ) : (
                <span className="text-sm text-red-600">
                  Missing slug for: {t.name}
                </span>
              )}

              <div className="flex gap-3">
                <button className="underline" onClick={() => setStatus(t.id, "want")}>
                  Want
                </button>
                <button className="underline" onClick={() => setStatus(t.id, "been")}>
                  Been
                </button>
              </div>
            </div>
          ))}

          {filteredCatalog.length === 0 && (
            <div className="p-3 text-sm opacity-70">No matching tracks</div>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <div className="font-semibold">Your list</div>

        {userTracks.map((ut) => {
          const t = trackById(ut.track_id);
          return (
            <div key={ut.id} className="border p-3 flex justify-between">
              <div>
                {t?.slug ? (
                  <Link className="underline" href={`/tracks/${t.slug}`}>
                    {t.name}
                    {t.country ? ` — ${t.country}` : ""}
                  </Link>
                ) : (
                  <span className="text-sm text-red-600">Missing slug</span>
                )}{" "}
                — <span className="opacity-70">{ut.status}</span>
              </div>
              <button className="underline" onClick={() => removeUserTrack(ut.id)}>
                Remove
              </button>
            </div>
          );
        })}

        {userTracks.length === 0 && <p className="opacity-70">No tracks yet.</p>}
      </section>
    </main>
  );
}
