"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setBusy(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // If Supabase is unconfigured or failed, offer demo login fallback
        setMessage(`${error.message}. If testing in preview, you can use the Demo Sign-In options below.`);
        setBusy(false);
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setMessage("Could not connect to authentication service. Try demo preview mode below.");
      setBusy(false);
    }
  }

  async function demoSignIn(role: "staff" | "student") {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        window.location.href = role === "staff" ? "/staff" : "/dashboard";
      }
    } catch {
      setMessage("Failed to enter demo mode.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <Link href="/" className="text-sm text-tl-blue">← Home</Link>
      <h1 className="mt-5 text-3xl font-bold text-tl-navy">Sign in</h1>
      <p className="mt-2 text-slate-600">For registered students and authorized TL staff.</p>

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-sky-500 focus:outline-none"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-sky-500 focus:outline-none"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {message && <p role="alert" className="text-sm text-red-700 bg-red-50 p-2.5 rounded-lg">{message}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-tl-blue p-3 font-semibold text-white transition hover:bg-sky-600 disabled:opacity-50"
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Preview & Testing Modes</div>
        <p className="mt-1 text-xs text-slate-600">
          Explore portal workflows without live Supabase credentials:
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => demoSignIn("staff")}
            className="flex-1 rounded-lg bg-tl-navy px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Enter as Staff
          </button>
          <button
            type="button"
            onClick={() => demoSignIn("student")}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Enter as Student
          </button>
        </div>
      </div>
    </main>
  );
}
