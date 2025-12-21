import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "../../../lib/supabase/server";
import MarkButtons from "./MarkButtons";
import Comments from "../../components/Comments";

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
    <main className="space-y-4 max-w-2xl">
      <Link className="btn-text text-sm" href="/races">
        ← Back to Races
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          {race.name} {race.country ? `— ${race.country}` : ""}
        </h1>

        <p className="text-sm opacity-70">
          Browse as a guest. Log in to save Want/Been.
        </p>

        <MarkButtons raceId={race.id} initialStatus={myStatus} />
      </div>

      {race.hero_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={race.hero_image_url}
          alt={race.name}
          className="w-full card"
        />
      )}

      <div className="card p-4 space-y-1">
        <div className="font-semibold">Race details</div>
        <div className="text-sm opacity-80">City: {race.city ?? "—"}</div>
        <div className="text-sm opacity-80">
          Circuit: {race.circuit_name ?? "—"}
        </div>
        <div className="text-sm opacity-80">
          Website:{" "}
          {race.official_website ? (
            <a
              className="btn-text"
              href={race.official_website}
              target="_blank"
              rel="noreferrer"
            >
              Open
            </a>
          ) : (
            "—"
          )}
        </div>

        {race.description && (
          <div className="text-sm opacity-80">{race.description}</div>
        )}
      </div>

      <div className="card p-4 space-y-1">
        <div className="font-semibold">Popularity</div>
        <div className="text-sm opacity-80">
          Total picks: {pop?.total_picks ?? 0}
        </div>
        <div className="text-sm opacity-80">
          Want: {pop?.want_picks ?? 0} • Been: {pop?.been_picks ?? 0}
        </div>
      </div>

      <Comments entityType="race" entityId={race.id} />
    </main>
  );
}
