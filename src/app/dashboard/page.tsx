import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getSignedInUser } from "@/lib/auth";
import { mockDb, isSupabaseConfigured } from "@/lib/mock-db";
import { SignOutButton } from "@/components/sign-out-button";

type DashboardProject = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  reference_code: string;
};

export default async function Dashboard() {
  const user = await getSignedInUser();
  if (!user) redirect("/login");

  let projects: DashboardProject[] | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const res = await supabase
        .from("projects")
        .select("id,title,status,created_at,reference_code")
        .order("created_at", { ascending: false });
      projects = res.data;
    } catch {
      // Fall through to mockDb
    }
  }

  if (!projects || projects.length === 0) {
    projects = mockDb.getProjects().map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      created_at: p.created_at,
      reference_code: p.reference_code,
    }));
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-tl-blue">← Home</Link>
          <div className="flex items-center gap-3 mt-3">
            <h1 className="text-3xl font-bold">My projects</h1>
            <span className="rounded-full bg-sky-100 text-sky-800 text-xs px-2.5 py-0.5 font-semibold capitalize">
              {user.role || "student"}
            </span>
          </div>
          <p className="mt-1 text-slate-600">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {(user.role === "staff" || user.role === "admin") && (
            <Link href="/staff" className="rounded-lg bg-tl-navy px-4 py-2 text-white text-sm font-semibold hover:bg-slate-800 transition">
              Staff Portal
            </Link>
          )}
          <Link href="/register-project" className="rounded-lg bg-tl-blue px-4 py-2 text-white text-sm font-semibold hover:bg-sky-600 transition">
            Register project
          </Link>
          <SignOutButton />
        </div>
      </div>
      <div className="mt-7 overflow-hidden rounded-2xl border bg-white">
        {!projects?.length ? (
          <p className="p-6 text-slate-500">
            No projects are linked to this account yet. If you submitted as a guest, staff may need to associate the record with your account.
          </p>
        ) : (
          <div className="divide-y">
            {projects.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <h2 className="font-semibold">{p.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Ref {p.reference_code} · {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm capitalize">
                  {p.status.replaceAll("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
