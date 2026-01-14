"use client";

import BackHome from "../components/BackHome";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/browser";

type CatalogTrack = { id: number; slug: string | null; name: string; country: string | null; hero_image_url: string | null };
type UserTrack = { id: number; track_id: number; status: "been" | "want"; created_at: string };

type PopularRow = {
  track_id: number;
  slug: string | null;
  name: string;
  country: string | null;
  hero_image_url: string | null;
  total_picks: number;
  want_picks: number;
  been_picks: number;
};

export default function TracksPage() {
  const supabase = supabaseBrowser();

  const [catalog, setCatalog] = useState<CatalogTrack[]>([]);
  const [userTracks, setUserTracks] = useState<UserTrack[]>([]);
  const [popularTop5, setPopularTop5] = useState<PopularRow[]>([]);
  const [isAuthed, setIsAuthed] = useState(false);

  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  async function getUserId(): Promise<string | null> {
    const { data, error } = await supabase.auth.getUser();

    // Guests often get "Auth session missing!" -> treat as logged out, not an error.
    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("auth session missing")) {
        setIsAuthed(false);
        return null;
      }
      setError(error.message);
      setIsAuthed(false);
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
      .select("id,slug,name,country,hero_image_url")
      .order("name");

    if (error) {
      setError(error.message);
      return;
    }
    setCatalog((data as CatalogTrack[]) ?? []);
  }

  async function loadTop5() {
    setError("");
    const { data: popData, error: popError } = await supabase
      .from("track_popularity")
      .select("track_id,slug,name,country,total_picks,want_picks,been_picks")
      .order("total_picks", { ascending: false })
      .limit(8);

    if (popError) {
      setError(popError.message);
      return;
    }

    if (!popData || popData.length === 0) {
      setPopularTop5([]);
      return;
    }

    const trackIds = popData.map((p) => p.track_id);
    const { data: tracks, error: tracksError } = await supabase
      .from("tracks_catalog")
      .select("id,hero_image_url")
      .in("id", trackIds);

    if (tracksError) {
      setError(tracksError.message);
      return;
    }

    const popularWithImages = popData.map((pop) => {
      const track = tracks?.find((t) => t.id === pop.track_id);
      return {
        ...pop,
        hero_image_url: track?.hero_image_url ?? null,
      };
    });

    setPopularTop5(popularWithImages);
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
    await loadTop5();
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
    await loadTop5();
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
    loadTop5();
    loadUserTracks();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadUserTracks();
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="space-y-6 sm:space-y-8">
      <BackHome />

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--secondary)]/40">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          className="border border-[var(--border)] rounded-lg pl-10 pr-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          placeholder="Browse all tracks.."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <p className="text-[var(--primary)] text-sm">{error}</p>}

      {/* Popular Tracks Section */}
      <section className="space-y-4 sm:space-y-6">
        <h2
          className="text-xl sm:text-2xl font-bold text-[var(--secondary)]"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Popular Tracks
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularTop5.length > 0 ? (
            popularTop5.map((track, i) => {
              const userTrack = userTracks.find((ut) => ut.track_id === track.track_id);
              const currentStatus = userTrack?.status || null;
              return (
                <div
                  key={track.track_id}
                  className="group card overflow-hidden hover:shadow-lg transition-all relative"
                >
                  {/* Numbered Circle */}
                  <div className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>

                  {/* Image */}
                  <Link href={track.slug ? `/tracks/${track.slug}` : "#"}>
                    <div className="aspect-[4/3] relative bg-[var(--secondary)]/5 overflow-hidden">
                      {track.hero_image_url ? (
                        <img
                          src={track.hero_image_url}
                          alt={track.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--secondary)]/30">
                          <svg
                            className="w-16 h-16"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Title and Buttons */}
                  <div className="p-4 border-t border-[var(--border)] space-y-3">
                    <Link href={track.slug ? `/tracks/${track.slug}` : "#"}>
                      <h3 className="font-semibold text-[var(--secondary)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                        {track.name}
                      </h3>
                      {track.country && (
                        <p className="text-sm text-[var(--secondary)]/60 mt-1">
                          {track.country}
                        </p>
                      )}
                    </Link>
                    {isAuthed && (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          className={`btn-text text-xs ${currentStatus === "want" ? "opacity-50 cursor-not-allowed" : ""}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setStatus(track.track_id, "want");
                          }}
                          disabled={currentStatus === "want"}
                        >
                          {currentStatus === "want" ? "Want ✓" : "Want"}
                        </button>
                        <button
                          className={`btn-text text-xs ${currentStatus === "been" ? "opacity-50 cursor-not-allowed" : ""}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setStatus(track.track_id, "been");
                          }}
                          disabled={currentStatus === "been"}
                        >
                          {currentStatus === "been" ? "Been ✓" : "Been"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-sm opacity-70 py-8 text-center">
              No popular tracks yet.
            </div>
          )}
        </div>
      </section>

      {/* Browse All Tracks Section */}
      <section className="space-y-4">
        <h2
          className="text-xl font-bold text-[var(--secondary)]"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          {query ? "Search Results" : "All Tracks"}
        </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCatalog.map((track) => {
              const userTrack = userTracks.find((ut) => ut.track_id === track.id);
              const currentStatus = userTrack?.status || null;
              return (
                <div
                  key={track.id}
                  className="group card overflow-hidden hover:shadow-lg transition-all relative"
                >
                  {/* Image */}
                  <Link href={track.slug ? `/tracks/${track.slug}` : "#"}>
                    <div className="aspect-[4/3] relative bg-[var(--secondary)]/5 overflow-hidden">
                      {track.hero_image_url ? (
                        <img
                          src={track.hero_image_url}
                          alt={track.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--secondary)]/30">
                          <svg
                            className="w-16 h-16"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Title and Buttons */}
                  <div className="p-4 border-t border-[var(--border)] space-y-3">
                    <Link href={track.slug ? `/tracks/${track.slug}` : "#"}>
                      <h3 className="font-semibold text-[var(--secondary)] group-hover:text-[var(--primary)] transition-colors">
                        {track.name}
                      </h3>
                      {track.country && (
                        <p className="text-sm text-[var(--secondary)]/60 mt-1">
                          {track.country}
                        </p>
                      )}
                    </Link>
                    {isAuthed && (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          className={`btn-text text-xs ${currentStatus === "want" ? "opacity-50 cursor-not-allowed" : ""}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setStatus(track.id, "want");
                          }}
                          disabled={currentStatus === "want"}
                        >
                          {currentStatus === "want" ? "Want ✓" : "Want"}
                        </button>
                        <button
                          className={`btn-text text-xs ${currentStatus === "been" ? "opacity-50 cursor-not-allowed" : ""}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setStatus(track.id, "been");
                          }}
                          disabled={currentStatus === "been"}
                        >
                          {currentStatus === "been" ? "Been ✓" : "Been"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCatalog.length === 0 && (
            <div className="text-sm opacity-70 py-8 text-center">
              {query ? "No matching tracks found." : "No tracks available."}
            </div>
          )}
        </section>

      {/* Your List Section */}
      {isAuthed && (
        <section className="space-y-4">
          <h2
            className="text-xl font-bold text-[var(--secondary)]"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Your List
          </h2>

          {userTracks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {userTracks.map((ut) => {
                const t = trackById(ut.track_id);
                if (!t) return null;
                return (
                  <div key={ut.id} className="card p-4 space-y-3">
                    {t.slug ? (
                      <Link
                        href={`/tracks/${t.slug}`}
                        className="font-semibold hover:text-[var(--primary)] transition-colors block"
                      >
                        {t.name}
                        {t.country ? ` — ${t.country}` : ""}
                      </Link>
                    ) : (
                      <span className="text-sm text-[var(--primary)]">
                        Missing slug
                      </span>
                    )}
                    <span className="text-sm opacity-70 block">Status: {ut.status}</span>
                    <div className="flex gap-2 flex-wrap">
                      {ut.status !== "want" && (
                        <button
                          className="btn-text text-xs"
                          onClick={() => setStatus(ut.track_id, "want")}
                        >
                          Mark Want
                        </button>
                      )}
                      {ut.status !== "been" && (
                        <button
                          className="btn-text text-xs"
                          onClick={() => setStatus(ut.track_id, "been")}
                        >
                          Mark Been
                        </button>
                      )}
                      <button
                        className="btn-text text-xs"
                        onClick={() => removeUserTrack(ut.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="opacity-70">No tracks in your list yet.</p>
          )}
        </section>
      )}

      {!isAuthed && (
        <div className="text-sm opacity-70 text-center py-4">
          <Link href="/login" className="btn-text">
            Log in
          </Link>{" "}
          to save tracks to your Want/Been list.
        </div>
      )}
    </main>
  );
}
