import Link from "next/link";
import { supabaseServer } from "../../../lib/supabase/server";
import AddToMoment from "../../components/AddToMoment";
import EntityPopularityActions from "../../components/EntityPopularityActions";
import type { PickStatus } from "../../../lib/favourites";
import EntityQuestionsSection from "../../components/EntityQuestionsSection";
import EntityReviewsSection from "../../components/EntityReviewsSection";
import TrackSustainabilityGuide from "../../components/TrackSustainabilityGuide";

export default async function TrackDetailBySlugPage(props: any) {
  const p = await Promise.resolve(props.params);
  const slug = p?.slug ? String(p.slug) : "";

  if (!slug) {
    return (
      <main className="space-y-3">
        <p className="font-semibold">Invalid track slug.</p>
        <Link className="btn-text" href="/tracks">
          Back to Tracks
        </Link>
      </main>
    );
  }

  const supabase = await supabaseServer();

  const { data: track, error: trackErr } = await supabase
    .from("tracks_catalog")
    .select(
      "id,slug,name,country,city,length_km,turns,lap_record,website,hero_image_url,description"
    )
    .eq("slug", slug)
    .single();

  if (trackErr || !track) {
    return (
      <main className="space-y-3">
        <p>Track not found.</p>
        <Link className="btn-text" href="/tracks">
          Back to Tracks
        </Link>
      </main>
    );
  }

  const { data: pop } = await supabase
    .from("track_popularity")
    .select("total_picks,want_picks,been_picks")
    .eq("track_id", track.id)
    .maybeSingle();

  const { data: reviewRows } = await supabase
    .from("entity_reviews")
    .select("rating")
    .eq("entity_type", "track")
    .eq("entity_id", track.id);

  const reviewCount = (reviewRows ?? []).length;
  const averageRating =
    reviewCount > 0
      ? (reviewRows ?? []).reduce((sum: number, r: any) => sum + Number(r.rating ?? 0), 0) /
        reviewCount
      : null;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  let pickStatus: PickStatus | null = null;
  if (userId) {
    const { data: ut } = await supabase
      .from("user_tracks")
      .select("status")
      .eq("user_id", userId)
      .eq("track_id", track.id)
      .maybeSingle();

    const s = ut?.status as string | undefined;
    pickStatus = s === "want" || s === "been" ? s : null;
  }

  return (
    <main className="space-y-8">
      <Link className="btn-text text-sm inline-block" href="/tracks">
        ← Back to Tracks
      </Link>

      {/* Track Name */}
      <div className="space-y-4">
        <h1
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--secondary)]"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
        {track.name} {track.country ? `— ${track.country}` : ""}
      </h1>

        <div className="flex flex-wrap items-center gap-4">
          <AddToMoment trackId={track.id} trackName={track.name} />
        </div>
      </div>

      {/* Main Photo */}
      {track.hero_image_url && (
        <div className="w-full relative rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={track.hero_image_url}
            alt={track.name}
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      {/* Sustainability Guide and Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Sustainability Guide Column (Left, 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sustainability Guide */}
          <div>
            <h2
              className="text-xl font-bold mb-4 text-[var(--secondary)]"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Sustainability Guide
            </h2>
            <TrackSustainabilityGuide trackId={track.id} />
          </div>
        </div>

        {/* Details Column (Right, 1 column) */}
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h3
              className="font-semibold text-lg text-[var(--secondary)]"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Details
            </h3>
            <div className="space-y-3 text-sm">
              {track.length_km && (
                <div>
                  <span className="font-medium text-[var(--secondary)]/70">Length:</span>{" "}
                  <span className="text-[var(--secondary)]/80">{track.length_km} km</span>
                </div>
              )}
              {track.turns && (
                <div>
                  <span className="font-medium text-[var(--secondary)]/70">Turns:</span>{" "}
                  <span className="text-[var(--secondary)]/80">{track.turns}</span>
                </div>
              )}
              {track.lap_record && (
                <div>
                  <span className="font-medium text-[var(--secondary)]/70">Lap Record:</span>{" "}
                  <span className="text-[var(--secondary)]/80">{track.lap_record}</span>
                </div>
              )}
              {track.city && (
                <div>
                  <span className="font-medium text-[var(--secondary)]/70">City:</span>{" "}
                  <span className="text-[var(--secondary)]/80">{track.city}</span>
        </div>
              )}
              {track.website && (
                <div>
                  <span className="font-medium text-[var(--secondary)]/70">Website:</span>{" "}
                  <a
                    className="btn-text text-sm"
                    href={track.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Visit
                  </a>
                </div>
          )}
        </div>
      </div>

          <EntityPopularityActions
            kind="track"
            entityId={track.id}
            initialStatus={pickStatus}
            likesCount={pop?.total_picks ?? 0}
            averageRating={averageRating}
          />
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <EntityReviewsSection
          entityType="track"
          entityId={track.id}
          entitySlug={track.slug ?? slug}
          variant="preview"
        />
        <EntityQuestionsSection
          entityType="track"
          entityId={track.id}
          entitySlug={track.slug ?? slug}
          variant="preview"
        />
      </div>
    </main>
  );
}
