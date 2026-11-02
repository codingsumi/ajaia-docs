"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, getToken } from "@/lib/auth";
import type { User } from "@/lib/types";

type Props = {
  children: (user: User) => React.ReactNode;
};

export function RequireAuth({ children }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser();
    if (!token || !stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);
    setReady(true);
  }, [router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--background)]">
        <div className="h-8 w-8 animate-pulse rounded-lg bg-teal-600/20" />
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  return <>{children(user)}</>;
}
