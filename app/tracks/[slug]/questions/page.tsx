import Link from "next/link";
import { supabaseServer } from "../../../../lib/supabase/server";
import EntityQuestionsSection from "../../../components/EntityQuestionsSection";

export default async function TrackQuestionsPage(props: any) {
  const p = await Promise.resolve(props.params);
  const sp = await Promise.resolve(props.searchParams);
  const slug = p?.slug ? String(p.slug) : "";
  const rawQ = sp?.q;
  const n = rawQ != null && String(rawQ) !== "" ? Number(rawQ) : NaN;
  const highlightQuestionId = Number.isFinite(n) ? n : null;

  if (!slug) {
    return (
      <main className="space-y-3">
        <p>Invalid track.</p>
        <Link className="btn-text" href="/tracks">
          Back to Tracks
        </Link>
      </main>
    );
  }

  const supabase = await supabaseServer();
  const { data: track, error } = await supabase
    .from("tracks_catalog")
    .select("id,slug,name,country")
    .eq("slug", slug)
    .single();

  if (error || !track) {
    return (
      <main className="space-y-3">
        <p>Track not found.</p>
        <Link className="btn-text" href="/tracks">
          Back to Tracks
        </Link>
      </main>
    );
  }

  const hrefSlug = track.slug ?? slug;

  return (
    <main className="space-y-6 max-w-3xl mx-auto w-full">
      <Link className="btn-text text-sm inline-block" href={`/tracks/${hrefSlug}`}>
        ← Back to track
      </Link>
      <h1
        className="text-2xl font-bold text-[var(--secondary)]"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
      >
        {track.name}
        {track.country ? ` — ${track.country}` : ""} — Questions
      </h1>
      <EntityQuestionsSection
        entityType="track"
        entityId={track.id}
        entitySlug={hrefSlug}
        variant="full"
        highlightQuestionId={highlightQuestionId}
      />
    </main>
  );
}
