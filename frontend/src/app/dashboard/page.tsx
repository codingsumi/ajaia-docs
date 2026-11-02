"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentList } from "@/components/DocumentList";
import { RequireAuth } from "@/components/RequireAuth";
import { api, ApiError } from "@/lib/api";
import { clearSession } from "@/lib/auth";
import { readImportFile } from "@/lib/importFile";
import type { DocumentSummary, User } from "@/lib/types";

function DashboardContent({ user }: { user: User }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [owned, setOwned] = useState<DocumentSummary[]>([]);
  const [shared, setShared] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [ownedError, setOwnedError] = useState<string | null>(null);
  const [sharedError, setSharedError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setOwnedError(null);
    setSharedError(null);
    const [ownedResult, sharedResult] = await Promise.allSettled([
      api.listOwnedDocuments(),
      api.listSharedDocuments(),
    ]);

    if (ownedResult.status === "fulfilled") {
      setOwned(ownedResult.value.documents);
    } else {
      setOwnedError(
        ownedResult.reason instanceof ApiError
          ? ownedResult.reason.message
          : "Failed to load documents",
      );
    }

    if (sharedResult.status === "fulfilled") {
      setShared(sharedResult.value.documents);
    } else {
      setSharedError(
        sharedResult.reason instanceof ApiError
          ? sharedResult.reason.message
          : "Failed to load shared documents",
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createDocument() {
    setCreating(true);
    setImportError(null);
    try {
      const result = await api.createDocument({
        title: "Untitled",
        content: { type: "doc", content: [{ type: "paragraph" }] },
      });
      router.push(`/documents/${result.document.id}`);
    } catch (err) {
      setOwnedError(err instanceof ApiError ? err.message : "Failed to create document");
      setCreating(false);
    }
  }

  async function onImportFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    setImporting(true);
    setImportError(null);

    try {
      const imported = await readImportFile(file);
      const created = await api.createDocument({
        title: imported.title,
        content: { type: "doc", content: [{ type: "paragraph" }] },
      });
      await api.updateDocument(created.document.id, {
        title: imported.title,
        content: imported.content,
      });
      router.push(`/documents/${created.document.id}`);
    } catch (err) {
      setImportError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Import failed");
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function logout() {
    clearSession();
    router.replace("/login");
  }

  const busy = creating || importing;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-teal-700 uppercase">
            Collaborative Docs
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-stone-900">Dashboard</h1>
          <p className="mt-1 text-sm text-stone-500">
            Signed in as {user.name} ({user.email})
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            className="hidden"
            onChange={(event) => void onImportFile(event.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            {importing ? "Importing…" : "Import File"}
          </button>
          <button
            type="button"
            onClick={() => void createDocument()}
            disabled={busy}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {creating ? "Creating…" : "New Document"}
          </button>
          <button
            type="button"
            onClick={logout}
            disabled={busy}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-white disabled:opacity-50"
          >
            Log out
          </button>
        </div>
      </header>

      {importError && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {importError}
        </p>
      )}
      {importing && (
        <p className="mt-4 text-sm text-stone-500">Reading file and creating document…</p>
      )}

      <div className="mt-8 grid gap-5">
        <DocumentList
          title="My Documents"
          emptyMessage="No documents yet. Create one to get started."
          documents={owned}
          loading={loading}
          error={ownedError}
        />
        <DocumentList
          title="Shared With Me"
          emptyMessage="Nothing has been shared with you yet."
          documents={shared}
          loading={loading}
          error={sharedError}
        />
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return <RequireAuth>{(user) => <DashboardContent user={user} />}</RequireAuth>;
}
