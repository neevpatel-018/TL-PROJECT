"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  ShieldCheck,
  UserPlus,
  LogIn,
  KeyRound,
  Mail,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight
} from "lucide-react";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"signin" | "register">("signin");
  const [role, setRole] = useState<"student" | "admin">("student");

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Register state
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regEnrollment, setRegEnrollment] = useState("");
  const [regDepartment, setRegDepartment] = useState("");

  // Feedback state
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Read URL query parameters if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab");
      const urlRole = params.get("role");

      if (urlTab === "register") setActiveTab("register");
      if (urlRole === "admin" || urlRole === "staff") setRole("admin");
      else if (urlRole === "student") setRole("student");
    }
  }, []);

  // Quick 1-click test sign-in
  async function handleQuickSignIn(targetRole: "student" | "admin") {
    setBusy(true);
    setMessage(null);
    try {
      const demoEmail = targetRole === "admin" ? "admin@ahduni.edu.in" : "student@ahduni.edu.in";
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: targetRole === "admin" ? "staff" : "student",
          email: demoEmail,
        }),
      });

      if (res.ok) {
        window.location.href = targetRole === "admin" ? "/staff" : "/dashboard";
      } else {
        setMessage({ type: "error", text: "Failed to initialize test session." });
        setBusy(false);
      }
    } catch {
      setMessage({ type: "error", text: "Network error during sign-in." });
      setBusy(false);
    }
  }

  // Handle standard Sign In
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setBusy(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signInEmail,
          password: signInPassword,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setMessage({
          type: "error",
          text: data.error || "Sign in failed. Check your email and password.",
        });
        setBusy(false);
        return;
      }

      setMessage({ type: "success", text: "Sign in successful! Redirecting..." });
      window.location.href = data.redirectTo || (role === "admin" ? "/staff" : "/dashboard");
    } catch {
      setMessage({
        type: "error",
        text: "Could not connect to authentication service. Please try again.",
      });
      setBusy(false);
    }
  }

  // Handle Account Registration
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setBusy(true);

    if (regPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          fullName: regFullName,
          role,
          enrollmentNumber: regEnrollment,
          department: regDepartment,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setMessage({
          type: "error",
          text: data.error || "Registration failed. Please check your information.",
        });
        setBusy(false);
        return;
      }

      setMessage({
        type: "success",
        text: `Account created successfully as ${role === "admin" ? "Admin" : "Student"}! Redirecting...`,
      });

      setTimeout(() => {
        window.location.href = data.redirectTo || (role === "admin" ? "/staff" : "/dashboard");
      }, 1000);
    } catch {
      setMessage({
        type: "error",
        text: "Could not complete registration. Please try again.",
      });
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/60 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        {/* Navigation & Brand Header */}
        <div className="flex items-center justify-between pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-tl-navy transition"
          >
            ← Back to Portal Home
          </Link>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Supabase Connected
            </span>
          </div>
        </div>

        {/* Card Container */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          {/* Card Top Title Banner */}
          <div className="border-b border-slate-100 bg-slate-50/70 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-tl-navy text-white shadow-md shadow-tl-navy/20">
              {role === "admin" ? (
                <ShieldCheck className="h-6 w-6 text-amber-300" />
              ) : (
                <GraduationCap className="h-6 w-6 text-sky-300" />
              )}
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              {activeTab === "signin" ? (
                role === "admin" ? "Admin & Staff Sign In" : "Student Sign In"
              ) : (
                role === "admin" ? "Create Admin Account" : "Register Student Account"
              )}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Tinkerers&apos; Lab · Ahmedabad University Resource Management
            </p>
          </div>

          {/* Main Action Tabs (Sign In vs Register) */}
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-100/50 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("signin");
                setMessage(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition ${
                activeTab === "signin"
                  ? "bg-white text-tl-navy shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setMessage(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition ${
                activeTab === "register"
                  ? "bg-white text-tl-blue shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Create Account
            </button>
          </div>

          <div className="p-6">
            {/* Role Switcher Pill */}
            <div className="mb-6">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
                    role === "student"
                      ? "bg-white text-tl-navy shadow-sm border border-slate-200/80"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <GraduationCap className="h-4 w-4 text-sky-600" />
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
                    role === "admin"
                      ? "bg-white text-amber-900 shadow-sm border border-slate-200/80"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  Admin / Staff
                </button>
              </div>
            </div>

            {/* Status Alert Banner */}
            {message && (
              <div
                className={`mb-5 flex items-start gap-2.5 rounded-xl p-3.5 text-xs leading-relaxed ${
                  message.type === "error"
                    ? "bg-rose-50 text-rose-800 border border-rose-200"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                }`}
              >
                {message.type === "error" ? (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {/* TAB 1: SIGN IN FORM */}
            {activeTab === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {role === "admin" ? "Staff / Admin Email" : "Student Email"}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder={role === "admin" ? "admin@ahduni.edu.in" : "student@ahduni.edu.in"}
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                      {showSignInPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {showSignInPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showSignInPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-md transition disabled:opacity-50 ${
                    role === "admin"
                      ? "bg-slate-900 hover:bg-slate-800 shadow-slate-900/20"
                      : "bg-tl-blue hover:bg-sky-600 shadow-sky-500/25"
                  }`}
                >
                  <LogIn className="h-4 w-4" />
                  {busy ? "Signing in..." : role === "admin" ? "Sign In as Admin" : "Sign In as Student"}
                </button>
              </form>
            )}

            {/* TAB 2: REGISTER FORM */}
            {activeTab === "register" && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Patel"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder={role === "admin" ? "admin@ahduni.edu.in" : "student@ahduni.edu.in"}
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Create Password (min. 6 characters)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                      {showRegPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {showRegPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>

                {role === "student" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Enrollment No.
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 23110045"
                        value={regEnrollment}
                        onChange={(e) => setRegEnrollment(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SEAS - CSE"
                        value={regDepartment}
                        onChange={(e) => setRegDepartment(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {role === "admin" && (
                  <div className="rounded-xl bg-amber-50 p-3 border border-amber-200/80 text-[11px] text-amber-800">
                    <span className="font-semibold">Staff & Admin Access:</span> Registering as Admin grants privileges to review project submissions, manage physical tool stock, and update approvals.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-md transition disabled:opacity-50 ${
                    role === "admin"
                      ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/25"
                      : "bg-tl-blue hover:bg-sky-600 shadow-sky-500/25"
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  {busy ? "Registering account..." : role === "admin" ? "Create Admin Account" : "Register Student Account"}
                </button>
              </form>
            )}

            {/* Quick Testing & Instant Access Box */}
            <div className="mt-8 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Instant 1-Click Access
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Need to quickly review or test features? Click either role below to enter instantly:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickSignIn("student")}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-xs font-semibold text-slate-700 shadow-sm hover:border-sky-300 hover:bg-sky-50/40 transition"
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-sky-600" />
                    <span>Enter as Student</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSignIn("admin")}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-left text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-400" />
                    <span>Enter as Admin</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Ahmedabad University Tinkerers&apos; Lab Portal · Protected by Supabase Row-Level Security
        </p>
      </div>
    </main>
  );
}
