"use client";

import Link from "next/link";
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
  track_id: number | null;
  race_id: number | null;
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
  const [trackInfo, setTrackInfo] = useState<Record<number, { name: string; slug: string }>>({});
  const [raceInfo, setRaceInfo] = useState<Record<number, { name: string; slug: string }>>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // edit state
  const [editingId, setEditingId] = useState<number | null>(null);

  // folder creation state
  const [showNewFolderForm, setShowNewFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  // track and race selection state
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [tracks, setTracks] = useState<Array<{ id: number; name: string; country: string | null }>>([]);
  const [races, setRaces] = useState<Array<{ id: number; name: string; country: string | null }>>([]);
  const [trackSearchQuery, setTrackSearchQuery] = useState("");
  const [raceSearchQuery, setRaceSearchQuery] = useState("");
  const [showTrackDropdown, setShowTrackDropdown] = useState(false);
  const [showRaceDropdown, setShowRaceDropdown] = useState(false);

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
    setSelectedTrackId(null);
    setSelectedRaceId(null);
    setTrackSearchQuery("");
    setRaceSearchQuery("");
    setFiles([]);
    setShowForm(false);
  }

  function startEdit(m: MomentRow) {
    setError("");
    setEditingId(m.id);
    setTitle(m.title ?? "");
    setBody(m.body ?? "");
    setSelectedFolderId(m.folder_id ?? "none");
    setSelectedTrackId(m.track_id ?? null);
    setSelectedRaceId(m.race_id ?? null);
    setTrackSearchQuery("");
    setRaceSearchQuery("");
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

  async function createFolder() {
    if (creatingFolder || !newFolderName.trim()) return;
    setError("");
    setCreatingFolder(true);

    try {
      const user = await requireUser();
      const { data, error: insertError } = await supabase
        .from("folders")
        .insert({
          user_id: user.id,
          name: newFolderName.trim(),
        })
        .select("id,name")
        .single();

      if (insertError) throw new Error(insertError.message);

      // Add the new folder to the list and select it
      setFolders((prev) => [data as FolderRow, ...prev]);
      setSelectedFolderId((data as FolderRow).id);
      setNewFolderName("");
      setShowNewFolderForm(false);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create folder");
    } finally {
      setCreatingFolder(false);
    }
  }

  async function loadMoments() {
    setError("");
    try {
      await requireUser();

      // Try to select with track_id and race_id, fallback if columns don't exist
      let data, error;
      const result = await supabase
        .from("moments")
        .select("id,title,body,folder_id,entry_date,created_at,track_id,race_id")
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false });
      
      data = result.data;
      error = result.error;

      // If columns don't exist, try without them
      if (error && error.message.includes("column") && error.message.includes("does not exist")) {
        const fallbackResult = await supabase
          .from("moments")
          .select("id,title,body,folder_id,entry_date,created_at")
          .order("entry_date", { ascending: false })
          .order("created_at", { ascending: false });
        
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) {
        setError(error.message);
        return;
      }

      const rows = (data as MomentRow[]) ?? [];
      setMoments(rows);
      await loadPhotosForMoments(rows.map((m) => m.id));
      
      // Load track and race names for linked moments
      const trackIds = rows.filter((m) => m.track_id).map((m) => m.track_id!);
      const raceIds = rows.filter((m) => m.race_id).map((m) => m.race_id!);
      
      if (trackIds.length > 0) {
        await loadTrackNames(trackIds);
      }
      if (raceIds.length > 0) {
        await loadRaceNames(raceIds);
      }
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

  async function loadTrackNames(trackIds: number[]) {
    try {
      const { data, error } = await supabase
        .from("tracks_catalog")
        .select("id,name,slug")
        .in("id", trackIds);

      if (error) return;

      const map: Record<number, { name: string; slug: string }> = {};
      (data ?? []).forEach((t: any) => {
        map[t.id] = { name: t.name, slug: t.slug };
      });
      setTrackInfo(map);
    } catch {}
  }

  async function loadRaceNames(raceIds: number[]) {
    try {
      const { data, error } = await supabase
        .from("races_catalog")
        .select("id,name,slug")
        .in("id", raceIds);

      if (error) return;

      const map: Record<number, { name: string; slug: string }> = {};
      (data ?? []).forEach((r: any) => {
        map[r.id] = { name: r.name, slug: r.slug };
      });
      setRaceInfo(map);
    } catch {}
  }

  async function loadTracks() {
    try {
      const { data, error } = await supabase
        .from("tracks_catalog")
        .select("id,name,country")
        .order("name");

      if (error) {
        setError(error.message);
        return;
      }
      setTracks((data ?? []) as Array<{ id: number; name: string; country: string | null }>);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load tracks");
    }
  }

  async function loadRaces() {
    try {
      const { data, error } = await supabase
        .from("races_catalog")
        .select("id,name,country")
        .order("name");

      if (error) {
        setError(error.message);
        return;
      }
      setRaces((data ?? []) as Array<{ id: number; name: string; country: string | null }>);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load races");
    }
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
        const updateData: any = {
          folder_id: selectedFolderId === "none" ? null : selectedFolderId,
          title: title || null,
          body: body || null,
          entry_date: entryDate || null,
        };
        
        // Add track_id and race_id if columns exist
        if (selectedTrackId !== null) {
          updateData.track_id = selectedTrackId;
        } else {
          updateData.track_id = null;
        }
        if (selectedRaceId !== null) {
          updateData.race_id = selectedRaceId;
        } else {
          updateData.race_id = null;
        }

        const { error: updateErr } = await supabase
          .from("moments")
          .update(updateData)
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (updateErr) {
          // If columns don't exist, try without them
          if (updateErr.message.includes("column") && updateErr.message.includes("does not exist")) {
            const { error: updateErr2 } = await supabase
          .from("moments")
          .update({
            folder_id: selectedFolderId === "none" ? null : selectedFolderId,
            title: title || null,
            body: body || null,
            entry_date: entryDate || null,
          })
          .eq("id", editingId)
          .eq("user_id", user.id);
            if (updateErr2) throw new Error(updateErr2.message);
          } else {
            throw new Error(updateErr.message);
          }
        }

        // Optional: append new photos while editing
        await uploadPhotos(user.id, editingId, files);

        resetFormToCreate();
        await loadMoments();
        return;
      }

      // CREATE
      const insertData: any = {
        user_id: user.id,
        folder_id: selectedFolderId === "none" ? null : selectedFolderId,
        title: title || null,
        body: body || null,
        entry_date: entryDate || null,
      };
      
      // Add track_id and race_id if selected
      if (selectedTrackId !== null) {
        insertData.track_id = selectedTrackId;
      }
      if (selectedRaceId !== null) {
        insertData.race_id = selectedRaceId;
      }

      const { data: created, error: insertErr } = await supabase
        .from("moments")
        .insert(insertData)
        .select("id")
        .single();

      if (insertErr) {
        // If columns don't exist, try without them
        if (insertErr.message.includes("column") && insertErr.message.includes("does not exist")) {
          const { data: created2, error: insertErr2 } = await supabase
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
          if (insertErr2) throw new Error(insertErr2.message);
          const momentId = created2?.id as number;
          await uploadPhotos(user.id, momentId, files);
          resetFormToCreate();
          await loadMoments();
          return;
        }
        throw new Error(insertErr.message);
      }
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

  // Filter tracks and races based on search queries
  const filteredTracks = useMemo(() => {
    if (!trackSearchQuery.trim()) return tracks;
    const query = trackSearchQuery.toLowerCase();
    return tracks.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        (t.country && t.country.toLowerCase().includes(query))
    );
  }, [tracks, trackSearchQuery]);

  const filteredRaces = useMemo(() => {
    if (!raceSearchQuery.trim()) return races;
    const query = raceSearchQuery.toLowerCase();
    return races.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        (r.country && r.country.toLowerCase().includes(query))
    );
  }, [races, raceSearchQuery]);

  // Get selected track/race names for display
  const selectedTrackName = selectedTrackId
    ? tracks.find((t) => t.id === selectedTrackId)?.name
    : null;
  const selectedRaceName = selectedRaceId
    ? races.find((r) => r.id === selectedRaceId)?.name
    : null;

  useEffect(() => {
    loadFolders();
    loadMoments();
    loadTracks();
    loadRaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="space-y-6 sm:space-y-8">
      <BackHome />

      {/* Page Title */}
      <div className="space-y-2">
        <h1
          className="text-2xl sm:text-3xl font-bold text-[var(--secondary)]"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          My Diary
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
        <div className="card p-4 sm:p-6 space-y-4">
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

          {/* Track and Race Selection */}
          <div className="space-y-4">
            {/* Select Track Dropdown */}
            <div className="relative track-dropdown-container">
              <label className="text-sm opacity-80 block mb-2">Select track (optional)</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowTrackDropdown(!showTrackDropdown);
                    setShowRaceDropdown(false);
                  }}
                  className="w-full border border-[var(--border)] p-2 rounded-lg text-left flex items-center justify-between bg-white hover:border-[var(--primary)]/30 transition-colors"
                >
                  <span className={selectedTrackName ? "text-[var(--secondary)]" : "text-[var(--secondary)]/50"}>
                    {selectedTrackName || "Select track..."}
                  </span>
                  <svg
                    className={`w-4 h-4 text-[var(--secondary)]/50 transition-transform ${showTrackDropdown ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showTrackDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b border-[var(--border)]">
                      <input
                        type="text"
                        placeholder="Search tracks..."
                        value={trackSearchQuery}
                        onChange={(e) => setTrackSearchQuery(e.target.value)}
                        className="w-full border border-[var(--border)] p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTrackId(null);
                          setShowTrackDropdown(false);
                          setTrackSearchQuery("");
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[var(--border-hover)] transition-colors text-sm"
                      >
                        None
                      </button>
                      {filteredTracks.length > 0 ? (
                        filteredTracks.map((track) => (
                          <button
                            key={track.id}
                            type="button"
                            onClick={() => {
                              setSelectedTrackId(track.id);
                              setShowTrackDropdown(false);
                              setTrackSearchQuery("");
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-[var(--border-hover)] transition-colors text-sm ${
                              selectedTrackId === track.id ? "bg-[var(--primary)]/10 font-medium" : ""
                            }`}
                          >
                            {track.name}
                            {track.country && <span className="text-[var(--secondary)]/60 ml-2">— {track.country}</span>}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-[var(--secondary)]/60">No tracks found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Select Race Dropdown */}
            <div className="relative race-dropdown-container">
              <label className="text-sm opacity-80 block mb-2">Select race (optional)</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowRaceDropdown(!showRaceDropdown);
                    setShowTrackDropdown(false);
                  }}
                  className="w-full border border-[var(--border)] p-2 rounded-lg text-left flex items-center justify-between bg-white hover:border-[var(--primary)]/30 transition-colors"
                >
                  <span className={selectedRaceName ? "text-[var(--secondary)]" : "text-[var(--secondary)]/50"}>
                    {selectedRaceName || "Select race..."}
                  </span>
                  <svg
                    className={`w-4 h-4 text-[var(--secondary)]/50 transition-transform ${showRaceDropdown ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showRaceDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b border-[var(--border)]">
                      <input
                        type="text"
                        placeholder="Search races..."
                        value={raceSearchQuery}
                        onChange={(e) => setRaceSearchQuery(e.target.value)}
                        className="w-full border border-[var(--border)] p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRaceId(null);
                          setShowRaceDropdown(false);
                          setRaceSearchQuery("");
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[var(--border-hover)] transition-colors text-sm"
                      >
                        None
                      </button>
                      {filteredRaces.length > 0 ? (
                        filteredRaces.map((race) => (
                          <button
                            key={race.id}
                            type="button"
                            onClick={() => {
                              setSelectedRaceId(race.id);
                              setShowRaceDropdown(false);
                              setRaceSearchQuery("");
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-[var(--border-hover)] transition-colors text-sm ${
                              selectedRaceId === race.id ? "bg-[var(--primary)]/10 font-medium" : ""
                            }`}
                          >
                            {race.name}
                            {race.country && <span className="text-[var(--secondary)]/60 ml-2">— {race.country}</span>}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-[var(--secondary)]/60">No races found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm opacity-80">Folder</label>
              {!showNewFolderForm && (
                <button
                  type="button"
                  className="btn-secondary px-3 py-1.5 text-sm font-medium"
                  onClick={() => setShowNewFolderForm(true)}
                  disabled={creatingFolder}
                >
                  + Add new folder
                </button>
              )}
            </div>

            {showNewFolderForm && (
              <div className="flex gap-2 items-center">
                <input
                  className="border border-[var(--border)] p-2 flex-1 rounded-lg text-sm"
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      createFolder();
                    }
                    if (e.key === "Escape") {
                      setShowNewFolderForm(false);
                      setNewFolderName("");
                    }
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn-primary px-3 py-2 text-sm whitespace-nowrap"
                  onClick={createFolder}
                  disabled={creatingFolder || !newFolderName.trim()}
                >
                  {creatingFolder ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  className="btn-text text-sm px-2"
                  onClick={() => {
                    setShowNewFolderForm(false);
                    setNewFolderName("");
                  }}
                  disabled={creatingFolder}
                >
                  Cancel
                </button>
              </div>
            )}

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
          </div>

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
      <div className="space-y-4 sm:space-y-6">
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
              <div className="flex flex-col sm:flex-row gap-0">
                {/* Photo Section (Left) */}
                <div className="sm:w-48 w-full h-48 sm:h-auto bg-[var(--secondary)]/5 flex items-center justify-center shrink-0">
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
                <div className="flex-1 p-4 sm:p-6 space-y-3">
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

                  {/* Linked Track or Race */}
                  {(m.track_id || m.race_id) && (
                    <div className="text-sm flex flex-col gap-1">
                      {m.track_id && trackInfo[m.track_id] && (
                        <Link
                          href={`/tracks/${trackInfo[m.track_id].slug}`}
                          className="flex items-center gap-1 text-[var(--primary)] hover:underline"
                        >
                          <span>📍 Track:</span>
                          <span className="font-medium">{trackInfo[m.track_id].name}</span>
                        </Link>
                      )}
                      {m.race_id && raceInfo[m.race_id] && (
                        <Link
                          href={`/races/${raceInfo[m.race_id].slug}`}
                          className="flex items-center gap-1 text-[var(--primary)] hover:underline"
                        >
                          <span>🏁 Race:</span>
                          <span className="font-medium">{raceInfo[m.race_id].name}</span>
                        </Link>
                      )}
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
