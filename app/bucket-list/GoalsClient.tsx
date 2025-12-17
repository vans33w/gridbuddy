"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/browser";

type GoalRow = {
  id: number;
  title: string;
  status: "in_progress" | "achieved";
  created_at: string;
  achieved_at: string | null;
};

export default function GoalsClient({
  initialGoals,
}: {
  initialGoals: GoalRow[];
}) {
  const supabase = supabaseBrowser();

  const [goals, setGoals] = useState<GoalRow[]>(initialGoals ?? []);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function isAuthMissingError(e: any) {
    return String(e?.message ?? "")
      .toLowerCase()
      .includes("auth session missing");
  }

  async function requireUserId(): Promise<string> {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (isAuthMissingError(error)) window.location.href = "/login";
      throw new Error(error.message);
    }
    if (!data.user) {
      window.location.href = "/login";
      throw new Error("Not logged in");
    }
    return data.user.id;
  }

  async function reloadGoals() {
    setError("");
    const uid = await requireUserId();

    const { data, error } = await supabase
      .from("goals")
      .select("id,title,status,created_at,achieved_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }
    setGoals((data as GoalRow[]) ?? []);
  }

  async function addGoal() {
    const t = title.trim();
    if (!t) return;

    setBusy(true);
    setError("");
    try {
      const uid = await requireUserId();

      const { error } = await supabase.from("goals").insert({
        user_id: uid,
        title: t,
        status: "in_progress",
        achieved_at: null,
      });

      if (error) throw new Error(error.message);

      setTitle("");
      await reloadGoals();
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  async function setGoalStatus(
    goalId: number,
    next: "in_progress" | "achieved"
  ) {
    setBusy(true);
    setError("");
    try {
      await requireUserId();

      const patch =
        next === "achieved"
          ? { status: "achieved", achieved_at: new Date().toISOString() }
          : { status: "in_progress", achieved_at: null };

      const { error } = await supabase
        .from("goals")
        .update(patch)
        .eq("id", goalId);
      if (error) throw new Error(error.message);

      await reloadGoals();
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteGoal(goalId: number) {
    setBusy(true);
    setError("");
    try {
      await requireUserId();

      const { error } = await supabase.from("goals").delete().eq("id", goalId);
      if (error) throw new Error(error.message);

      await reloadGoals();
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  const inProgress = useMemo(
    () => goals.filter((g) => g.status === "in_progress"),
    [goals]
  );
  const achieved = useMemo(
    () => goals.filter((g) => g.status === "achieved"),
    [goals]
  );

  useEffect(() => {
    // keep goals fresh if auth changes
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      reloadGoals();
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="card p-4 space-y-4">
      <div className="font-semibold">Goals</div>

      <div className="border border-[var(--border)] rounded-lg p-3 space-y-2">
        <div className="text-sm font-medium">Add a goal</div>
        <div className="flex gap-2">
          <input
            className="border p-2 w-full"
            placeholder="e.g. Attend Monaco GP, Visit Ferrari museum, Karting PB under 55s..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy}
          />
          <button
            className="btn-primary px-4 py-2"
            onClick={addGoal}
            disabled={busy}
          >
            Add
          </button>
        </div>
        {error && !error.toLowerCase().includes("auth session missing") && (
          <div className="text-red-600 text-sm">{error}</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-[var(--border)] rounded-lg p-3 space-y-2">
          <div className="font-medium">In progress</div>

          {inProgress.map((g) => (
            <div
              key={g.id}
              className="border border-[var(--border)] rounded-md p-2 flex items-center justify-between gap-3"
            >
              <div className="text-sm">{g.title}</div>
              <div className="flex gap-3 shrink-0">
                <button
                  className="btn-text text-sm"
                  onClick={() => setGoalStatus(g.id, "achieved")}
                  disabled={busy}
                >
                  Achieve
                </button>
                <button
                  className="btn-text text-sm"
                  onClick={() => deleteGoal(g.id)}
                  disabled={busy}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {inProgress.length === 0 && (
            <div className="text-sm opacity-70">None yet.</div>
          )}
        </div>

        <div className="border border-[var(--border)] rounded-lg p-3 space-y-2">
          <div className="font-medium">Achieved</div>

          {achieved.map((g) => (
            <div
              key={g.id}
              className="border border-[var(--border)] rounded-md p-2 flex items-center justify-between gap-3"
            >
              <div className="text-sm">
                {g.title}
                {g.achieved_at ? (
                  <span className="text-xs opacity-70">
                    {" "}
                    • {new Date(g.achieved_at).toLocaleDateString()}
                  </span>
                ) : null}
              </div>
              <div className="flex gap-3 shrink-0">
                <button
                  className="btn-text text-sm"
                  onClick={() => setGoalStatus(g.id, "in_progress")}
                  disabled={busy}
                >
                  Undo
                </button>
                <button
                  className="btn-text text-sm"
                  onClick={() => deleteGoal(g.id)}
                  disabled={busy}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {achieved.length === 0 && (
            <div className="text-sm opacity-70">None yet.</div>
          )}
        </div>
      </div>
    </section>
  );
}
