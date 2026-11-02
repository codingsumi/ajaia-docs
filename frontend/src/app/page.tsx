"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isAuthenticated() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--background)]">
      <div className="h-8 w-8 animate-pulse rounded-lg bg-teal-600/20" />
      <p className="text-sm text-gray-500">Loading…</p>
    </div>
  );
}
