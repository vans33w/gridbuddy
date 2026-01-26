import { supabaseServer } from "../../lib/supabase/server";

type RaceSustainabilityGuide = {
  id: number;
  race_id: number;
  top_tips: string[] | null;
  spectator_travel_options: string | null;
  public_sustainability_commitments: string | null;
};

type RaceSustainabilityGuideProps = {
  raceId: number;
};

export default async function RaceSustainabilityGuide({
  raceId,
}: RaceSustainabilityGuideProps) {
  const supabase = await supabaseServer();

  const { data: guide, error } = await supabase
    .from("race_sustainability_guides")
    .select("id,race_id,top_tips,spectator_travel_options,public_sustainability_commitments")
    .eq("race_id", raceId)
    .maybeSingle();

  if (error || !guide) {
    return null;
  }

  const guideData = guide as RaceSustainabilityGuide;

  // Parse top_tips - handle JSONB, JSON string, or plain text
  let topTipsText: string | null = null;
  if (guideData.top_tips) {
    try {
      if (typeof guideData.top_tips === "string") {
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(guideData.top_tips);
          if (Array.isArray(parsed)) {
            topTipsText = parsed.join("\n\n");
          } else if (typeof parsed === "string") {
            topTipsText = parsed;
          }
        } catch {
          // If parsing fails, treat as plain text
          topTipsText = guideData.top_tips;
        }
      } else if (Array.isArray(guideData.top_tips)) {
        // Already an array from JSONB
        topTipsText = guideData.top_tips.join("\n\n");
      } else if (typeof guideData.top_tips === "object") {
        // Handle object case
        topTipsText = JSON.stringify(guideData.top_tips);
      }
    } catch {
      topTipsText = null;
    }
  }

  const hasContent =
    topTipsText ||
    guideData.spectator_travel_options ||
    guideData.public_sustainability_commitments;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Sustainability Guide</h2>
        <p className="text-sm opacity-80">
          Event-specific sustainability information for this race
        </p>
      </div>

      {topTipsText && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Top Tips</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap">
            {topTipsText}
          </div>
        </div>
      )}

      {guideData.spectator_travel_options && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Spectator Travel Options</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap">
            {guideData.spectator_travel_options}
          </div>
        </div>
      )}

      {guideData.public_sustainability_commitments && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Public Sustainability Commitments</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            {guideData.public_sustainability_commitments}
          </div>
        </div>
      )}
    </div>
  );
}
