"use client";

import BackHome from "../components/BackHome";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/browser";

type CatalogTrack = { id: number; slug: string | null; name: string; country: string | null };
type UserTrack = { id: number; track_id: number; status: "been" | "want"; created_at: string };

type PopularRow = {
  track_id: number;
  slug: string | null;
  name: string;
  country: string | null;
  total_picks: number;
  want_picks: number;
  been_picks: number;
};

export default function TracksPage() {
  const supabase = supabaseBrowser();

  const [tab, setTab] = useState<"browse" | "leaderboard">("browse");

  const [catalog, setCatalog] = useState<CatalogTrack[]>([]);
  const [userTracks, setUserTracks] = useState<UserTrack[]>([]);
  const [isAuthed, setIsAuthed] = useState(false);

  const [popular, setPopular] = useState<PopularRow[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  async function getUserId(): Promise<string | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      setError(error.message);
      return null;
    }
    const uid = data.user?.id ?? null;
    setIsAuthed(Boolean(uid));
    return uid;
  }

  async function loadCatalog() {
    setError("");
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

  async function loadPopular() {
    setError("");
    const { data, error } = await supabase
      .from("track_popularity")
      .select("track_id,slug,name,country,total_picks,want_picks,been_picks")
      .order("total_picks", { ascending: false })
      .limit(50);

    if (error) {
      setError(error.message);
      return;
    }
    setPopular((data as PopularRow[]) ?? []);
  }

  async function loadUserTracks() {
    setError("");
    const uid = await getUserId();
    if (!uid) {
      setUserTracks([]);
      return;
    }

    const { data, error } = await supabase
      .from("user_tracks")
      .select("id,track_id,status,created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }
    setUserTracks((data as UserTrack[]) ?? []);
  }

  async function setStatus(trackId: number, status: "want" | "been") {
    setError("");
    const uid = await getUserId();
    if (!uid) {
      window.location.href = "/login";
      return;
    }

    const existing = userTracks.find((ut) => ut.track_id === trackId);

    if (existing) {
      const { error } = await supabase.from("user_tracks").update({ status }).eq("id", existing.id);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from("user_tracks").insert({
        user_id: uid,
        track_id: trackId,
        status,
      });
      if (error) setError(error.message);
    }

    await loadUserTracks();
    await loadPopular(); // refresh leaderboard counts
  }

  async function removeUserTrack(userTrackId: number) {
    setError("");
    const uid = await getUserId();
    if (!uid) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.from("user_tracks").delete().eq("id", userTrackId);
    if (error) setError(error.message);

    await loadUserTracks();
    await loadPopular();
  }

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((t) => t.name.toLowerCase().includes(q));
  }, [catalog, query]);

  const filteredPopular = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return popular;
    return popular.filter((t) => t.name.toLowerCase().includes(q));
  }, [popular, query]);

  function trackById(trackId: number) {
    return catalog.find((c) => c.id === trackId) ?? null;
  }

  useEffect(() => {
    loadCatalog();
    loadPopular();
    loadUserTracks();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadUserTracks();
    });

    return () => {
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="space-y-6">
      <BackHome />

      <div>
        <h1 className="text-2xl font-bold">Tracks</h1>
        <p className="text-sm opacity-70">Browse as a guest. Log in to save Want/Been.</p>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-3">
            <button
              className={`border px-3 py-1 rounded ${tab === "browse" ? "border-red-600 text-red-600" : ""}`}
              onClick={() => setTab("browse")}
            >
              Browse
            </button>
            <button
              className={`border px-3 py-1 rounded ${tab === "leaderboard" ? "border-red-600 text-red-600" : ""}`}
              onClick={() => setTab("leaderboard")}
            >
              Leaderboard
            </button>
          </div>

          <input
            className="border p-2 w-full max-w-sm"
            placeholder="Search (e.g. Silverstone)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {tab === "browse" ? (
          <div className="border max-h-72 overflow-y-auto rounded-md">
            {filteredCatalog.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-3 py-2 border-b">
                {t.slug ? (
                  <Link className="underline" href={`/tracks/${t.slug}`}>
                    {t.name}{t.country ? ` — ${t.country}` : ""}
                  </Link>
                ) : (
                  <span className="text-sm text-red-600">Missing slug for: {t.name}</span>
                )}

                <div className="flex gap-3">
                  <button
                    className={`underline ${!isAuthed ? "opacity-50" : ""}`}
                    onClick={() => setStatus(t.id, "want")}
                    title={!isAuthed ? "Log in to save" : ""}
                  >
                    Want
                  </button>
                  <button
                    className={`underline ${!isAuthed ? "opacity-50" : ""}`}
                    onClick={() => setStatus(t.id, "been")}
                    title={!isAuthed ? "Log in to save" : ""}
                  >
                    Been
                  </button>
                </div>
              </div>
            ))}

            {filteredCatalog.length === 0 && (
              <div className="p-3 text-sm opacity-70">No matching tracks</div>
            )}
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            {filteredPopular.map((r, i) => (
              <div key={r.track_id} className="border-b p-3">
                <div className="font-semibold">
                  {r.slug ? (
                    <Link className="underline" href={`/tracks/${r.slug}`}>
                      #{i + 1} {r.name} {r.country ? `— ${r.country}` : ""}
                    </Link>
                  ) : (
                    <span className="text-red-600">Missing slug for {r.name}</span>
                  )}
                </div>
                <div className="text-sm opacity-80">
                  Total: {r.total_picks} • Want: {r.want_picks} • Been: {r.been_picks}
                </div>
              </div>
            ))}

            {filteredPopular.length === 0 && (
              <div className="p-3 text-sm opacity-70">No matching tracks</div>
            )}
          </div>
        )}

        {!isAuthed && (
          <div className="text-sm opacity-70">
            Want/Been requires{" "}
            <Link className="underline" href="/login">
              login
            </Link>
            .
          </div>
        )}
      </div>

      <section className="space-y-2">
        <div className="font-semibold">Your list</div>

        {!isAuthed ? (
          <p className="opacity-70">Log in to see your Want/Been list.</p>
        ) : (
          <>
            {userTracks.map((ut) => {
              const t = trackById(ut.track_id);
              return (
                <div key={ut.id} className="border rounded-xl p-3 flex justify-between">
                  <div>
                    {t?.slug ? (
                      <Link className="underline" href={`/tracks/${t.slug}`}>
                        {t.name}{t.country ? ` — ${t.country}` : ""}
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
          </>
        )}
      </section>
    </main>
  );
}
