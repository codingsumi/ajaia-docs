"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import type { DocumentShare } from "@/lib/types";

type Props = {
  documentId: string;
  canManage: boolean;
  open: boolean;
  onClose: () => void;
};

export function SharePanel({ documentId, canManage, open, onClose }: Props) {
  const [shares, setShares] = useState<DocumentShare[]>([]);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"VIEW" | "EDIT">("VIEW");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadShares = useCallback(async () => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.listShares(documentId);
      setShares(result.shares);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load shares");
    } finally {
      setLoading(false);
    }
  }, [canManage, documentId]);

  useEffect(() => {
    if (open && canManage) {
      void loadShares();
    }
  }, [open, canManage, loadShares]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function onShare(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.shareDocument(documentId, email.trim(), permission);
      setEmail("");
      setMessage("Access updated");
      await loadShares();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to share document");
    } finally {
      setSaving(false);
    }
  }

  async function onRemove(shareId: string) {
    setError(null);
    setMessage(null);
    try {
      await api.removeShare(documentId, shareId);
      setShares((prev) => prev.filter((share) => share.id !== shareId));
      setMessage("Access removed");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove access");
    }
  }

  if (!canManage || !open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 sm:pt-24">
      <button
        type="button"
        aria-label="Close sharing dialog"
        className="absolute inset-0 bg-gray-900/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_16px_48px_rgba(16,24,40,0.18)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 id="share-dialog-title" className="text-base font-semibold text-gray-900">
              Share document
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Invite people by email with VIEW or EDIT access.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/30"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4">
          <form onSubmit={onShare} className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 hover:border-gray-400 focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/15"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Permission</span>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as "VIEW" | "EDIT")}
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition hover:border-gray-400 focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/15"
              >
                <option value="VIEW">VIEW — can read only</option>
                <option value="EDIT">EDIT — can edit</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-teal-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/25 disabled:opacity-50"
            >
              {saving ? "Sharing…" : "Share"}
            </button>
          </form>

          {error && (
            <div
              role="alert"
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}
          {message && (
            <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
              {message}
            </div>
          )}

          <div className="mt-5">
            <h3 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              People with access
            </h3>
            {loading && (
              <div className="mt-3 space-y-2">
                <div className="skeleton h-12 w-full" />
                <div className="skeleton h-12 w-full" />
              </div>
            )}
            {!loading && shares.length === 0 && (
              <p className="mt-3 text-sm text-gray-500">Not shared with anyone yet.</p>
            )}
            <ul className="mt-3 space-y-2">
              {shares.map((share) => (
                <li
                  key={share.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {share.user?.name ?? share.userId}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {share.user?.email} · {share.permission}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onRemove(share.id)}
                    className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
