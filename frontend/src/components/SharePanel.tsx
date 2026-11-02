"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import type { DocumentShare } from "@/lib/types";

type Props = {
  documentId: string;
  canManage: boolean;
};

export function SharePanel({ documentId, canManage }: Props) {
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
    void loadShares();
  }, [loadShares]);

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

  if (!canManage) {
    return null;
  }

  return (
    <aside className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-stone-800">Sharing</h2>
      <p className="mt-1 text-xs text-stone-500">Invite people by email with VIEW or EDIT access.</p>

      <form onSubmit={onShare} className="mt-4 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
        />
        <select
          value={permission}
          onChange={(e) => setPermission(e.target.value as "VIEW" | "EDIT")}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
        >
          <option value="VIEW">VIEW</option>
          <option value="EDIT">EDIT</option>
        </select>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
        >
          {saving ? "Sharing…" : "Share"}
        </button>
      </form>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      {message && <p className="mt-3 text-xs text-teal-700">{message}</p>}

      <div className="mt-5">
        <h3 className="text-xs font-semibold tracking-wide text-stone-500 uppercase">People with access</h3>
        {loading && <p className="mt-2 text-xs text-stone-500">Loading…</p>}
        {!loading && shares.length === 0 && (
          <p className="mt-2 text-xs text-stone-500">Not shared with anyone yet.</p>
        )}
        <ul className="mt-2 space-y-2">
          {shares.map((share) => (
            <li
              key={share.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-stone-800">{share.user?.name ?? share.userId}</p>
                <p className="truncate text-xs text-stone-500">
                  {share.user?.email} · {share.permission}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void onRemove(share.id)}
                className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
