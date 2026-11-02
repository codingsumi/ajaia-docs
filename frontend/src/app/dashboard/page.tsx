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
      setImportError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Import failed",
      );
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
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm shadow-teal-600/20">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                <path
                  d="M7 4.75h7.5L18 8.25v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-13.5a1 1 0 0 1 1-1Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M14.5 4.75V8.25H18"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="truncate text-sm font-semibold tracking-tight text-gray-900">
              Collaborative Docs
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-800 ring-1 ring-teal-100"
              title={user.email}
              aria-hidden
            >
              {initials || "U"}
            </div>
            <button
              type="button"
              onClick={logout}
              disabled={busy}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/15 disabled:opacity-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Documents
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create, import, and manage your shared workspace.
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
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/15 disabled:opacity-50"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-400" aria-hidden>
                <path d="M9.25 13.25V4.56l-2.22 2.22a.75.75 0 1 1-1.06-1.06l3.5-3.5a.75.75 0 0 1 1.06 0l3.5 3.5a.75.75 0 0 1-1.06 1.06L10.75 4.56v8.69a.75.75 0 0 1-1.5 0Z" />
                <path d="M3.5 12.75a.75.75 0 0 1 .75.75v1.5c0 .69.56 1.25 1.25 1.25h9a1.25 1.25 0 0 0 1.25-1.25v-1.5a.75.75 0 0 1 1.5 0v1.5A2.75 2.75 0 0 1 14.5 17H5.5A2.75 2.75 0 0 1 2.75 14.25v-1.5a.75.75 0 0 1 .75-.75Z" />
              </svg>
              {importing ? "Importing…" : "Import File"}
            </button>
            <button
              type="button"
              onClick={() => void createDocument()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/25 disabled:opacity-50"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              {creating ? "Creating…" : "New Document"}
            </button>
          </div>
        </div>

        {importError && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {importError}
          </div>
        )}
        {importing && (
          <p className="mt-4 text-sm text-gray-500">
            Reading file and creating document…
          </p>
        )}

        <div className="mt-8 space-y-10">
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
    </div>
  );
}

export default function DashboardPage() {
  return <RequireAuth>{(user) => <DashboardContent user={user} />}</RequireAuth>;
}
