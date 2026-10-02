"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export function SignOutButton({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={busy}
      className={
        className ||
        "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
      }
    >
      <LogOut className="h-3.5 w-3.5" />
      <span>{busy ? "Signing out..." : "Sign out"}</span>
    </button>
  );
}
