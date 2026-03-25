import Link from "next/link";
import { supabaseServer } from "../../../../lib/supabase/server";
import EntityReviewsSection from "../../../components/EntityReviewsSection";

export default async function RaceReviewsPage(props: any) {
  const p = await Promise.resolve(props.params);
  const slug = p?.slug ? String(p.slug) : "";

  if (!slug) {
    return (
      <main className="space-y-3">
        <p>Invalid race.</p>
        <Link className="btn-text" href="/races">
          Back to Races
        </Link>
      </main>
    );
  }

  const supabase = await supabaseServer();
  const { data: race, error } = await supabase
    .from("races_catalog")
    .select("id,slug,name,country")
    .eq("slug", slug)
    .single();

  if (error || !race) {
    return (
      <main className="space-y-3">
        <p>Race not found.</p>
        <Link className="btn-text" href="/races">
          Back to Races
        </Link>
      </main>
    );
  }

  const hrefSlug = race.slug ?? slug;

  return (
    <main className="space-y-6 max-w-3xl mx-auto w-full">
      <Link className="btn-text text-sm inline-block" href={`/races/${hrefSlug}`}>
        ← Back to race
      </Link>
      <h1
        className="text-2xl font-bold text-[var(--secondary)]"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
      >
        {race.name}
        {race.country ? ` — ${race.country}` : ""} — Reviews
      </h1>
      <EntityReviewsSection
        entityType="race"
        entityId={race.id}
        entitySlug={hrefSlug}
        variant="full"
      />
    </main>
  );
}
