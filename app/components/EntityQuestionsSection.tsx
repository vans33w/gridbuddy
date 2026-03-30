"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/browser";
import UpvoteHeart from "./UpvoteHeart";

type EntityKind = "track" | "race";

function basePath(k: EntityKind) {
  return k === "track" ? "tracks" : "races";
}

type QuestionRow = {
  id: number;
  user_id: string;
  body: string;
  created_at: string;
};

type AnswerRow = {
  id: number;
  question_id: number;
  user_id: string;
  body: string;
  created_at: string;
};

export default function EntityQuestionsSection({
  entityType,
  entityId,
  entitySlug,
  variant,
  highlightQuestionId,
}: {
  entityType: EntityKind;
  entityId: number;
  entitySlug: string;
  variant: "preview" | "full";
  highlightQuestionId?: number | null;
}) {
  const supabase = supabaseBrowser();
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [answersByQ, setAnswersByQ] = useState<Record<number, AnswerRow[]>>({});
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [qUpCounts, setQUpCounts] = useState<Record<number, number>>({});
  const [aUpCounts, setAUpCounts] = useState<Record<number, number>>({});
  const [userQUp, setUserQUp] = useState<Set<number>>(new Set());
  const [userAUp, setUserAUp] = useState<Set<number>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [voteBusy, setVoteBusy] = useState(false);
  const [submittingQ, setSubmittingQ] = useState(false);
  const [submittingA, setSubmittingA] = useState<Record<number, boolean>>({});
  const [newQuestion, setNewQuestion] = useState("");
  const [answerDrafts, setAnswerDrafts] = useState<Record<number, string>>({});
  const highlightRef = useRef<HTMLLIElement | null>(null);

  const loadUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id ?? null;
    setUserId(uid);
    return uid;
  }, [supabase]);

  const loadProfiles = useCallback(
    async (ids: string[]) => {
      const uniq = [...new Set(ids)].filter(Boolean);
      if (uniq.length === 0) return;
      const { data } = await supabase.from("profiles").select("id,username").in("id", uniq);
      const map: Record<string, string> = {};
      for (const p of data ?? []) {
        map[p.id as string] = (p.username as string) ?? "User";
      }
      setUsernames((prev) => ({ ...prev, ...map }));
    },
    [supabase]
  );

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const { data: qData, error: qErr } = await supabase
        .from("entity_questions")
        .select("id,user_id,body,created_at")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false })
        .limit(variant === "preview" ? 200 : 500);

      if (qErr) throw new Error(qErr.message);
      const qRows = (qData as QuestionRow[]) ?? [];
      setQuestions(qRows);

      const qIds = qRows.map((q) => q.id);
      if (qIds.length === 0) {
        setAnswersByQ({});
        setQUpCounts({});
        setAUpCounts({});
        setUserQUp(new Set());
        setUserAUp(new Set());
        await loadProfiles(qRows.map((q) => q.user_id));
        setLoading(false);
        return;
      }

      const { data: aData, error: aErr } = await supabase
        .from("entity_answers")
        .select("id,question_id,user_id,body,created_at")
        .in("question_id", qIds)
        .order("created_at", { ascending: true });

      if (aErr) throw new Error(aErr.message);
      const aRows = (aData as AnswerRow[]) ?? [];
      const byQ: Record<number, AnswerRow[]> = {};
      for (const a of aRows) {
        if (!byQ[a.question_id]) byQ[a.question_id] = [];
        byQ[a.question_id].push(a);
      }
      setAnswersByQ(byQ);

      const { data: qu } = await supabase.from("entity_question_upvotes").select("question_id,user_id").in("question_id", qIds);
      const qc: Record<number, number> = {};
      const uq = new Set<number>();
      const uid = await loadUser();
      for (const row of qu ?? []) {
        qc[row.question_id] = (qc[row.question_id] ?? 0) + 1;
        if (uid && row.user_id === uid) uq.add(row.question_id);
      }
      setQUpCounts(qc);
      setUserQUp(uq);

      const aIds = aRows.map((a) => a.id);
      let ac: Record<number, number> = {};
      let ua = new Set<number>();
      if (aIds.length > 0) {
        const { data: au } = await supabase.from("entity_answer_upvotes").select("answer_id,user_id").in("answer_id", aIds);
        for (const row of au ?? []) {
          ac[row.answer_id] = (ac[row.answer_id] ?? 0) + 1;
          if (uid && row.user_id === uid) ua.add(row.answer_id);
        }
      }
      setAUpCounts(ac);
      setUserAUp(ua);

      const uids = [...qRows.map((q) => q.user_id), ...aRows.map((a) => a.user_id)];
      await loadProfiles(uids);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, loadProfiles, loadUser, supabase, variant]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (highlightQuestionId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [highlightQuestionId, loading, questions]);

  const sortedQuestions = useMemo(() => {
    const list = [...questions];
    list.sort((a, b) => {
      const ca = qUpCounts[a.id] ?? 0;
      const cb = qUpCounts[b.id] ?? 0;
      if (cb !== ca) return cb - ca;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [questions, qUpCounts]);

  const topQuestions = variant === "preview" ? sortedQuestions.slice(0, 3) : sortedQuestions;

  function bestAnswer(qid: number): AnswerRow | null {
    const list = answersByQ[qid] ?? [];
    if (list.length === 0) return null;
    const sorted = [...list].sort((a, b) => {
      const ca = aUpCounts[a.id] ?? 0;
      const cb = aUpCounts[b.id] ?? 0;
      if (cb !== ca) return cb - ca;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    return sorted[0] ?? null;
  }

  function sortedAnswersForThread(qid: number): AnswerRow[] {
    const list = [...(answersByQ[qid] ?? [])];
    list.sort((a, b) => {
      const ca = aUpCounts[a.id] ?? 0;
      const cb = aUpCounts[b.id] ?? 0;
      if (cb !== ca) return cb - ca;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    return list;
  }

  const seeAllHref = `/${basePath(entityType)}/${entitySlug}/questions`;

  async function toggleQuestionUpvote(questionId: number) {
    if (!userId || voteBusy) return;
    setVoteBusy(true);
    setError("");
    try {
      const has = userQUp.has(questionId);
      if (has) {
        await supabase.from("entity_question_upvotes").delete().eq("user_id", userId).eq("question_id", questionId);
        setUserQUp((p) => {
          const n = new Set(p);
          n.delete(questionId);
          return n;
        });
        setQUpCounts((p) => ({ ...p, [questionId]: Math.max(0, (p[questionId] ?? 1) - 1) }));
      } else {
        await supabase.from("entity_question_upvotes").insert({ user_id: userId, question_id: questionId });
        setUserQUp((p) => new Set(p).add(questionId));
        setQUpCounts((p) => ({ ...p, [questionId]: (p[questionId] ?? 0) + 1 }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Vote failed");
    } finally {
      setVoteBusy(false);
    }
  }

  async function toggleAnswerUpvote(answerId: number) {
    if (!userId || voteBusy) return;
    setVoteBusy(true);
    setError("");
    try {
      const has = userAUp.has(answerId);
      if (has) {
        await supabase.from("entity_answer_upvotes").delete().eq("user_id", userId).eq("answer_id", answerId);
        setUserAUp((p) => {
          const n = new Set(p);
          n.delete(answerId);
          return n;
        });
        setAUpCounts((p) => ({ ...p, [answerId]: Math.max(0, (p[answerId] ?? 1) - 1) }));
      } else {
        await supabase.from("entity_answer_upvotes").insert({ user_id: userId, answer_id: answerId });
        setUserAUp((p) => new Set(p).add(answerId));
        setAUpCounts((p) => ({ ...p, [answerId]: (p[answerId] ?? 0) + 1 }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Vote failed");
    } finally {
      setVoteBusy(false);
    }
  }

  async function postQuestion() {
    const t = newQuestion.trim();
    if (!t) return;
    if (!userId) {
      window.location.href = "/login";
      return;
    }
    setSubmittingQ(true);
    setError("");
    try {
      const { error: insErr } = await supabase.from("entity_questions").insert({
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        body: t,
      });
      if (insErr) throw new Error(insErr.message);
      setNewQuestion("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post question");
    } finally {
      setSubmittingQ(false);
    }
  }

  async function postAnswer(questionId: number) {
    const t = (answerDrafts[questionId] ?? "").trim();
    if (!t) return;
    if (!userId) {
      window.location.href = "/login";
      return;
    }
    setSubmittingA((p) => ({ ...p, [questionId]: true }));
    setError("");
    try {
      const { error: insErr } = await supabase.from("entity_answers").insert({
        user_id: userId,
        question_id: questionId,
        body: t,
      });
      if (insErr) throw new Error(insErr.message);
      setAnswerDrafts((p) => ({ ...p, [questionId]: "" }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post answer");
    } finally {
      setSubmittingA((p) => ({ ...p, [questionId]: false }));
    }
  }

  function renderAnswerRow(a: AnswerRow, indented: boolean) {
    return (
      <div
        key={a.id}
        className={`flex flex-col sm:flex-row sm:items-start gap-2 ${indented ? "ml-4 sm:ml-6 pl-3 border-l-2 border-[var(--border)]" : ""}`}
      >
        <div className="flex-1 min-w-0 space-y-1">
          <div className="text-xs text-[var(--secondary)]/70">
            <span className="font-medium text-[var(--secondary)]">{usernames[a.user_id] ?? "User"}</span>
            <span className="mx-1 opacity-50">·</span>
            {new Date(a.created_at).toLocaleDateString()}
          </div>
          <p className="text-sm whitespace-pre-wrap">{a.body}</p>
        </div>
        <UpvoteHeart
          count={aUpCounts[a.id] ?? 0}
          active={userAUp.has(a.id)}
          disabled={!userId}
          busy={voteBusy}
          onToggle={() => void toggleAnswerUpvote(a.id)}
          label={userAUp.has(a.id) ? "Remove upvote" : "Upvote answer"}
        />
      </div>
    );
  }

  return (
    <section className="card p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-semibold text-lg text-[var(--secondary)]" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          Questions
        </h2>
        {variant === "preview" && (
          <Link href={seeAllHref} className="btn-text text-sm">
            See all
          </Link>
        )}
      </div>

      <div className="border border-[var(--border)] rounded-lg p-3 space-y-2">
        <div className="text-sm font-medium text-[var(--secondary)]/80">Ask a question</div>
        <textarea
          className="border border-[var(--border)] rounded-lg p-2 w-full min-h-[72px] text-sm"
          placeholder={userId ? "What would you like to know?" : "Log in to ask"}
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          disabled={!userId || submittingQ}
        />
        <button
          type="button"
          className="btn-primary px-4 py-2 text-sm"
          disabled={!userId || submittingQ || !newQuestion.trim()}
          onClick={() => void postQuestion()}
        >
          {submittingQ ? "Posting…" : "Post question"}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? (
        <p className="text-sm opacity-70">Loading questions…</p>
      ) : topQuestions.length === 0 ? (
        <p className="text-sm opacity-70">No questions yet.</p>
      ) : (
        <ul className="space-y-4">
          {topQuestions.map((q) => {
            const topA = bestAnswer(q.id);
            const thread = variant === "full" ? sortedAnswersForThread(q.id) : [];
            const isHi = highlightQuestionId === q.id;
            return (
              <li
                key={q.id}
                id={`question-${q.id}`}
                ref={isHi ? highlightRef : undefined}
                className={`border border-[var(--border)] rounded-lg p-3 space-y-3 ${isHi ? "ring-2 ring-[var(--primary)]/40" : ""}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{usernames[q.user_id] ?? "User"}</span>
                      <span className="text-xs opacity-50">{new Date(q.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm font-medium text-[var(--secondary)] whitespace-pre-wrap">{q.body}</p>
                  </div>
                  <UpvoteHeart
                    count={qUpCounts[q.id] ?? 0}
                    active={userQUp.has(q.id)}
                    disabled={!userId}
                    busy={voteBusy}
                    onToggle={() => void toggleQuestionUpvote(q.id)}
                    label={userQUp.has(q.id) ? "Remove upvote" : "Upvote question"}
                  />
                </div>

                {variant === "preview" && topA && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-[var(--secondary)]/70 uppercase tracking-wide">
                      Top answer
                    </div>
                    {renderAnswerRow(topA, true)}
                    {(answersByQ[q.id] ?? []).length > 1 && (
                      <Link href={`${seeAllHref}?q=${q.id}`} className="btn-text text-sm inline-block">
                        See more answers
                      </Link>
                    )}
                  </div>
                )}

                {variant === "preview" && userId && (
                  <div className="pt-2 space-y-2 border-t border-[var(--border)]">
                    <textarea
                      className="border border-[var(--border)] rounded-lg p-2 w-full text-sm min-h-[56px]"
                      placeholder={topA ? "Add another answer…" : "Be the first to answer…"}
                      value={answerDrafts[q.id] ?? ""}
                      onChange={(e) => setAnswerDrafts((p) => ({ ...p, [q.id]: e.target.value }))}
                      disabled={!!submittingA[q.id]}
                    />
                    <button
                      type="button"
                      className="btn-secondary px-3 py-1.5 text-sm"
                      disabled={!!submittingA[q.id] || !(answerDrafts[q.id] ?? "").trim()}
                      onClick={() => void postAnswer(q.id)}
                    >
                      {submittingA[q.id] ? "Posting…" : "Post answer"}
                    </button>
                  </div>
                )}

                {variant === "full" && (
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-[var(--secondary)]/70 uppercase tracking-wide">
                      Answers ({thread.length})
                    </div>
                    {thread.length === 0 ? (
                      <p className="text-sm opacity-70">No answers yet.</p>
                    ) : (
                      <div className="space-y-3">{thread.map((a) => renderAnswerRow(a, true))}</div>
                    )}
                    {userId && (
                      <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                        <textarea
                          className="border border-[var(--border)] rounded-lg p-2 w-full text-sm min-h-[56px]"
                          placeholder="Write an answer…"
                          value={answerDrafts[q.id] ?? ""}
                          onChange={(e) => setAnswerDrafts((p) => ({ ...p, [q.id]: e.target.value }))}
                          disabled={!!submittingA[q.id]}
                        />
                        <button
                          type="button"
                          className="btn-primary px-3 py-1.5 text-sm"
                          disabled={!!submittingA[q.id] || !(answerDrafts[q.id] ?? "").trim()}
                          onClick={() => void postAnswer(q.id)}
                        >
                          {submittingA[q.id] ? "Posting…" : "Post answer"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
