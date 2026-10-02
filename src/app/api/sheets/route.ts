import { NextRequest, NextResponse } from "next/server";
import {
  createOrGetLabSpreadsheet,
  syncAllToGoogleSheet,
  updateProjectApprovalInSheet,
  updateToolBorrowStatusInSheet,
  fetchSheetUpdates,
  appendProjectToSheet,
  appendToolBorrowToSheet,
} from "@/lib/google-sheets";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Missing Google authorization token." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, spreadsheetId } = body;

    if (action === "init") {
      const result = await createOrGetLabSpreadsheet(token, spreadsheetId);
      return NextResponse.json({ ok: true, ...result });
    }

    if (!spreadsheetId) {
      return NextResponse.json({ error: "Missing spreadsheetId" }, { status: 400 });
    }

    if (action === "sync_all") {
      const { projects, borrows } = body;
      await syncAllToGoogleSheet(token, spreadsheetId, projects || [], borrows || []);
      return NextResponse.json({ ok: true, syncedProjects: projects?.length || 0, syncedBorrows: borrows?.length || 0 });
    }

    if (action === "append_project") {
      const { project } = body;
      await appendProjectToSheet(token, spreadsheetId, project);
      return NextResponse.json({ ok: true });
    }

    if (action === "append_borrow") {
      const { borrow } = body;
      await appendToolBorrowToSheet(token, spreadsheetId, borrow);
      return NextResponse.json({ ok: true });
    }

    if (action === "update_project") {
      const { reference_code, approval_status, reviewed_by, review_notes } = body;
      await updateProjectApprovalInSheet(
        token,
        spreadsheetId,
        reference_code,
        approval_status,
        reviewed_by || "Admin",
        review_notes || ""
      );
      return NextResponse.json({ ok: true });
    }

    if (action === "update_borrow") {
      const { borrow_id, approval_status, return_status, notes } = body;
      await updateToolBorrowStatusInSheet(
        token,
        spreadsheetId,
        borrow_id,
        approval_status,
        return_status,
        notes
      );
      return NextResponse.json({ ok: true });
    }

    if (action === "pull_updates") {
      const updates = await fetchSheetUpdates(token, spreadsheetId);
      return NextResponse.json({ ok: true, ...updates });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Google Sheets API error:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Failed to interact with Google Sheets" },
      { status: 500 }
    );
  }
}
