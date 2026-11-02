"use client";

import { use } from "react";
import { DocumentEditor } from "@/components/DocumentEditor";
import { RequireAuth } from "@/components/RequireAuth";

type Props = {
  params: Promise<{ id: string }>;
};

export default function DocumentPage({ params }: Props) {
  const { id } = use(params);

  return (
    <RequireAuth>
      {() => <DocumentEditor documentId={id} />}
    </RequireAuth>
  );
}
