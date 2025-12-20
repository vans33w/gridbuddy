"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/browser";

type ParentComment = {
  id: number;
  body: string;
  profiles: { username: string } | null;
};

type CommentRow = {
  id: number;
  user_id: string;
  body: string;
  created_at: string;
  reply_to: number | null;
  profiles: { username: string } | null;
  parent: ParentComment | null;
};

type CommentProps = {
  comment: CommentRow;
  userId: string | null;
  likedByUser: boolean;
  likesCount: number;
  onLikeToggle: (commentId: number) => void;
  onReply: (commentId: number) => void;
  replyingTo: number | null;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  onSubmitReply: () => void;
  onCancelReply: () => void;
  busy: boolean;
  submittingReply: boolean;
};

function Comment({
  comment,
  userId,
  likedByUser,
  likesCount,
  onLikeToggle,
  onReply,
  replyingTo,
  replyText,
  onReplyTextChange,
  onSubmitReply,
  onCancelReply,
  busy,
  submittingReply,
}: CommentProps) {
  const username = comment.profiles?.username ?? "Unknown";
  const date = new Date(comment.created_at).toLocaleDateString();
  const isReplying = replyingTo === comment.id;

  return (
    <div className="border border-[var(--border)] rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{username}</span>
            <span className="opacity-50 text-xs">{date}</span>

            <div className="flex items-center gap-1 shrink-0 ml-auto">
              {/* Reply button (only for logged-in users) */}
              {userId && (
                <button
                  onClick={() => onReply(comment.id)}
                  className="text-neutral-400 hover:text-neutral-600 p-1 rounded transition-colors"
                  title="Reply"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10h10a5 5 0 015 5v6M3 10l6 6M3 10l6-6"
                    />
                  </svg>
                </button>
              )}

              {/* Like button */}
              <button
                onClick={() => onLikeToggle(comment.id)}
                disabled={busy || !userId}
                className={`flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors ${
                  likedByUser
                    ? "text-red-600"
                    : "text-neutral-400 hover:text-neutral-600"
                } ${!userId ? "opacity-50 cursor-not-allowed" : ""}`}
                title={
                  !userId ? "Log in to like" : likedByUser ? "Unlike" : "Like"
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={likedByUser ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
                <span>{likesCount}</span>
              </button>
            </div>
          </div>

          {/* Parent comment preview (if this is a reply) */}
          {comment.parent?.body && (
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded p-2 text-xs opacity-80 border-l-2 border-neutral-300">
              <span className="font-medium">
                {comment.parent.profiles?.username ?? "Unknown"}
              </span>
              <span className="mx-1">·</span>
              <span className="line-clamp-1">{comment.parent.body}</span>
            </div>
          )}

          <p className="text-sm mt-1 whitespace-pre-wrap">{comment.body}</p>
        </div>
      </div>

      {/* Reply input */}
      {isReplying && (
        <div className="pt-2 space-y-2 border-t border-[var(--border)]">
          <input
            type="text"
            className="border p-2 w-full text-sm"
            placeholder={`Reply to ${username}...`}
            value={replyText}
            onChange={(e) => onReplyTextChange(e.target.value)}
            disabled={submittingReply}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmitReply();
              }
              if (e.key === "Escape") {
                onCancelReply();
              }
            }}
          />
          <div className="flex gap-2">
            <button
              className="btn-primary px-3 py-1 text-sm"
              onClick={onSubmitReply}
              disabled={submittingReply || !replyText.trim()}
            >
              {submittingReply ? "..." : "Reply"}
            </button>
            <button
              className="btn-text text-sm"
              onClick={onCancelReply}
              disabled={submittingReply}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type CommentsProps = {
  entityType: "track" | "race";
  entityId: number;
};

export default function Comments({ entityType, entityId }: CommentsProps) {
  const supabase = supabaseBrowser();

  const [comments, setComments] = useState<CommentRow[]>([]);
  const [likesMap, setLikesMap] = useState<Record<number, number>>({});
  const [userLikes, setUserLikes] = useState<Set<number>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [error, setError] = useState("");

  // Reply state
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  async function loadUser() {
    const { data } = await supabase.auth.getUser();
    setUserId(data.user?.id ?? null);
    return data.user?.id ?? null;
  }

  async function loadComments() {
    setError("");
    setLoading(true);

    try {
      // Fetch comments with profiles (no self-join)
      const { data: commentsData, error: commentsErr } = await supabase
        .from("comments")
        .select(
          `
          id,
          user_id,
          body,
          created_at,
          reply_to,
          profiles(username)
        `
        )
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });

      if (commentsErr) throw new Error(commentsErr.message);

      type RawCommentFromDB = {
        id: number;
        user_id: string;
        body: string;
        created_at: string;
        reply_to: number | null;
        profiles: { username: string }[] | { username: string } | null;
      };

      const rawFromDB = (commentsData as unknown as RawCommentFromDB[]) ?? [];

      // Normalize profiles (Supabase returns array for joins, we want single object)
      const rawRows = rawFromDB.map((c) => ({
        ...c,
        profiles: Array.isArray(c.profiles)
          ? c.profiles[0] ?? null
          : c.profiles,
      }));

      if (rawRows.length === 0) {
        setComments([]);
        setLikesMap({});
        setUserLikes(new Set());
        setLoading(false);
      }

      // Fetch parent comments for replies
      const parentIds = [
        ...new Set(
          rawRows
            .map((c) => c.reply_to)
            .filter((id): id is number => id !== null)
        ),
      ];

      const parentMap: Record<number, ParentComment> = {};
      if (parentIds.length > 0) {
        const { data: parentsData } = await supabase
          .from("comments")
          .select("id, body, profiles(username)")
          .in("id", parentIds);

        if (parentsData) {
          for (const p of parentsData as unknown as RawCommentFromDB[]) {
            const profile = Array.isArray(p.profiles)
              ? p.profiles[0] ?? null
              : p.profiles;
            parentMap[p.id] = { id: p.id, body: p.body, profiles: profile };
          }
        }
      }

      // Merge parent data into comments
      const rows: CommentRow[] = rawRows.map((c) => ({
        ...c,
        parent: c.reply_to ? parentMap[c.reply_to] ?? null : null,
      }));

      setComments(rows);

      const uid = await loadUser();
      const commentIds = rows.map((c) => c.id);

      if (commentIds.length === 0) {
        return;
      }

      // Fetch like counts
      const { data: likesData } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .in("comment_id", commentIds);

      const counts: Record<number, number> = {};
      for (const like of likesData ?? []) {
        counts[like.comment_id] = (counts[like.comment_id] ?? 0) + 1;
      }
      setLikesMap(counts);

      // Fetch user's likes
      if (uid) {
        const { data: userLikesData } = await supabase
          .from("comment_likes")
          .select("comment_id")
          .eq("user_id", uid)
          .in("comment_id", commentIds);

        setUserLikes(new Set(userLikesData?.map((l) => l.comment_id) ?? []));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(replyToId: number | null = null) {
    const body = replyToId ? replyText.trim() : newComment.trim();
    if (!body) return;

    setError("");
    if (replyToId) {
      setSubmittingReply(true);
    } else {
      setSubmitting(true);
    }

    try {
      const uid = await loadUser();
      if (!uid) {
        window.location.href = "/login";
        return;
      }

      const { error: insertErr } = await supabase.from("comments").insert({
        user_id: uid,
        entity_type: entityType,
        entity_id: entityId,
        body,
        reply_to: replyToId,
      });

      if (insertErr) throw new Error(insertErr.message);

      if (replyToId) {
        setReplyText("");
        setReplyingTo(null);
      } else {
        setNewComment("");
      }
      await loadComments();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
      setSubmittingReply(false);
    }
  }

  async function handleLikeToggle(commentId: number) {
    if (!userId || likeBusy) return;

    setLikeBusy(true);
    setError("");

    try {
      const hasLiked = userLikes.has(commentId);

      if (hasLiked) {
        await supabase
          .from("comment_likes")
          .delete()
          .eq("user_id", userId)
          .eq("comment_id", commentId);

        setUserLikes((prev) => {
          const next = new Set(prev);
          next.delete(commentId);
          return next;
        });
        setLikesMap((prev) => ({
          ...prev,
          [commentId]: Math.max(0, (prev[commentId] ?? 1) - 1),
        }));
      } else {
        await supabase.from("comment_likes").insert({
          user_id: userId,
          comment_id: commentId,
        });

        setUserLikes((prev) => new Set(prev).add(commentId));
        setLikesMap((prev) => ({
          ...prev,
          [commentId]: (prev[commentId] ?? 0) + 1,
        }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update like");
    } finally {
      setLikeBusy(false);
    }
  }

  function handleReply(commentId: number) {
    if (replyingTo === commentId) {
      setReplyingTo(null);
      setReplyText("");
    } else {
      setReplyingTo(commentId);
      setReplyText("");
    }
  }

  function handleCancelReply() {
    setReplyingTo(null);
    setReplyText("");
  }

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  return (
    <div className="card p-4 space-y-4">
      <div className="font-semibold">Comments</div>

      {/* New comment form */}
      <div className="space-y-2">
        <textarea
          className="border p-2 w-full min-h-[80px]"
          placeholder={userId ? "Write a comment..." : "Log in to comment"}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={!userId || submitting}
        />
        <div className="flex items-center justify-between gap-3">
          <button
            className="btn-primary px-4 py-2"
            onClick={() => handleSubmit(null)}
            disabled={!userId || submitting || !newComment.trim()}
          >
            {submitting ? "Posting..." : "Post comment"}
          </button>
          {!userId && (
            <span className="text-sm opacity-70">
              <a href="/login" className="btn-text">
                Log in
              </a>{" "}
              to comment
            </span>
          )}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Comments list */}
      <div className="space-y-3">
        {loading && comments.length === 0 ? (
          <p className="text-sm opacity-70">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm opacity-70">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              userId={userId}
              likedByUser={userLikes.has(comment.id)}
              likesCount={likesMap[comment.id] ?? 0}
              onLikeToggle={handleLikeToggle}
              onReply={handleReply}
              replyingTo={replyingTo}
              replyText={replyText}
              onReplyTextChange={setReplyText}
              onSubmitReply={() => handleSubmit(replyingTo)}
              onCancelReply={handleCancelReply}
              busy={likeBusy}
              submittingReply={submittingReply}
            />
          ))
        )}
      </div>
    </div>
  );
}
