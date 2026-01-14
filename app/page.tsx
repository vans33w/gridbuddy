import Link from "next/link";
import { supabaseServer } from "../lib/supabase/server";
import Image from "next/image";

type TrackCard = {
  id: number;
  slug: string | null;
  name: string;
  country: string | null;
  hero_image_url: string | null;
};

type RaceCard = {
  id: number;
  slug: string | null;
  name: string;
  country: string | null;
  hero_image_url: string | null;
};

async function getPopularTracks(): Promise<TrackCard[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("track_popularity")
    .select("track_id,slug,name,country")
    .order("total_picks", { ascending: false })
    .limit(4);

  if (!data || data.length === 0) return [];

  const trackIds = data.map((t) => t.track_id);
  const { data: tracks } = await supabase
    .from("tracks_catalog")
    .select("id,slug,name,country,hero_image_url")
    .in("id", trackIds);

  // Map back to maintain order
  return (
    data
      .map((pop) => {
        const track = tracks?.find((t) => t.id === pop.track_id);
        return track
          ? {
              id: track.id,
              slug: track.slug,
              name: track.name,
              country: track.country,
              hero_image_url: track.hero_image_url,
            }
          : null;
      })
      .filter((t): t is TrackCard => t !== null) ?? []
  );
}

async function getPopularRaces(): Promise<RaceCard[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("race_popularity")
    .select("race_id,slug,name,country")
    .order("total_picks", { ascending: false })
    .limit(4);

  if (!data || data.length === 0) return [];

  const raceIds = data.map((r) => r.race_id);
  const { data: races } = await supabase
    .from("races_catalog")
    .select("id,slug,name,country,hero_image_url")
    .in("id", raceIds);

  // Map back to maintain order
  return (
    data
      .map((pop) => {
        const race = races?.find((r) => r.id === pop.race_id);
        return race
          ? {
              id: race.id,
              slug: race.slug,
              name: race.name,
              country: race.country,
              hero_image_url: race.hero_image_url,
            }
          : null;
      })
      .filter((r): r is RaceCard => r !== null) ?? []
  );
}

export default async function HomePage() {
  const [tracks, races] = await Promise.all([
    getPopularTracks(),
    getPopularRaces(),
  ]);

  return (
    <div className="space-y-8 sm:space-y-12 md:space-y-16 max-w-7xl mx-auto w-full px-4 sm:px-6">
      {/* Hero Section */}
      <section className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] flex items-center justify-center overflow-hidden rounded-lg md:rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--secondary)]/20 z-0" />
        <Image src="/assets/hero2.jpeg" alt="Hero Background" fill className="object-cover z-0" />
        <div className="relative z-10 text-center px-4 sm:px-6 lg:mb-40">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-4 text-black"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Every race has a story.
          </h1>
          <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black">
            Plan your next one.
          </p>
        </div>
      </section>

      {/* GRID BUDDY Features Section */}
      <section className="space-y-6">
        <h2
          className="text-2xl font-bold text-[var(--secondary)]"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          GRID BUDDY LETS YOU...
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/emissions"
            className="card p-6 hover:shadow-lg transition-all hover:border-[var(--primary)] group"
          >
            <h3 className="font-semibold text-lg mb-2 group-hover:text-[var(--primary)] transition-colors">
              Calculate travel emissions.
            </h3>
            <p className="text-sm text-[var(--secondary)]/70">
              Plan your journey with sustainability in mind.
            </p>
          </Link>

          <Link
            href="/moments"
            className="card p-6 hover:shadow-lg transition-all hover:border-[var(--primary)] group"
          >
            <h3 className="font-semibold text-lg mb-2 group-hover:text-[var(--primary)] transition-colors">
              Save Your Favourite Moments
            </h3>
            <p className="text-sm text-[var(--secondary)]/70">
              Keep track of your motorsports diary.
            </p>
          </Link>

          <Link
            href="/bucket-list"
            className="card p-6 hover:shadow-lg transition-all hover:border-[var(--primary)] group"
          >
            <h3 className="font-semibold text-lg mb-2 group-hover:text-[var(--primary)] transition-colors">
              Track bucket lists.
            </h3>
            <p className="text-sm text-[var(--secondary)]/70">
              Mark tracks and races you want to visit or have been to.
            </p>
          </Link>

          <Link
            href="/bucket-list"
            className="card p-6 hover:shadow-lg transition-all hover:border-[var(--primary)] group"
          >
            <h3 className="font-semibold text-lg mb-2 group-hover:text-[var(--primary)] transition-colors">
              Countdown to Events.
            </h3>
            <p className="text-sm text-[var(--secondary)]/70">
              Never miss an important race or track event.
            </p>
          </Link>
        </div>
      </section>

      {/* TRACKS Section */}
      <section className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2
            className="text-2xl sm:text-3xl font-bold text-[var(--secondary)] underline underline-offset-4"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            TRACKS
          </h2>
          <Link
            href="/tracks"
            className="text-xs sm:text-sm text-[var(--primary)] hover:text-[var(--accent-hover)] transition-colors underline underline-offset-2 whitespace-nowrap"
          >
            View All →
          </Link>
        </div>
        <div className="border-t border-[var(--border)] pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tracks.length > 0 ? (
              tracks.map((track) => (
                <Link
                  key={track.id}
                  href={track.slug ? `/tracks/${track.slug}` : "#"}
                  className="group card overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square relative bg-[var(--secondary)]/5 overflow-hidden">
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
                  <div className="p-4">
                    <h3 className="font-semibold text-[var(--secondary)] group-hover:text-[var(--primary)] transition-colors">
                      {track.name}
                    </h3>
                    {track.country && (
                      <p className="text-sm text-[var(--secondary)]/60 mt-1">
                        {track.country}
                      </p>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <>
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="card overflow-hidden opacity-50"
                  >
                    <div className="aspect-square bg-[var(--secondary)]/5" />
                    <div className="p-4">
                      <div className="h-4 bg-[var(--secondary)]/10 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-[var(--secondary)]/10 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* RACES Section */}
      <section className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2
            className="text-2xl sm:text-3xl font-bold text-[var(--secondary)] underline underline-offset-4"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            RACES
          </h2>
          <Link
            href="/races"
            className="text-xs sm:text-sm text-[var(--primary)] hover:text-[var(--accent-hover)] transition-colors underline underline-offset-2 whitespace-nowrap"
          >
            View All →
          </Link>
        </div>
        <div className="border-t border-[var(--border)] pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {races.length > 0 ? (
              races.map((race) => (
                <Link
                  key={race.id}
                  href={race.slug ? `/races/${race.slug}` : "#"}
                  className="group card overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square relative bg-[var(--secondary)]/5 overflow-hidden">
                    {race.hero_image_url ? (
                      <img
                        src={race.hero_image_url}
                        alt={race.name}
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[var(--secondary)] group-hover:text-[var(--primary)] transition-colors">
                      {race.name}
                    </h3>
                    {race.country && (
                      <p className="text-sm text-[var(--secondary)]/60 mt-1">
                        {race.country}
                      </p>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <>
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="card overflow-hidden opacity-50"
                  >
                    <div className="aspect-square bg-[var(--secondary)]/5" />
                    <div className="p-4">
                      <div className="h-4 bg-[var(--secondary)]/10 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-[var(--secondary)]/10 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>
      </div>
  );
}
