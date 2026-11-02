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
          "prose prose-stone max-w-none min-h-[50vh] px-6 py-5 focus:outline-none",
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
          ? "Error"
          : canEdit
            ? "Ready"
            : "View only";

  if (loading) {
    return <div className="p-8 text-sm text-stone-500">Loading document…</div>;
  }

  if (loadError || !document) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <p className="text-sm text-red-600">{loadError ?? "Document not found"}</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium text-teal-700">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f1ec]">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link
            href="/dashboard"
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
          >
            ← Dashboard
          </Link>
          <div className="min-w-0 flex-1">
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              disabled={!canEdit}
              className="w-full bg-transparent text-lg font-semibold text-stone-900 outline-none disabled:cursor-default disabled:text-stone-700"
              placeholder="Untitled"
            />
          </div>
          <div className="text-xs font-medium text-stone-500">
            <span
              className={
                saveStatus === "error"
                  ? "text-red-600"
                  : saveStatus === "saved"
                    ? "text-teal-700"
                    : ""
              }
            >
              {statusLabel}
            </span>
            {saveError ? ` · ${saveError}` : ""}
            {permission !== "OWNER" ? ` · ${permission}` : ""}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          {canEdit && <EditorToolbar editor={editor} />}
          {!canEdit && (
            <div className="border-b border-stone-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
              You have view-only access to this document.
            </div>
          )}
          <EditorContent editor={editor} />
        </div>

        {canManageShares && <SharePanel documentId={documentId} canManage />}
      </div>
    </div>
  );
}
