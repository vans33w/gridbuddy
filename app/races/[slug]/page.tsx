import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "../../../lib/supabase/server";
import MarkButtons from "./MarkButtons";
import AddToMoment from "../../components/AddToMoment";
import Comments from "../../components/Comments";
import RaceSustainabilityGuide from "../../components/RaceSustainabilityGuide";

export default async function RaceDetailPage(props: any) {
  const p = await Promise.resolve(props.params);
  const raw = p?.slug ? String(p.slug) : "";

  if (!raw) {
    return (
      <main className="space-y-3">
        <p className="font-semibold">Invalid race.</p>
        <Link className="btn-text" href="/races">
          Back to Races
        </Link>
      </main>
    );
  }

  const supabase = await supabaseServer();

  // If someone visits /races/1, treat it as ID and redirect to the slug URL
  const asNumber = Number(raw);
  if (Number.isFinite(asNumber)) {
    const { data } = await supabase
      .from("races_catalog")
      .select("slug")
      .eq("id", asNumber)
      .single();

    if (data?.slug) redirect(`/races/${data.slug}`);
    return (
      <main className="space-y-3">
        <p>Race not found.</p>
        <Link className="btn-text" href="/races">
          Back to Races
        </Link>
      </main>
    );
  }

  const { data: race, error: raceErr } = await supabase
    .from("races_catalog")
    .select(
      "id,slug,name,country,city,circuit_name,official_website,hero_image_url,description"
    )
    .eq("slug", raw)
    .single();

  if (raceErr || !race) {
    return (
      <main className="space-y-3">
        <p>Race not found.</p>
        <Link className="btn-text" href="/races">
          Back to Races
        </Link>
      </main>
    );
  }

  const { data: pop } = await supabase
    .from("race_popularity")
    .select("total_picks,want_picks,been_picks")
    .eq("race_id", race.id)
    .maybeSingle();

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  let myStatus: "want" | "been" | null = null;
  if (userId) {
    const { data: ur } = await supabase
      .from("user_races")
      .select("status")
      .eq("user_id", userId)
      .eq("race_id", race.id)
      .maybeSingle();

    myStatus = (ur?.status as any) ?? null;
  }

  return (
    <main className="space-y-8">
      <Link className="btn-text text-sm inline-block" href="/races">
        ← Back to Races
      </Link>

      {/* Race Name */}
      <div className="space-y-4">
        <h1
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--secondary)]"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          {race.name} {race.country ? `— ${race.country}` : ""}
        </h1>

        <div className="flex flex-wrap items-center gap-4">
        <MarkButtons raceId={race.id} initialStatus={myStatus} />
          <AddToMoment raceId={race.id} raceName={race.name} />
        </div>
      </div>

      {/* Main Photo */}
      {race.hero_image_url && (
        <div className="w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={race.hero_image_url}
          alt={race.name}
            className="w-full h-auto rounded-lg object-cover"
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
            <RaceSustainabilityGuide raceId={race.id} />
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
              {race.circuit_name && (
                <div>
                  <span className="font-medium text-[var(--secondary)]/70">Circuit:</span>{" "}
                  <span className="text-[var(--secondary)]/80">{race.circuit_name}</span>
                </div>
              )}
              {race.city && (
                <div>
                  <span className="font-medium text-[var(--secondary)]/70">City:</span>{" "}
                  <span className="text-[var(--secondary)]/80">{race.city}</span>
                </div>
              )}
              {race.country && (
                <div>
                  <span className="font-medium text-[var(--secondary)]/70">Country:</span>{" "}
                  <span className="text-[var(--secondary)]/80">{race.country}</span>
                </div>
              )}
              {race.official_website && (
                <div>
                  <span className="font-medium text-[var(--secondary)]/70">Website:</span>{" "}
            <a
                    className="btn-text text-sm"
              href={race.official_website}
              target="_blank"
              rel="noreferrer"
            >
                    Visit
            </a>
                </div>
          )}
        </div>
      </div>

          <div className="card p-6 space-y-4">
            <h3
              className="font-semibold text-lg text-[var(--secondary)]"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Popularity
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-[var(--secondary)]/70">Total picks:</span>{" "}
                <span className="text-[var(--secondary)]/80">{pop?.total_picks ?? 0}</span>
              </div>
              <div>
                <span className="font-medium text-[var(--secondary)]/70">Want:</span>{" "}
                <span className="text-[var(--secondary)]/80">{pop?.want_picks ?? 0}</span>
              </div>
              <div>
                <span className="font-medium text-[var(--secondary)]/70">Been:</span>{" "}
                <span className="text-[var(--secondary)]/80">{pop?.been_picks ?? 0}</span>
              </div>
            </div>
        </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-8">
      <Comments entityType="race" entityId={race.id} />
      </div>
    </main>
  );
}
