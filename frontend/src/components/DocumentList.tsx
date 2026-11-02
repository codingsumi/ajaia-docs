"use client";

import Link from "next/link";
import type { DocumentSummary } from "@/lib/types";

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

type Props = {
  title: string;
  emptyMessage: string;
  documents: DocumentSummary[];
  loading?: boolean;
  error?: string | null;
};

export function DocumentList({ title, emptyMessage, documents, loading, error }: Props) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold tracking-wide text-stone-500 uppercase">{title}</h2>

      {loading && <p className="mt-4 text-sm text-stone-500">Loading documents…</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && !error && documents.length === 0 && (
        <p className="mt-4 text-sm text-stone-500">{emptyMessage}</p>
      )}

      {!loading && !error && documents.length > 0 && (
        <ul className="mt-4 divide-y divide-stone-100">
          {documents.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/documents/${doc.id}`}
                className="flex items-start justify-between gap-4 py-3 transition hover:bg-stone-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-stone-900">{doc.title || "Untitled"}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    Updated {formatDate(doc.updatedAt)}
                    {doc.permission && doc.permission !== "OWNER" ? ` · ${doc.permission}` : ""}
                    {doc.owner ? ` · by ${doc.owner.name}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-teal-700">Open</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
