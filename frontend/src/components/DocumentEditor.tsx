"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { api, ApiError } from "@/lib/api";
import type { DocumentSummary, Permission } from "@/lib/types";
import { EditorToolbar } from "./EditorToolbar";
import { SharePanel } from "./SharePanel";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type Props = {
  documentId: string;
};

function normalizeContent(content: unknown): JSONContent {
  if (
    content &&
    typeof content === "object" &&
    "type" in content &&
    (content as { type?: string }).type === "doc"
  ) {
    return content as JSONContent;
  }
  return {
    type: "doc",
    content: [{ type: "paragraph" }],
  };
}

export function DocumentEditor({ documentId }: Props) {
  const [document, setDocument] = useState<DocumentSummary | null>(null);
  const [title, setTitle] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const titleRef = useRef(title);
  const contentRef = useRef<unknown>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const permission: Permission = document?.permission ?? "VIEW";
  const canEdit = permission === "OWNER" || permission === "EDIT";
  const canManageShares = permission === "OWNER";

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
    ],
    [],
  );

  const persist = useCallback(
    async (nextTitle: string, nextContent: unknown) => {
      setSaveStatus("saving");
      setSaveError(null);
      try {
        const result = await api.updateDocument(documentId, {
          title: nextTitle.trim() || "Untitled",
          content: nextContent,
        });
        setDocument(result.document);
        setSaveStatus("saved");
      } catch (err) {
        setSaveStatus("error");
        setSaveError(err instanceof ApiError ? err.message : "Failed to save");
      }
    },
    [documentId],
  );

  const scheduleSave = useCallback(() => {
    if (!canEdit) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persist(titleRef.current, contentRef.current);
    }, 700);
  }, [canEdit, persist]);

  const editor = useEditor({
    extensions,
    content: normalizeContent({}),
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose mx-auto min-h-[60vh] max-w-[720px] px-6 py-10 focus:outline-none sm:px-12 sm:py-12",
      },
    },
    onUpdate: ({ editor: current }) => {
      contentRef.current = current.getJSON();
      scheduleSave();
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const result = await api.getDocument(documentId);
        if (cancelled) return;
        setDocument(result.document);
        setTitle(result.document.title);
        titleRef.current = result.document.title;
        const content = normalizeContent(result.document.content);
        contentRef.current = content;
        editor?.commands.setContent(content);
        const editable =
          result.document.permission === "OWNER" || result.document.permission === "EDIT";
        editor?.setEditable(editable);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : "Failed to load document");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (editor) {
      void load();
    }

    return () => {
      cancelled = true;
    };
  }, [documentId, editor]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function onTitleChange(value: string) {
    setTitle(value);
    titleRef.current = value;
    scheduleSave();
  }

  const statusLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
        ? "Saved"
        : saveStatus === "error"
          ? "Save failed"
          : canEdit
            ? "Ready"
            : "View only";

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
            <div className="skeleton h-8 w-20" />
            <div className="skeleton h-6 flex-1" />
            <div className="skeleton h-5 w-16" />
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-[760px] px-4">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="space-y-3 p-10 sm:p-12">
              <div className="skeleton h-8 w-2/3" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-11/12" />
              <div className="skeleton h-4 w-4/5" />
              <div className="skeleton mt-6 h-4 w-full" />
              <div className="skeleton h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !document) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-red-600">{loadError ?? "Document not found"}</p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/15"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-400" aria-hidden>
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="hidden sm:inline">Docs</span>
          </Link>

          <div className="min-w-0 flex-1">
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              disabled={!canEdit}
              className="w-full truncate bg-transparent text-base font-semibold tracking-tight text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-default disabled:text-gray-700"
              placeholder="Untitled"
              aria-label="Document title"
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!canEdit && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                View only
              </span>
            )}
            <span
              className={`hidden text-xs font-medium sm:inline ${
                saveStatus === "error"
                  ? "text-red-600"
                  : saveStatus === "saved"
                    ? "text-teal-700"
                    : saveStatus === "saving"
                      ? "text-gray-500"
                      : "text-gray-400"
              }`}
              title={saveError ?? undefined}
            >
              {statusLabel}
              {saveError ? ` · ${saveError}` : ""}
            </span>
            {canManageShares && (
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/25"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                  <path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L8.738 9.15a2.52 2.52 0 0 1 0 1.7l4.964 2.913A2.5 2.5 0 1 1 12.9 15.04l-4.964-2.913a2.5 2.5 0 1 1 0-4.254L12.9 4.96A2.49 2.49 0 0 1 13 4.5Z" />
                </svg>
                Share
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-3 py-5 sm:px-6 sm:py-8">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.04)]">
          {canEdit && <EditorToolbar editor={editor} />}
          {!canEdit && (
            <div className="border-b border-amber-100 bg-amber-50/80 px-4 py-2.5 text-center text-xs font-medium text-amber-800 sm:text-sm">
              You have view-only access to this document.
            </div>
          )}
          <EditorContent editor={editor} />
        </div>
      </div>

      <SharePanel
        documentId={documentId}
        canManage={canManageShares}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
