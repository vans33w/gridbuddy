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
  }

  function startEdit(m: MomentRow) {
    setError("");
    setEditingId(m.id);
    setTitle(m.title ?? "");
    setBody(m.body ?? "");
    setSelectedFolderId(m.folder_id ?? "none");
    setEntryDate(m.entry_date ?? entryDate);
    setFiles([]);
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
    <main className="space-y-4">
      <BackHome />

      <h1 className="text-2xl font-bold">Moments</h1>

      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold">{editingId ? "Edit entry" : "New entry"}</div>

          {editingId && (
            <button className="btn-text text-sm" onClick={resetFormToCreate} disabled={saving}>
              Cancel edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2">
          <label className="text-sm opacity-80">Entry date</label>
          <input
            className="border p-2 w-full"
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
          />
        </div>

        <input
          className="border p-2 w-full"
          placeholder="Title (e.g., 'Silverstone weekend')"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="border p-2 w-full min-h-[160px]"
          placeholder="Write your journal entry..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        <select
          className="border p-2 w-full"
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
          <label className="text-sm opacity-80">Photos {editingId ? "(optional: add more)" : ""}</label>
          <input
            className="border p-2 w-full rounded-md"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
          <div className="text-xs opacity-70">{fileLabel}</div>
        </div>

        <button className="btn-primary px-4 py-2" onClick={saveMoment} disabled={saving}>
          {saving ? "Saving..." : editingId ? "Save changes" : "Save entry"}
        </button>

        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>

      <div className="space-y-3">
        {moments.map((m) => {
          const urls = photoUrlsByMoment[m.id] ?? [];
          return (
            <div key={m.id} className="card p-4 space-y-2">
              <div className="flex items-baseline justify-between gap-4">
                <div className="font-semibold">{m.title ?? "Untitled"}</div>
                <div className="text-xs opacity-60">
                  {m.entry_date ? m.entry_date : new Date(m.created_at).toLocaleString()}
                </div>
              </div>

              {m.body && <div className="text-sm whitespace-pre-wrap opacity-90">{m.body}</div>}

              {urls.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {urls.map((u, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={idx} src={u} alt="Moment photo" className="h-28 rounded-md border border-[var(--border)]" />
                  ))}
                </div>
              )}

              <div className="pt-2 flex gap-4">
                <button className="btn-text text-sm" onClick={() => startEdit(m)} disabled={saving}>
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
          );
        })}

        {moments.length === 0 && <p className="opacity-70">No entries yet.</p>}
      </div>
    </main>
  );
}
