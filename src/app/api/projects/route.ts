import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { allowRequest } from "@/lib/rate-limit";
import { mockDb, isSupabaseConfigured } from "@/lib/mock-db";

const schema = z.object({
  title: z.string().trim().min(3).max(160),
  lead_name: z.string().trim().min(2).max(120),
  lead_email: z.string().trim().email().max(254),
  organization: z.string().trim().min(2).max(160),
  team_members: z.string().max(5000).optional().default(""),
  start_date: z.union([z.literal(""), z.string().date()]).optional().default(""),
  end_date: z.union([z.literal(""), z.string().date()]).optional().default(""),
  summary: z.string().trim().min(20).max(10000),
  resources: z.string().max(10000).optional().default(""),
  safety_notes: z.string().max(5000).optional().default(""),
  acknowledgement: z.literal("on"),
  user_type: z.enum(["student", "other"]).default("student"),
  enrollment_number: z.string().max(100).optional().default(""),
  course_code: z.string().max(50).optional().default(""),
  year_of_study: z.string().max(50).optional().default(""),
  faculty_name: z.string().max(120).optional().default(""),
  section_number: z.string().max(50).optional().default(""),
  au_id_verified: z.boolean().optional().default(false),
  other_role: z.string().max(100).optional().default(""),
  other_organization: z.string().max(160).optional().default(""),
  other_phone: z.string().max(50).optional().default(""),
  other_id_number: z.string().max(100).optional().default(""),
  other_purpose: z.string().max(1000).optional().default(""),
  borrowed_tools: z
    .array(
      z.object({
        item_id: z.string(),
        quantity: z.number().int().min(1),
        expected_return_date: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

export async function GET() {
  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        return NextResponse.json({ projects: data });
      }
    } catch {
      // Fall through to mock store
    }
  }
  return NextResponse.json({ projects: mockDb.getProjects() });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowRequest(`project:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  let parsed;
  try {
    parsed = schema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the required fields and try again.", details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  if (d.end_date && d.start_date && d.end_date < d.start_date) {
    return NextResponse.json({ error: "End date must be on or after start date." }, { status: 400 });
  }

  let user = null;
  try {
    const auth = await createClient();
    const { data: authData } = await auth.auth.getUser();
    user = authData?.user ?? null;
  } catch {
    // Proceed without authenticated user
  }

  const reference_code = `TL-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin.from("projects").insert({
        title: d.title,
        lead_name: d.lead_name,
        lead_email: d.lead_email.toLowerCase(),
        organization: d.organization,
        team_members: d.team_members,
        summary: d.summary,
        resources_description: d.resources,
        safety_notes: d.safety_notes,
        start_date: d.start_date || null,
        end_date: d.end_date || null,
        submitted_by: user?.id ?? null,
        status: "pending",
        reference_code,
        user_type: d.user_type,
        enrollment_number: d.enrollment_number,
        course_code: d.course_code,
        year_of_study: d.year_of_study,
        faculty_name: d.faculty_name,
        section_number: d.section_number,
        au_id_verified: d.au_id_verified,
        other_role: d.other_role,
        other_organization: d.other_organization,
        other_phone: d.other_phone,
        other_id_number: d.other_id_number,
        other_purpose: d.other_purpose,
      }).select("id,reference_code").single();

      if (!error && data) {
        if (d.borrowed_tools && d.borrowed_tools.length > 0) {
          for (const tool of d.borrowed_tools) {
            await admin.from("tool_borrows").insert({
              project_id: data.id,
              project_title: `${d.title} (${reference_code})`,
              item_id: tool.item_id,
              item_name: "Lab Tool / Equipment",
              borrower_name: d.lead_name,
              borrower_email: d.lead_email.toLowerCase(),
              user_type: d.user_type,
              enrollment_number: d.enrollment_number,
              course_code: d.course_code,
              year_of_study: d.year_of_study,
              faculty_name: d.faculty_name,
              section_number: d.section_number,
              other_role: d.other_role,
              other_phone: d.other_phone,
              quantity: tool.quantity,
              expected_return_date: tool.expected_return_date || d.end_date || null,
              status: "active",
            });
          }
        }
        await admin.from("audit_events").insert({
          actor_id: user?.id ?? null,
          entity_type: "project",
          entity_id: data.id,
          action: "project.submitted",
          metadata: { reference_code },
        });
        return NextResponse.json({ ok: true, reference: data.reference_code }, { status: 201 });
      }
    } catch {
      // Fall through to mock store
    }
  }

  // In-memory fallback
  const mockProject = mockDb.addProject({
    title: d.title,
    lead_name: d.lead_name,
    lead_email: d.lead_email.toLowerCase(),
    organization: d.organization,
    team_members: d.team_members,
    summary: d.summary,
    resources_description: d.resources,
    safety_notes: d.safety_notes,
    start_date: d.start_date || null,
    end_date: d.end_date || null,
    submitted_by: user?.id ?? null,
    status: "pending",
    review_note: "",
    reviewed_by: null,
    reviewed_at: null,
    reference_code,
    user_type: d.user_type,
    enrollment_number: d.enrollment_number,
    course_code: d.course_code,
    year_of_study: d.year_of_study,
    faculty_name: d.faculty_name,
    section_number: d.section_number,
    au_id_verified: d.au_id_verified,
    other_role: d.other_role,
    other_organization: d.other_organization,
    other_phone: d.other_phone,
    other_id_number: d.other_id_number,
    other_purpose: d.other_purpose,
  });

  // Automatically record any tools requested/borrowed during project registration
  if (d.borrowed_tools && d.borrowed_tools.length > 0) {
    for (const tool of d.borrowed_tools) {
      mockDb.borrowTool({
        borrower_name: d.lead_name,
        borrower_email: d.lead_email.toLowerCase(),
        project_title: `${d.title} (${reference_code})`,
        item_id: tool.item_id,
        quantity: tool.quantity,
        expected_return_date:
          tool.expected_return_date ||
          d.end_date ||
          new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        notes: `Borrowed during registration by ${d.user_type === "student" ? `Student ID: ${d.enrollment_number}, Course: ${d.course_code}` : `Other: ${d.other_role}`}`,
      });
    }
  }

  return NextResponse.json({ ok: true, reference: mockProject.reference_code }, { status: 201 });
}
