import Link from "next/link";
import { supabaseServer } from "../../../../lib/supabase/server";
import EntityQuestionsSection from "../../../components/EntityQuestionsSection";

export default async function RaceQuestionsPage(props: any) {
  const p = await Promise.resolve(props.params);
  const sp = await Promise.resolve(props.searchParams);
  const slug = p?.slug ? String(p.slug) : "";
  const rawQ = sp?.q;
  const n = rawQ != null && String(rawQ) !== "" ? Number(rawQ) : NaN;
  const highlightQuestionId = Number.isFinite(n) ? n : null;

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
        {race.country ? ` — ${race.country}` : ""} — Questions
      </h1>
      <EntityQuestionsSection
        entityType="race"
        entityId={race.id}
        entitySlug={hrefSlug}
        variant="full"
        highlightQuestionId={highlightQuestionId}
      />
    </main>
  );
}
