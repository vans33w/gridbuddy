"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/browser";

type FolderRow = { id: number; name: string; created_at: string };

export default function FoldersPage() {
  const supabase = supabaseBrowser();
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setError("");

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("folders")
      .select("id,name,created_at")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    setFolders((data as FolderRow[]) ?? []);
  }

  async function addFolder() {
    setError("");
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    const { error } = await supabase.from("folders").insert({
      user_id: user.id,
      name,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setName("");
    load();
  }

  async function deleteFolder(id: number) {
    setError("");
    const { error } = await supabase.from("folders").delete().eq("id", id);
    if (error) setError(error.message);
    load();
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="p-6 space-y-4 max-w-xl">
      <h1 className="text-2xl font-bold">Folders</h1>

      <div className="space-y-2 border p-4">
        <input
          className="border p-2 w-full"
          placeholder="Folder name (e.g., 'Monaco 2024')"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="border px-4 py-2" onClick={addFolder}>
          Create folder
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>

      <div className="space-y-2">
        {folders.map((f) => (
          <div key={f.id} className="border p-3 flex justify-between">
            <div>{f.name}</div>
            <button className="underline" onClick={() => deleteFolder(f.id)}>
              Delete
            </button>
          </div>
        ))}
        {folders.length === 0 && <p className="opacity-70">No folders yet.</p>}
      </div>
    </main>
  );
}
