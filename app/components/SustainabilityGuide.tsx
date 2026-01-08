import { supabaseServer } from "../../lib/supabase/server";

type SustainabilityGuide = {
  id: number;
  track_id: number;
  routes: string | null;
  transit_tips: string | null;
  avoid_section: string | null;
  checklist: string[] | null;
};

type SustainabilityGuideProps = {
  trackId: number;
};

export default async function SustainabilityGuide({ trackId }: SustainabilityGuideProps) {
  const supabase = await supabaseServer();

  const { data: guide, error } = await supabase
    .from("track_sustainability_guides")
    .select("*")
    .eq("track_id", trackId)
    .maybeSingle();

  if (error || !guide) {
    return null;
  }

  const guideData = guide as SustainabilityGuide;

  // Parse checklist if it's a JSON string
  let checklist: string[] = [];
  if (guideData.checklist) {
    try {
      checklist = typeof guideData.checklist === "string" 
        ? JSON.parse(guideData.checklist) 
        : guideData.checklist;
    } catch {
      checklist = [];
    }
  }

  const hasContent =
    guideData.routes ||
    guideData.transit_tips ||
    guideData.avoid_section ||
    checklist.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Sustainability Guide</h2>
        <p className="text-sm opacity-80">
          Tips for traveling sustainably to this track location
        </p>
      </div>

      {guideData.routes && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Recommended Routes</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap">{guideData.routes}</div>
        </div>
      )}

      {guideData.transit_tips && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Local Transit Tips</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap">{guideData.transit_tips}</div>
        </div>
      )}

      {guideData.avoid_section && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Things to Avoid</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            {guideData.avoid_section}
          </div>
        </div>
      )}

      {checklist.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Sustainability Checklist</h3>
          <ul className="space-y-2">
            {checklist.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span className="opacity-90">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

