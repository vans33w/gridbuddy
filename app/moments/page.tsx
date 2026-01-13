"use client";

import BackHome from "../components/BackHome";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/browser";

type FolderRow = {
  id: number;
  name: string;
};

type MomentRow = {
  id: number;
  title: string | null;
  body: string | null;
  folder_id: number | null;
  entry_date: string | null; // YYYY-MM-DD
  created_at: string;
};

type PhotoRow = {
  id: number;
  moment_id: number;
  path: string;
  created_at: string;
};

export default function MomentsPage() {
  const supabase = supabaseBrowser();

  const [moments, setMoments] = useState<MomentRow[]>([]);
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | "none">("none");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [entryDate, setEntryDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [files, setFiles] = useState<File[]>([]);
  const [photoUrlsByMoment, setPhotoUrlsByMoment] = useState<Record<number, string[]>>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // edit state
  const [editingId, setEditingId] = useState<number | null>(null);

  async function requireUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw new Error(error.message);
    if (!data.user) {
      window.location.href = "/login";
      throw new Error("Not logged in");
    }
    return data.user;
  }

  function resetFormToCreate() {
    setEditingId(null);
    setTitle("");
    setBody("");
    setSelectedFolderId("none");
    setFiles([]);
    setShowForm(false);
  }

  function startEdit(m: MomentRow) {
    setError("");
    setEditingId(m.id);
    setTitle(m.title ?? "");
    setBody(m.body ?? "");
    setSelectedFolderId(m.folder_id ?? "none");
    setEntryDate(m.entry_date ?? entryDate);
    setFiles([]);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadFolders() {
    setError("");
    try {
      await requireUser();
      const { data, error } = await supabase
        .from("folders")
        .select("id,name")
        .order("created_at", { ascending: false });

      if (error) setError(error.message);
      setFolders((data as FolderRow[]) ?? []);
    } catch {}
  }

  async function loadMoments() {
    setError("");
    try {
      await requireUser();

      const { data, error } = await supabase
        .from("moments")
        .select("id,title,body,folder_id,entry_date,created_at")
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        return;
      }

      const rows = (data as MomentRow[]) ?? [];
      setMoments(rows);
      await loadPhotosForMoments(rows.map((m) => m.id));
    } catch {}
  }

  async function loadPhotosForMoments(momentIds: number[]) {
    if (momentIds.length === 0) {
      setPhotoUrlsByMoment({});
      return;
    }

    const user = await requireUser();

    const { data, error } = await supabase
      .from("moment_photos")
      .select("id,moment_id,path,created_at")
      .eq("user_id", user.id)
      .in("moment_id", momentIds)
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
      return;
    }

    const photos = ((data as PhotoRow[]) ?? []).slice(0, 500);

    const signed = await Promise.all(
      photos.map(async (p) => {
        const { data } = await supabase.storage
          .from("moment-photos")
          .createSignedUrl(p.path, 60 * 60);
        return { moment_id: p.moment_id, url: data?.signedUrl ?? "" };
      })
    );

    const map: Record<number, string[]> = {};
    for (const s of signed) {
      if (!s.url) continue;
      map[s.moment_id] = map[s.moment_id] ? [...map[s.moment_id], s.url] : [s.url];
    }
    setPhotoUrlsByMoment(map);
  }

  async function uploadPhotos(userId: string, momentId: number, uploadFiles: File[]) {
    if (uploadFiles.length === 0) return;

    for (const file of uploadFiles) {
      const safeName = file.name.replace(/\s+/g, "-");
      const path = `${userId}/${momentId}/${Date.now()}-${safeName}`;

      const { error: upErr } = await supabase.storage
        .from("moment-photos")
        .upload(path, file, { upsert: false });

      if (upErr) throw new Error(upErr.message);

      const { error: dbErr } = await supabase.from("moment_photos").insert({
        user_id: userId,
        moment_id: momentId,
        path,
      });

      if (dbErr) throw new Error(dbErr.message);
    }
  }

  async function saveMoment() {
    if (saving) return;
    setError("");
    setSaving(true);

    try {
      const user = await requireUser();

      // EDIT
      if (editingId) {
        const { error: updateErr } = await supabase
          .from("moments")
          .update({
            folder_id: selectedFolderId === "none" ? null : selectedFolderId,
            title: title || null,
            body: body || null,
            entry_date: entryDate || null,
          })
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (updateErr) throw new Error(updateErr.message);

        // Optional: append new photos while editing
        await uploadPhotos(user.id, editingId, files);

        resetFormToCreate();
        await loadMoments();
        return;
      }

      // CREATE
      const { data: created, error: insertErr } = await supabase
        .from("moments")
        .insert({
          user_id: user.id,
          folder_id: selectedFolderId === "none" ? null : selectedFolderId,
          title: title || null,
          body: body || null,
          entry_date: entryDate || null,
        })
        .select("id")
        .single();

      if (insertErr) throw new Error(insertErr.message);
      const momentId = created?.id as number;

      await uploadPhotos(user.id, momentId, files);

      resetFormToCreate();
      await loadMoments();
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMoment(momentId: number) {
    if (saving) return;
    setError("");

    const ok = window.confirm(
      "Delete this moment? This will remove the entry and its photos. This cannot be undone."
    );
    if (!ok) return;

    setSaving(true);

    try {
      const user = await requireUser();

      // 1) Get photo paths so we can remove files
      const { data: photos, error: photoErr } = await supabase
        .from("moment_photos")
        .select("path")
        .eq("user_id", user.id)
        .eq("moment_id", momentId);

      if (photoErr) throw new Error(photoErr.message);

      const paths = ((photos as { path: string }[]) ?? []).map((p) => p.path);

      // 2) Delete photo rows
      const { error: delPhotoRowsErr } = await supabase
        .from("moment_photos")
        .delete()
        .eq("user_id", user.id)
        .eq("moment_id", momentId);

      if (delPhotoRowsErr) throw new Error(delPhotoRowsErr.message);

      // 3) Delete storage files (best-effort)
      if (paths.length > 0) {
        await supabase.storage.from("moment-photos").remove(paths);
      }

      // 4) Delete the moment row
      const { error: delMomentErr } = await supabase
        .from("moments")
        .delete()
        .eq("user_id", user.id)
        .eq("id", momentId);

      if (delMomentErr) throw new Error(delMomentErr.message);

      // If you were editing this moment, exit edit mode
      if (editingId === momentId) resetFormToCreate();

      await loadMoments();
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  const fileLabel = useMemo(() => {
    if (files.length === 0) return editingId ? "No new photos selected" : "No photos selected";
    if (files.length === 1) return files[0].name;
    return `${files.length} photos selected`;
  }, [files, editingId]);

  useEffect(() => {
    loadFolders();
    loadMoments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="space-y-8">
      <BackHome />

      {/* Page Title */}
      <div className="space-y-2">
        <h1
          className="text-3xl font-bold text-[var(--secondary)]"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          MY DIARY
        </h1>
        <div className="border-t border-[var(--border)]"></div>
      </div>

      {/* Add New Moment Button */}
      <button
        onClick={() => {
          if (editingId) {
            resetFormToCreate();
          } else {
            setShowForm(!showForm);
          }
        }}
        className="w-full card p-6 flex items-center justify-center gap-3 hover:shadow-lg transition-all hover:border-[var(--primary)] group"
      >
        <span className="text-3xl font-bold text-[var(--primary)] group-hover:scale-110 transition-transform">
          +
        </span>
        <span className="text-lg font-semibold text-[var(--secondary)]">
          Add new moment
        </span>
      </button>

      {/* Form Section (Collapsible) */}
      {showForm && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div
              className="font-semibold text-lg text-[var(--secondary)]"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {editingId ? "Edit entry" : "New entry"}
            </div>

            <button
              className="btn-text text-sm"
              onClick={resetFormToCreate}
              disabled={saving}
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label className="text-sm opacity-80">Entry date</label>
            <input
              className="border border-[var(--border)] p-2 w-full rounded-lg"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
            />
          </div>

          <input
            className="border border-[var(--border)] p-2 w-full rounded-lg"
            placeholder="Title (e.g., 'Silverstone weekend')"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="border border-[var(--border)] p-2 w-full min-h-[160px] rounded-lg"
            placeholder="Write your journal entry..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          <select
            className="border border-[var(--border)] p-2 w-full rounded-lg"
            value={selectedFolderId}
            onChange={(e) =>
              setSelectedFolderId(e.target.value === "none" ? "none" : Number(e.target.value))
            }
          >
            <option value="none">No folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <div className="space-y-1">
            <label className="text-sm opacity-80">
              Photos {editingId ? "(optional: add more)" : ""}
            </label>
            <input
              className="border border-[var(--border)] p-2 w-full rounded-lg"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
            <div className="text-xs opacity-70">{fileLabel}</div>
          </div>

          <button
            className="btn-primary px-4 py-2 w-full"
            onClick={saveMoment}
            disabled={saving}
          >
            {saving ? "Saving..." : editingId ? "Save changes" : "Save entry"}
          </button>

          {error && <p className="text-[var(--primary)] text-sm">{error}</p>}
        </div>
      )}

      {/* Diary Entries */}
      <div className="space-y-6">
        {moments.map((m) => {
          const urls = photoUrlsByMoment[m.id] ?? [];
          const displayDate = m.entry_date
            ? new Date(m.entry_date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : new Date(m.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });

          return (
            <div key={m.id} className="card overflow-hidden">
              <div className="flex flex-col md:flex-row gap-0">
                {/* Photo Section (Left) */}
                <div className="md:w-48 w-full h-48 md:h-auto bg-[var(--secondary)]/5 flex items-center justify-center shrink-0">
                  {urls.length > 0 ? (
                    <img
                      src={urls[0]}
                      alt="Moment photo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-[var(--secondary)]/30">
                      <svg
                        className="w-16 h-16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Details Section (Right) */}
                <div className="flex-1 p-6 space-y-3">
                  <div className="space-y-1">
                    <h3
                      className="text-xl font-bold text-[var(--secondary)]"
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      {m.title ?? "Untitled"}
                    </h3>
                    <p className="text-sm text-[var(--secondary)]/60">{displayDate}</p>
                  </div>

                  {m.body && (
                    <div className="text-sm text-[var(--secondary)]/80 whitespace-pre-wrap leading-relaxed">
                      {m.body}
                    </div>
                  )}

                  {urls.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pt-2">
                      {urls.slice(1).map((u, idx) => (
                        <img
                          key={idx}
                          src={u}
                          alt="Moment photo"
                          className="h-20 rounded-md border border-[var(--border)] shrink-0"
                        />
                      ))}
                    </div>
                  )}

                  <div className="pt-2 flex gap-4 border-t border-[var(--border)]">
                    <button
                      className="btn-text text-sm"
                      onClick={() => startEdit(m)}
                      disabled={saving}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-text-danger text-sm"
                      onClick={() => deleteMoment(m.id)}
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {moments.length === 0 && (
          <div className="text-center py-12 text-[var(--secondary)]/60">
            <p>No entries yet. Click "Add new moment" to get started.</p>
          </div>
        )}
      </div>
    </main>
  );
}
