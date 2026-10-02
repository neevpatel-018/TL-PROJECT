import { NextRequest, NextResponse } from "next/server";
import { mockDb, isSupabaseConfigured } from "@/lib/mock-db";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const projectApprovalSchema = z.object({
  type: z.literal("project"),
  reference_code: z.string().min(1),
  approval_status: z.enum(["PENDING", "YES", "NO"]),
  review_notes: z.string().optional().default(""),
  reviewer: z.string().optional().default("admin"),
});

const toolApprovalSchema = z.object({
  type: z.literal("tool_borrow"),
  borrow_id: z.string().min(1),
  approval_status: z.enum(["PENDING", "YES", "NO"]),
  return_status: z.enum([
    "RETURNED PROPERLY",
    "NOT RETURNED / IN USE",
    "OVERDUE / DAMAGED",
  ]),
  notes: z.string().optional().default(""),
});

const approvalSchema = z.discriminatedUnion("type", [
  projectApprovalSchema,
  toolApprovalSchema,
]);

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = approvalSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid approval payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;

    if (d.type === "project") {
      if (isSupabaseConfigured()) {
        try {
          const admin = createAdminClient();
          const dbStatus =
            d.approval_status === "YES"
              ? "approved"
              : d.approval_status === "NO"
              ? "rejected"
              : "pending";

          await admin
            .from("projects")
            .update({
              status: dbStatus,
              review_note: d.review_notes,
              reviewed_by: null,
              reviewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("reference_code", d.reference_code);
        } catch {
          // Fall through
        }
      }

      mockDb.updateProjectApproval(
        d.reference_code,
        d.approval_status,
        d.review_notes,
        d.reviewer
      );
      return NextResponse.json({ ok: true, reference_code: d.reference_code, approval_status: d.approval_status });
    } else {
      if (isSupabaseConfigured()) {
        try {
          const admin = createAdminClient();
          const dbStatus = d.return_status === "RETURNED PROPERLY" ? "returned" : "active";
          await admin
            .from("tool_borrows")
            .update({
              status: dbStatus,
              actual_return_date:
                d.return_status === "RETURNED PROPERLY"
                  ? new Date().toISOString().split("T")[0]
                  : null,
              notes: d.notes,
              updated_at: new Date().toISOString(),
            })
            .eq("id", d.borrow_id);
        } catch {
          // Fall through
        }
      }

      mockDb.updateToolBorrowStatus(
        d.borrow_id,
        d.approval_status,
        d.return_status,
        d.notes
      );
      return NextResponse.json({
        ok: true,
        borrow_id: d.borrow_id,
        approval_status: d.approval_status,
        return_status: d.return_status,
      });
    }
  } catch {
    return NextResponse.json({ error: "Failed to process approval update" }, { status: 500 });
  }
}
