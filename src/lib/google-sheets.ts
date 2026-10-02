export type SheetProjectRow = {
  reference_code: string;
  title: string;
  lead_name: string;
  lead_email: string;
  user_type?: string;
  enrollment_number?: string;
  course_code?: string;
  year_of_study?: string;
  faculty_name?: string;
  section_number?: string;
  other_role?: string;
  other_phone?: string;
  summary: string;
  approval_status: "PENDING" | "YES" | "NO";
  reviewed_by?: string;
  review_date?: string;
  review_notes?: string;
  created_at: string;
};

export type SheetBorrowRow = {
  id: string;
  item_name: string;
  quantity: number;
  borrower_name: string;
  borrower_email: string;
  user_type?: string;
  enrollment_number?: string;
  course_code?: string;
  faculty_name?: string;
  section_number?: string;
  project_title: string;
  borrowed_date: string;
  expected_return_date: string;
  approval_status: "PENDING" | "YES" | "NO";
  return_status: "RETURNED PROPERLY" | "NOT RETURNED / IN USE" | "OVERDUE / DAMAGED";
  actual_return_date?: string;
  notes?: string;
  created_at?: string;
};

const PROJECT_HEADERS = [
  "Timestamp",
  "Reference Code",
  "Project Title",
  "Lead Name",
  "Lead Email",
  "Category",
  "Enrollment No.",
  "Course Code",
  "Year",
  "Faculty Mentor",
  "Section",
  "Organization / Role",
  "Contact Phone",
  "Project Description",
  "Admin Approval (YES/NO)",
  "Reviewed By",
  "Review Date",
  "Review Notes",
];

const BORROW_HEADERS = [
  "Timestamp",
  "Borrow ID",
  "Tool / Equipment Name",
  "Quantity",
  "Borrower Name",
  "Borrower Email",
  "Category",
  "Enrollment No.",
  "Course Code",
  "Faculty Mentor",
  "Section",
  "Project Title",
  "Borrowed Date",
  "Expected Return Date",
  "Admin Approval (YES/NO)",
  "Returned Status",
  "Actual Return Date",
  "Admin / Inspection Notes",
];

export async function createOrGetLabSpreadsheet(
  token: string,
  existingSheetId?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; title: string }> {
  // If an existing ID is passed, check if accessible
  if (existingSheetId) {
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${existingSheetId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        return {
          spreadsheetId: data.spreadsheetId,
          spreadsheetUrl: data.spreadsheetUrl,
          title: data.properties?.title || "Tinkerers' Lab Database",
        };
      }
    } catch {
      // Fall through to create
    }
  }

  // Create new spreadsheet
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        title: `Tinkerers' Lab · Portal Database (${new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })})`,
      },
      sheets: [
        {
          properties: {
            title: "Projects",
            gridProperties: { rowCount: 100, columnCount: 20, frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: "Tool_Borrows",
            gridProperties: { rowCount: 100, columnCount: 20, frozenRowCount: 1 },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || "Failed to create Google Sheet");
  }

  const created = await createRes.json();
  const spreadsheetId = created.spreadsheetId;

  // Initialize Headers
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: [
          {
            range: "Projects!A1:R1",
            values: [PROJECT_HEADERS],
          },
          {
            range: "Tool_Borrows!A1:R1",
            values: [BORROW_HEADERS],
          },
        ],
      }),
    }
  );

  return {
    spreadsheetId,
    spreadsheetUrl: created.spreadsheetUrl,
    title: created.properties.title,
  };
}

export async function syncAllToGoogleSheet(
  token: string,
  spreadsheetId: string,
  projects: SheetProjectRow[],
  borrows: SheetBorrowRow[]
): Promise<void> {
  const projectRows = projects.map((p) => [
    p.created_at || new Date().toISOString(),
    p.reference_code,
    p.title,
    p.lead_name,
    p.lead_email,
    p.user_type === "student" ? "AU Student" : "Other / External",
    p.enrollment_number || "",
    p.course_code || "",
    p.year_of_study || "",
    p.faculty_name || "",
    p.section_number || "",
    p.other_role || "Ahmedabad University",
    p.other_phone || "",
    p.summary.slice(0, 300),
    p.approval_status || "PENDING",
    p.reviewed_by || "",
    p.review_date || "",
    p.review_notes || "",
  ]);

  const borrowRows = borrows.map((b) => [
    b.created_at || new Date().toISOString(),
    b.id,
    b.item_name,
    b.quantity,
    b.borrower_name,
    b.borrower_email,
    b.user_type === "student" ? "AU Student" : "Other / External",
    b.enrollment_number || "",
    b.course_code || "",
    b.faculty_name || "",
    b.section_number || "",
    b.project_title,
    b.borrowed_date,
    b.expected_return_date,
    b.approval_status || "PENDING",
    b.return_status || "NOT RETURNED / IN USE",
    b.actual_return_date || "",
    b.notes || "",
  ]);

  // Batch update projects and borrows sheets
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: [
          {
            range: "Projects!A1:R" + (projectRows.length + 1),
            values: [PROJECT_HEADERS, ...projectRows],
          },
          {
            range: "Tool_Borrows!A1:R" + (borrowRows.length + 1),
            values: [BORROW_HEADERS, ...borrowRows],
          },
        ],
      }),
    }
  );
}

export async function appendProjectToSheet(
  token: string,
  spreadsheetId: string,
  p: SheetProjectRow
): Promise<void> {
  const row = [
    new Date().toISOString(),
    p.reference_code,
    p.title,
    p.lead_name,
    p.lead_email,
    p.user_type === "student" ? "AU Student" : "Other / External",
    p.enrollment_number || "",
    p.course_code || "",
    p.year_of_study || "",
    p.faculty_name || "",
    p.section_number || "",
    p.other_role || "Ahmedabad University",
    p.other_phone || "",
    p.summary.slice(0, 300),
    p.approval_status || "PENDING",
    p.reviewed_by || "",
    p.review_date || "",
    p.review_notes || "",
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Projects!A:R:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [row] }),
    }
  );
}

export async function appendToolBorrowToSheet(
  token: string,
  spreadsheetId: string,
  b: SheetBorrowRow
): Promise<void> {
  const row = [
    new Date().toISOString(),
    b.id,
    b.item_name,
    b.quantity,
    b.borrower_name,
    b.borrower_email,
    b.user_type === "student" ? "AU Student" : "Other / External",
    b.enrollment_number || "",
    b.course_code || "",
    b.faculty_name || "",
    b.section_number || "",
    b.project_title,
    b.borrowed_date,
    b.expected_return_date,
    b.approval_status || "PENDING",
    b.return_status || "NOT RETURNED / IN USE",
    b.actual_return_date || "",
    b.notes || "",
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tool_Borrows!A:R:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [row] }),
    }
  );
}

export async function updateProjectApprovalInSheet(
  token: string,
  spreadsheetId: string,
  referenceCode: string,
  approvalStatus: "YES" | "NO",
  reviewedBy: string,
  reviewNotes: string
): Promise<void> {
  // 1. Fetch current rows from Projects sheet
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Projects!A:R`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) return;

  const data = await res.json();
  const rows: string[][] = data.values || [];
  const rowIndex = rows.findIndex((r) => r[1] === referenceCode);

  if (rowIndex > 0) {
    const sheetRowNum = rowIndex + 1;
    const now = new Date().toISOString().split("T")[0];
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Projects!O${sheetRowNum}:R${sheetRowNum}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [[approvalStatus, reviewedBy, now, reviewNotes]],
        }),
      }
    );
  }
}

export async function updateToolBorrowStatusInSheet(
  token: string,
  spreadsheetId: string,
  borrowId: string,
  approvalStatus: "YES" | "NO",
  returnStatus: "RETURNED PROPERLY" | "NOT RETURNED / IN USE" | "OVERDUE / DAMAGED",
  notes?: string
): Promise<void> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tool_Borrows!A:R`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) return;

  const data = await res.json();
  const rows: string[][] = data.values || [];
  const rowIndex = rows.findIndex((r) => r[1] === borrowId);

  if (rowIndex > 0) {
    const sheetRowNum = rowIndex + 1;
    const actualReturnDate =
      returnStatus === "RETURNED PROPERLY"
        ? new Date().toISOString().split("T")[0]
        : "";

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tool_Borrows!O${sheetRowNum}:R${sheetRowNum}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [
            [
              approvalStatus,
              returnStatus,
              actualReturnDate,
              notes || (returnStatus === "RETURNED PROPERLY" ? "Returned in good working condition." : ""),
            ],
          ],
        }),
      }
    );
  }
}

export async function fetchSheetUpdates(
  token: string,
  spreadsheetId: string
): Promise<{
  projectApprovals: Record<string, { approval: "YES" | "NO" | "PENDING"; notes?: string }>;
  borrowUpdates: Record<
    string,
    {
      approval: "YES" | "NO" | "PENDING";
      returnStatus: "RETURNED PROPERLY" | "NOT RETURNED / IN USE" | "OVERDUE / DAMAGED";
    }
  >;
}> {
  const [projRes, borrowRes] = await Promise.all([
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Projects!A:R`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tool_Borrows!A:R`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ]);

  const projectApprovals: Record<string, { approval: "YES" | "NO" | "PENDING"; notes?: string }> = {};
  const borrowUpdates: Record<
    string,
    {
      approval: "YES" | "NO" | "PENDING";
      returnStatus: "RETURNED PROPERLY" | "NOT RETURNED / IN USE" | "OVERDUE / DAMAGED";
    }
  > = {};

  if (projRes.ok) {
    const pData = await projRes.json();
    const rows: string[][] = pData.values || [];
    // row[1] = reference_code, row[14] = approval (O)
    for (let i = 1; i < rows.length; i++) {
      const code = rows[i][1];
      const app = (rows[i][14] || "").toUpperCase().trim();
      const notes = rows[i][17] || "";
      if (code) {
        if (app.includes("YES") || app.includes("APPROV")) {
          projectApprovals[code] = { approval: "YES", notes };
        } else if (app.includes("NO") || app.includes("REJECT")) {
          projectApprovals[code] = { approval: "NO", notes };
        } else {
          projectApprovals[code] = { approval: "PENDING", notes };
        }
      }
    }
  }

  if (borrowRes.ok) {
    const bData = await borrowRes.json();
    const rows: string[][] = bData.values || [];
    // row[1] = borrowId, row[14] = approval (O), row[15] = return status (P)
    for (let i = 1; i < rows.length; i++) {
      const id = rows[i][1];
      const app = (rows[i][14] || "").toUpperCase().trim();
      const ret = (rows[i][15] || "").toUpperCase().trim();
      if (id) {
        const approval = app.includes("YES") || app.includes("APPROV") ? "YES" : app.includes("NO") ? "NO" : "PENDING";
        const returnStatus = ret.includes("RETURNED PROPERLY") || ret === "RETURNED" || ret === "YES"
          ? "RETURNED PROPERLY"
          : ret.includes("DAMAGED") || ret.includes("OVERDUE")
          ? "OVERDUE / DAMAGED"
          : "NOT RETURNED / IN USE";
        borrowUpdates[id] = { approval, returnStatus };
      }
    }
  }

  return { projectApprovals, borrowUpdates };
}
