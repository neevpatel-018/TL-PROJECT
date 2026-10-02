import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { mockDb, isSupabaseConfigured } from "@/lib/mock-db";
import { cookies } from "next/headers";

const schema = z.object({
  status: z.enum(["approved", "rejected", "needs_changes"]),
  review_note: z.string().max(5000).optional().default(""),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const demoRole = cookieStore.get("tl_demo_role")?.value;
  const isDemoStaff = demoRole === "staff" || demoRole === "admin";

  let user = null;
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {
      // Offline
    }
  }

  if (!user && !isDemoStaff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { id } = await params;

  if (isSupabaseConfigured() && user) {
    try {
      const admin = createAdminClient();
      const { data: profile } = await admin.from("profiles").select("role,is_active").eq("id", user.id).maybeSingle();
      if (!profile?.is_active || !["staff", "admin"].includes(profile.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { data: project, error } = await admin
        .from("projects")
        .update({
          status: body.data.status,
          review_note: body.data.review_note,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("status", "pending")
        .select("id,status")
        .maybeSingle();

      if (error) return NextResponse.json({ error: "Could not update project." }, { status: 500 });
      if (!project) return NextResponse.json({ error: "Project not found or no longer pending." }, { status: 409 });

      await admin.from("audit_events").insert({
        actor_id: user.id,
        entity_type: "project",
        entity_id: id,
        action: `project.${body.data.status}`,
        metadata: { review_note: body.data.review_note },
      });

      return NextResponse.json({ ok: true, project });
    } catch {
      // Fall through to mockDb
    }
  }

  // In-memory fallback
  const project = mockDb.updateProjectStatus(id, body.data.status, body.data.review_note, user?.id || "demo-staff-id");
  if (!project) {
    return NextResponse.json({ error: "Project not found or no longer pending." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, project });
}
