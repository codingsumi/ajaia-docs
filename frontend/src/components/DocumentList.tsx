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

function DocumentIcon() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-teal-700">
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path
          d="M7 4.75h7.5L18 8.25v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-13.5a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M14.5 4.75V8.25H18"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M9 12h6M9 15.5h4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function SkeletonCards() {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4"
        >
          <div className="skeleton h-10 w-10 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton h-4 w-3/4 max-w-[180px]" />
            <div className="skeleton h-3 w-1/2 max-w-[120px]" />
          </div>
        </div>
      ))}
    </div>
  );
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
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
          {title}
        </h2>
        {!loading && !error && documents.length > 0 && (
          <span className="text-xs text-gray-400">
            {documents.length} {documents.length === 1 ? "document" : "documents"}
          </span>
        )}
      </div>

      {loading && <SkeletonCards />}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {!loading && !error && documents.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 px-6 py-10 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
              <path
                d="M7 4.75h7.5L18 8.25v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-13.5a1 1 0 0 1 1-1Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      )}

      {!loading && !error && documents.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {documents.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/documents/${doc.id}`}
                className="group flex h-full gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:border-teal-200 hover:shadow-[0_4px_16px_rgba(16,24,40,0.06)] focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/15"
              >
                <DocumentIcon />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900 group-hover:text-teal-800">
                    {doc.title || "Untitled"}
                  </p>
                  <p className="mt-1 truncate text-xs text-gray-500">
                    Updated {formatDate(doc.updatedAt)}
                    {doc.permission && doc.permission !== "OWNER"
                      ? ` · ${doc.permission}`
                      : ""}
                    {doc.owner ? ` · ${doc.owner.name}` : ""}
                  </p>
                </div>
                <span className="self-center text-gray-300 transition group-hover:text-teal-600">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
