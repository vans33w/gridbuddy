"use client";

import BackHome from "../components/BackHome";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/browser";

type CatalogTrack = { id: number; slug: string | null; name: string; country: string | null };
type UserTrack = { id: number; track_id: number; status: "been" | "want"; created_at: string };

export default function TracksPage() {
  const supabase = supabaseBrowser();

  const [catalog, setCatalog] = useState<CatalogTrack[]>([]);
  const [userTracks, setUserTracks] = useState<UserTrack[]>([]);
  const [isAuthed, setIsAuthed] = useState(false);

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

      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tracks</h1>
          <p className="text-sm opacity-70">
            Browse tracks. Log in to save Want/Been.
          </p>
        </div>

        <Link className="underline text-sm" href="/popular-tracks">
          View Popular
        </Link>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <section className="border rounded-xl p-4 space-y-3">
        <div className="font-semibold">Browse tracks</div>

        <input
          className="border p-2 w-full"
          placeholder="Search all tracks (e.g. Silverstone)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="border max-h-72 overflow-y-auto rounded-md">
          {filteredCatalog.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-3 py-2 border-b">
              {t.slug ? (
                <Link className="underline" href={`/tracks/${t.slug}`}>
                  {t.name}
                  {t.country ? ` — ${t.country}` : ""}
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

        {!isAuthed && (
          <div className="text-sm opacity-70">
            You’re browsing as a guest.{" "}
            <Link className="underline" href="/login">
              Log in
            </Link>{" "}
            to save Want/Been.
          </div>
        )}
      </section>

      <section className="space-y-2">
        <div className="font-semibold">Your list</div>

        {!isAuthed ? (
          <p className="opacity-70">
            Log in to see your Want/Been list.
          </p>
        ) : (
          <>
            {userTracks.map((ut) => {
              const t = trackById(ut.track_id);
              return (
                <div key={ut.id} className="border rounded-xl p-3 flex justify-between">
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
          </>
        )}
      </section>
    </main>
  );
}
