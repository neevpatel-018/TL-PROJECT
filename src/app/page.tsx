"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wrench,
  FolderPlus,
  CheckCircle2,
  Clock,
  RotateCcw,
  Search,
  FileText,
  Layers,
  GraduationCap,
  Briefcase,
  Trash2,
  AlertCircle,
  ExternalLink,
  Check,
  X,
  RefreshCw,
  LogOut,
  FileSpreadsheet
} from "lucide-react";
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  setAccessTokenInMemory,
} from "@/lib/google-auth";
import type { User } from "firebase/auth";

type Project = {
  id: string;
  reference_code: string;
  title: string;
  lead_name: string;
  lead_email: string;
  organization: string;
  summary: string;
  status: string;
  created_at: string;
  user_type?: "student" | "other";
  enrollment_number?: string;
  course_code?: string;
  year_of_study?: string;
  faculty_name?: string;
  section_number?: string;
  other_role?: string;
  other_phone?: string;
  approval_status?: "PENDING" | "YES" | "NO";
  review_note?: string;
  reviewed_by?: string;
};

type ToolItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  item_type: "consumable" | "reusable" | "machine";
  location: string;
  on_hand: number;
  reserved: number;
  available: number;
};

type ToolBorrow = {
  id: string;
  borrower_name: string;
  borrower_email: string;
  user_type?: "student" | "other";
  enrollment_number?: string;
  course_code?: string;
  faculty_name?: string;
  section_number?: string;
  project_title: string;
  item_id: string;
  item_name: string;
  quantity: number;
  borrowed_date: string;
  expected_return_date: string;
  status: "active" | "returned" | "overdue";
  approval_status?: "PENDING" | "YES" | "NO";
  return_condition?: "RETURNED PROPERLY" | "NOT RETURNED / IN USE" | "OVERDUE / DAMAGED";
  actual_return_date?: string;
  notes?: string;
  created_at?: string;
};

type SelectedToolRequest = {
  item_id: string;
  item_name: string;
  quantity: number;
  expected_return_date: string;
};

export default function LabPortalDashboard() {
  const [activeTab, setActiveTab] = useState<"register" | "borrow" | "records">("register");

  // Google Sheets OAuth State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string | null>(null);
  const [sheetsSyncing, setSheetsSyncing] = useState(false);
  const [sheetsSyncMessage, setSheetsSyncMessage] = useState<string | null>(null);

  // User confirmation dialog state for mutating Google Sheets data
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);

  // User classification
  const [userType, setUserType] = useState<"student" | "other">("student");

  // Project Registration State
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const organization = "Ahmedabad University";
  const [teamMembers, setTeamMembers] = useState("");

  // Student specific verification fields
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("3rd Year");
  const [facultyName, setFacultyName] = useState("");
  const [sectionNumber, setSectionNumber] = useState("Section A");

  // Non-student (Other) specific fields
  const [otherRole, setOtherRole] = useState("Faculty / Research Scholar");
  const [otherOrganization, setOtherOrganization] = useState("");
  const [otherPhone, setOtherPhone] = useState("");
  const [otherIdNumber, setOtherIdNumber] = useState("");
  const [otherPurpose, setOtherPurpose] = useState("");

  // Direct tool borrowing within project registration
  const [includeToolsWithProject, setIncludeToolsWithProject] = useState(false);
  const [selectedToolsForProject, setSelectedToolsForProject] = useState<SelectedToolRequest[]>([]);

  const [submittingProject, setSubmittingProject] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [projectSuccessRef, setProjectSuccessRef] = useState<string | null>(null);

  // Tools & Borrows State
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [borrows, setBorrows] = useState<ToolBorrow[]>([]);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);
  const [selectedToolForCheckout, setSelectedToolForCheckout] = useState<ToolItem | null>(null);

  // Standalone Borrow Modal Form State
  const [borrowUserType, setBorrowUserType] = useState<"student" | "other">("student");
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerEmail, setBorrowerEmail] = useState("");
  const [borrowEnrollment, setBorrowEnrollment] = useState("");
  const [borrowCourse, setBorrowCourse] = useState("");
  const [borrowYear, setBorrowYear] = useState("3rd Year");
  const [borrowFaculty, setBorrowFaculty] = useState("");
  const [borrowSection, setBorrowSection] = useState("Section A");
  const [borrowOtherRole, setBorrowOtherRole] = useState("");
  const [borrowOtherPhone, setBorrowOtherPhone] = useState("");
  const [borrowProjectTitle, setBorrowProjectTitle] = useState("");
  const [borrowQty, setBorrowQty] = useState(1);
  const [borrowReturnDate, setBorrowReturnDate] = useState("");
  const [borrowNotes, setBorrowNotes] = useState("");
  const [submittingBorrow, setSubmittingBorrow] = useState(false);
  const [borrowError, setBorrowError] = useState<string | null>(null);
  const [borrowSuccess, setBorrowSuccess] = useState<string | null>(null);

  // Tool search & filter
  const [toolSearch, setToolSearch] = useState("");
  const [toolCategory, setToolCategory] = useState("All");

  // Load Data
  async function loadDashboardData() {
    setLoadingTools(true);
    try {
      const [toolsRes, projRes] = await Promise.all([
        fetch("/api/tools/borrow"),
        fetch("/api/projects"),
      ]);

      if (toolsRes.ok) {
        const tData = await toolsRes.json();
        setTools(tData.tools || []);
        setBorrows(tData.borrows || []);
      }

      if (projRes.ok) {
        const pData = await projRes.json();
        setProjectsList(pData.projects || []);
      }
    } catch {
      // Fallback handled
    } finally {
      setLoadingTools(false);
    }
  }

  // Initialize Auth
  useEffect(() => {
    loadDashboardData();

    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        initializeGoogleSpreadsheet(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // Initialize or connect Google Spreadsheet
  async function initializeGoogleSpreadsheet(token: string) {
    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "init" }),
      });
      if (res.ok) {
        const data = await res.json();
        setSpreadsheetId(data.spreadsheetId);
        setSpreadsheetUrl(data.spreadsheetUrl);
        setSpreadsheetTitle(data.title);
      }
    } catch (err) {
      console.error("Failed to initialize Google Sheet:", err);
    }
  }

  // Handle Google Sign In
  async function handleGoogleSignIn() {
    setIsSigningInGoogle(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        setAccessTokenInMemory(res.accessToken);
        await initializeGoogleSpreadsheet(res.accessToken);
      }
    } catch (err) {
      console.error("Google login failed:", err);
    } finally {
      setIsSigningInGoogle(false);
    }
  }

  // Handle Google Sign Out
  async function handleGoogleSignOut() {
    await logoutGoogle();
    setGoogleUser(null);
    setGoogleToken(null);
    setSpreadsheetId(null);
    setSpreadsheetUrl(null);
    setSpreadsheetTitle(null);
  }

  // Trigger sync all to Google Sheets with explicit confirmation
  function triggerSyncAllConfirmation() {
    if (!googleToken || !spreadsheetId) return;

    setConfirmDialog({
      isOpen: true,
      title: "Update Google Sheet with all portal records?",
      description: `This will update ${projectsList.length} registered project(s) and ${borrows.length} tool borrow record(s) with their current Admin Approvals (YES/NO) and Return Conditions into "${spreadsheetTitle || "Google Sheet"}".`,
      confirmText: "Sync to Google Sheet",
      onConfirm: async () => {
        setConfirmDialog(null);
        setSheetsSyncing(true);
        setSheetsSyncMessage("Updating spreadsheet...");
        try {
          const res = await fetch("/api/sheets", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${googleToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "sync_all",
              spreadsheetId,
              projects: projectsList.map((p) => ({
                reference_code: p.reference_code,
                title: p.title,
                lead_name: p.lead_name,
                lead_email: p.lead_email,
                user_type: p.user_type,
                enrollment_number: p.enrollment_number,
                course_code: p.course_code,
                year_of_study: p.year_of_study,
                faculty_name: p.faculty_name,
                section_number: p.section_number,
                other_role: p.other_role,
                other_phone: p.other_phone,
                summary: p.summary,
                approval_status: p.approval_status || (p.status === "approved" ? "YES" : p.status === "rejected" ? "NO" : "PENDING"),
                reviewed_by: p.reviewed_by || googleUser?.email || "Admin",
                review_date: new Date().toISOString().split("T")[0],
                review_notes: p.review_note || "",
                created_at: p.created_at,
              })),
              borrows: borrows.map((b) => ({
                id: b.id,
                item_name: b.item_name,
                quantity: b.quantity,
                borrower_name: b.borrower_name,
                borrower_email: b.borrower_email,
                project_title: b.project_title,
                borrowed_date: b.borrowed_date,
                expected_return_date: b.expected_return_date,
                approval_status: b.approval_status || "PENDING",
                return_status: b.return_condition || (b.status === "returned" ? "RETURNED PROPERLY" : "NOT RETURNED / IN USE"),
                actual_return_date: b.actual_return_date || "",
                notes: b.notes || "",
                created_at: b.created_at,
              })),
            }),
          });
          if (res.ok) {
            setSheetsSyncMessage("Successfully synced all records to Google Sheets!");
            setTimeout(() => setSheetsSyncMessage(null), 4000);
          } else {
            setSheetsSyncMessage("Error updating Google Sheets.");
          }
        } catch {
          setSheetsSyncMessage("Network error during sync.");
        } finally {
          setSheetsSyncing(false);
        }
      },
    });
  }

  // Pull external updates from Google Sheet
  async function handlePullSheetUpdates() {
    if (!googleToken || !spreadsheetId) return;
    setSheetsSyncing(true);
    setSheetsSyncMessage("Checking Google Sheet for admin edits...");
    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${googleToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "pull_updates", spreadsheetId }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update local project approvals
        if (data.projectApprovals) {
          setProjectsList((prev) =>
            prev.map((p) => {
              const match = data.projectApprovals[p.reference_code];
              if (match) {
                return {
                  ...p,
                  approval_status: match.approval,
                  status: match.approval === "YES" ? "approved" : match.approval === "NO" ? "rejected" : "pending",
                  review_note: match.notes || p.review_note,
                };
              }
              return p;
            })
          );
        }
        // Update local borrow statuses
        if (data.borrowUpdates) {
          setBorrows((prev) =>
            prev.map((b) => {
              const match = data.borrowUpdates[b.id];
              if (match) {
                return {
                  ...b,
                  approval_status: match.approval,
                  return_condition: match.returnStatus,
                  status: match.returnStatus === "RETURNED PROPERLY" ? "returned" : "active",
                };
              }
              return b;
            })
          );
        }
        setSheetsSyncMessage("Synced latest approvals from Google Sheet!");
        setTimeout(() => setSheetsSyncMessage(null), 4000);
      }
    } catch {
      setSheetsSyncMessage("Failed to pull updates from Google Sheet.");
    } finally {
      setSheetsSyncing(false);
    }
  }

  // Admin Project Approval Toggle (YES / NO / PENDING)
  async function handleProjectApproval(referenceCode: string, approval: "YES" | "NO" | "PENDING") {
    // 1. Update local state
    setProjectsList((prev) =>
      prev.map((p) =>
        p.reference_code === referenceCode
          ? {
              ...p,
              approval_status: approval,
              status: approval === "YES" ? "approved" : approval === "NO" ? "rejected" : "pending",
            }
          : p
      )
    );

    // 2. Persist to API
    try {
      await fetch("/api/admin/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "project",
          reference_code: referenceCode,
          approval_status: approval,
          reviewer: googleUser?.email || "Admin",
          review_notes: `Approval set to ${approval} by admin`,
        }),
      });

      // 3. Update Google Sheet if connected
      if (googleToken && spreadsheetId) {
        fetch("/api/sheets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${googleToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "update_project",
            spreadsheetId,
            reference_code: referenceCode,
            approval_status: approval,
            reviewed_by: googleUser?.email || "Admin",
            review_notes: `Updated on ${new Date().toLocaleDateString()}`,
          }),
        }).catch(() => {});
      }
    } catch {
      // Handled
    }
  }

  // Admin Tool Borrow Status Update (Approval YES/NO & Return Condition)
  async function handleToolBorrowApproval(
    borrowId: string,
    approval: "YES" | "NO" | "PENDING",
    returnCondition: "RETURNED PROPERLY" | "NOT RETURNED / IN USE" | "OVERDUE / DAMAGED"
  ) {
    // 1. Update local state
    setBorrows((prev) =>
      prev.map((b) =>
        b.id === borrowId
          ? {
              ...b,
              approval_status: approval,
              return_condition: returnCondition,
              status: returnCondition === "RETURNED PROPERLY" ? "returned" : "active",
            }
          : b
      )
    );

    // 2. Persist to API
    try {
      await fetch("/api/admin/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "tool_borrow",
          borrow_id: borrowId,
          approval_status: approval,
          return_status: returnCondition,
          notes: returnCondition === "RETURNED PROPERLY" ? "Returned in good condition" : "",
        }),
      });

      // 3. Update Google Sheet if connected
      if (googleToken && spreadsheetId) {
        fetch("/api/sheets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${googleToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "update_borrow",
            spreadsheetId,
            borrow_id: borrowId,
            approval_status: approval,
            return_status: returnCondition,
            notes: returnCondition === "RETURNED PROPERLY" ? "Verified returned properly" : "",
          }),
        }).catch(() => {});
      }

      loadDashboardData();
    } catch {
      // Handled
    }
  }

  // AU Email validation helper
  const isAuEmail = leadEmail.toLowerCase().includes("@ahduni.edu");

  // Handle Project + Tool Submit
  async function handleRegisterProject(e: React.FormEvent) {
    e.preventDefault();
    setProjectError(null);

    if (projectDescription.trim().length < 20) {
      setProjectError("Project description must be at least 20 characters.");
      return;
    }

    if (userType === "student" && !enrollmentNumber.trim()) {
      setProjectError("Enrollment number is required for Ahmedabad University students.");
      return;
    }

    if (userType === "other" && (!otherPhone.trim() || !otherRole.trim())) {
      setProjectError("Please provide your contact phone and role details.");
      return;
    }

    setSubmittingProject(true);

    const fullSummary = problemStatement.trim()
      ? `${projectDescription.trim()}\n\nProblem Statement & Objectives:\n${problemStatement.trim()}`
      : projectDescription.trim();

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: projectTitle.trim(),
          summary: fullSummary,
          lead_name: leadName.trim(),
          lead_email: leadEmail.trim(),
          organization: userType === "student" ? "Ahmedabad University" : (otherOrganization.trim() || organization),
          team_members: teamMembers.trim(),
          acknowledgement: "on",
          user_type: userType,
          enrollment_number: userType === "student" ? enrollmentNumber.trim() : "",
          course_code: userType === "student" ? courseCode.trim() : "",
          year_of_study: userType === "student" ? yearOfStudy : "",
          faculty_name: userType === "student" ? facultyName.trim() : "",
          section_number: userType === "student" ? sectionNumber.trim() : "",
          au_id_verified: isAuEmail,
          other_role: userType === "other" ? otherRole.trim() : "",
          other_organization: userType === "other" ? otherOrganization.trim() : "",
          other_phone: userType === "other" ? otherPhone.trim() : "",
          other_id_number: userType === "other" ? otherIdNumber.trim() : "",
          other_purpose: userType === "other" ? otherPurpose.trim() : "",
          borrowed_tools: includeToolsWithProject
            ? selectedToolsForProject.map((t) => ({
                item_id: t.item_id,
                quantity: t.quantity,
                expected_return_date: t.expected_return_date,
              }))
            : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProjectError(data.error || "Failed to register project.");
        setSubmittingProject(false);
        return;
      }

      const generatedRef = data.reference || "SUBMITTED";
      setProjectSuccessRef(generatedRef);

      // Auto-append to Google Sheet if active
      if (googleToken && spreadsheetId) {
        fetch("/api/sheets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${googleToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "append_project",
            spreadsheetId,
            project: {
              reference_code: generatedRef,
              title: projectTitle.trim(),
              lead_name: leadName.trim(),
              lead_email: leadEmail.trim(),
              user_type: userType,
              enrollment_number: enrollmentNumber.trim(),
              course_code: courseCode.trim(),
              year_of_study: yearOfStudy,
              faculty_name: facultyName.trim(),
              section_number: sectionNumber.trim(),
              other_role: otherRole.trim(),
              other_phone: otherPhone.trim(),
              summary: fullSummary,
              approval_status: "PENDING",
            },
          }),
        }).catch(() => {});
      }

      setProjectTitle("");
      setProjectDescription("");
      setProblemStatement("");
      setLeadName("");
      setLeadEmail("");
      setEnrollmentNumber("");
      setCourseCode("");
      setFacultyName("");
      setOtherPhone("");
      setOtherIdNumber("");
      setOtherPurpose("");
      setSelectedToolsForProject([]);
      setIncludeToolsWithProject(false);
      setSubmittingProject(false);
      loadDashboardData();
    } catch {
      setProjectError("Network error while registering project.");
      setSubmittingProject(false);
    }
  }

  // Handle standalone borrow submit
  async function handleStandaloneBorrowSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedToolForCheckout) return;
    setBorrowError(null);
    setSubmittingBorrow(true);

    try {
      const res = await fetch("/api/tools/borrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrower_name: borrowerName.trim(),
          borrower_email: borrowerEmail.trim(),
          project_title: borrowProjectTitle.trim() || "Independent Lab Prototype",
          item_id: selectedToolForCheckout.id,
          quantity: Number(borrowQty),
          expected_return_date: borrowReturnDate,
          user_type: borrowUserType,
          enrollment_number: borrowUserType === "student" ? borrowEnrollment.trim() : "",
          course_code: borrowUserType === "student" ? borrowCourse.trim() : "",
          year_of_study: borrowUserType === "student" ? borrowYear : "",
          faculty_name: borrowUserType === "student" ? borrowFaculty.trim() : "",
          section_number: borrowUserType === "student" ? borrowSection.trim() : "",
          other_role: borrowUserType === "other" ? borrowOtherRole.trim() : "",
          other_phone: borrowUserType === "other" ? borrowOtherPhone.trim() : "",
          notes: borrowNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBorrowError(data.error || "Failed to borrow tool.");
        setSubmittingBorrow(false);
        return;
      }

      const borrowRecord = data.borrow;

      // Auto-append to Google Sheet
      if (googleToken && spreadsheetId && borrowRecord) {
        fetch("/api/sheets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${googleToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "append_borrow",
            spreadsheetId,
            borrow: {
              id: borrowRecord.id,
              item_name: selectedToolForCheckout.name,
              quantity: Number(borrowQty),
              borrower_name: borrowerName.trim(),
              borrower_email: borrowerEmail.trim(),
              user_type: borrowUserType,
              enrollment_number: borrowEnrollment.trim(),
              course_code: borrowCourse.trim(),
              faculty_name: borrowFaculty.trim(),
              section_number: borrowSection.trim(),
              project_title: borrowProjectTitle.trim() || "Independent Lab Prototype",
              borrowed_date: new Date().toISOString().split("T")[0],
              expected_return_date: borrowReturnDate,
              approval_status: "PENDING",
              return_status: "NOT RETURNED / IN USE",
              notes: borrowNotes.trim(),
            },
          }),
        }).catch(() => {});
      }

      setBorrowSuccess(`Successfully borrowed ${borrowQty}x ${selectedToolForCheckout.name}!`);
      setBorrowQty(1);
      setBorrowNotes("");
      setSubmittingBorrow(false);
      setSelectedToolForCheckout(null);
      loadDashboardData();
    } catch {
      setBorrowError("Network error recording tool checkout.");
      setSubmittingBorrow(false);
    }
  }

  const categories = ["All", ...Array.from(new Set(tools.map((t) => t.category)))];

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
      tool.sku.toLowerCase().includes(toolSearch.toLowerCase()) ||
      tool.location.toLowerCase().includes(toolSearch.toLowerCase());
    const matchesCat = toolCategory === "All" || tool.category === toolCategory;
    return matchesSearch && matchesCat;
  });

  const activeBorrows = borrows.filter((b) => b.status === "active");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#163247] to-[#0369a1] text-lg font-black text-white shadow-sm">
              TL
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Ahmedabad University
              </div>
              <div className="text-base font-bold text-tl-navy">Tinkerers’ Lab Portal</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {googleUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-900">{googleUser.displayName || googleUser.email}</span>
                  <span className="text-[10px] text-emerald-600 font-medium">Google Sheets Connected</span>
                </div>
                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Open Sheet</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleGoogleSignOut}
                  title="Sign out of Google"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSigningInGoogle}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:bg-slate-100"
              >
                {/* Official Google G Icon */}
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{isSigningInGoogle ? "Connecting..." : "Connect Google Sheets"}</span>
              </button>
            )}

            <Link
              href="/login?tab=register"
              className="rounded-lg border border-sky-200 bg-sky-50/80 px-2.5 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100 transition hidden sm:inline-flex"
            >
              Register
            </Link>
            <Link
              href="/login?role=student"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Student Sign In
            </Link>
            <Link
              href="/login?role=admin"
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-sm transition"
            >
              Admin / Staff
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Google Sheets Integration Banner */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 border border-emerald-200">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-tl-navy">Google Sheets Live Synchronization</h3>
                  {googleUser ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      LIVE CONNECTED
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      OFFLINE
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500 max-w-2xl">
                  {googleUser
                    ? `Connected to "${spreadsheetTitle || "Tinkerers' Lab Database"}". Registered projects and tool borrows automatically sync with Admin Approval (YES/NO) and Return Status.`
                    : "Sign in with your Google account to automatically mirror every registration and tool borrow into Google Sheets with admin approval workflows."}
                </p>
                {sheetsSyncMessage && (
                  <div className="mt-2 text-xs font-medium text-emerald-700 animate-fadeIn">
                    ✓ {sheetsSyncMessage}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {googleUser ? (
                <>
                  <button
                    type="button"
                    onClick={handlePullSheetUpdates}
                    disabled={sheetsSyncing}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 text-sky-600 ${sheetsSyncing ? "animate-spin" : ""}`} />
                    <span>Pull Sheet Approvals</span>
                  </button>
                  <button
                    type="button"
                    onClick={triggerSyncAllConfirmation}
                    disabled={sheetsSyncing}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0369a1] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#025a8a] disabled:opacity-50"
                  >
                    <span>Sync All Records</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSigningInGoogle}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                >
                  Authorize Google Sheets
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stat Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Registered Projects
              </span>
              <div className="rounded-lg bg-sky-50 p-2 text-[#0369a1]">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-tl-navy">{projectsList.length}</div>
            <div className="mt-1 text-xs text-slate-500">
              {projectsList.filter((p) => p.approval_status === "YES" || p.status === "approved").length} Approved (YES) •{" "}
              {projectsList.filter((p) => p.approval_status === "NO" || p.status === "rejected").length} Rejected (NO)
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Equipment &amp; Tools
              </span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <Wrench className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-tl-navy">
              {tools.reduce((acc, t) => acc + t.available, 0)} Units Available
            </div>
            <div className="mt-1 text-xs text-slate-500">Across {tools.length} equipment types</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tools Checked Out
              </span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-tl-navy">{activeBorrows.length} Active</div>
            <div className="mt-1 text-xs text-slate-500">
              {borrows.filter((b) => b.return_condition === "RETURNED PROPERLY" || b.status === "returned").length} Returned Properly
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("register")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "register"
                ? "bg-[#0369a1] text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <FolderPlus className="h-4 w-4" />
            <span>1. Register Project &amp; Borrow Tools</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("borrow")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "borrow"
                ? "bg-[#0369a1] text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Wrench className="h-4 w-4" />
            <span>2. Lab Tool Inventory Catalog</span>
            <span className="ml-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-800 font-bold">
              {tools.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("records")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "records"
                ? "bg-[#0369a1] text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>3. Current Records &amp; Admin Approvals</span>
            {activeBorrows.length > 0 && (
              <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 font-bold">
                {activeBorrows.length} out
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: REGISTER PROJECT & BORROW TOOLS */}
        {activeTab === "register" && (
          <div className="mx-auto max-w-3xl">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-[30px] font-bold leading-[36px] text-tl-navy">
                Register a project &amp; borrow tools
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Submit your project proposal for review by Tinkerers’ Lab. Verified Ahmedabad University students
                and affiliated researchers can register proposals and request lab equipment directly in this form.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {projectSuccessRef ? (
                <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    <h2 className="text-lg font-semibold text-emerald-900">
                      Project and tool request logged successfully!
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-emerald-700">
                    Your proposal and requested tools have been recorded. Your project reference code is:
                  </p>
                  <div className="my-4 inline-block rounded-lg border border-emerald-300 bg-white px-4 py-2 font-mono text-base font-bold text-emerald-900">
                    {projectSuccessRef}
                  </div>
                  {googleUser && spreadsheetUrl && (
                    <p className="text-xs text-emerald-700 font-medium mb-4">
                      ✓ Automatically synced to{" "}
                      <a href={spreadsheetUrl} target="_blank" rel="noreferrer" className="underline font-bold">
                        Google Sheet (Projects tab) ↗
                      </a>
                    </p>
                  )}
                  <p className="text-xs text-emerald-600">
                    Keep this reference code for your records and for follow-up with Tinkerers’ Lab mentors.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setProjectSuccessRef(null);
                        setActiveTab("records");
                      }}
                      className="rounded-lg bg-[#0369a1] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#025a8a] flex items-center gap-1.5"
                    >
                      <Layers className="h-4 w-4" />
                      View in Active Records
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectSuccessRef(null)}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Register another project
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegisterProject} className="space-y-6">
                  {projectError && (
                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{projectError}</span>
                    </div>
                  )}

                  {/* Classification Toggle: Student vs Other */}
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#0369a1]">
                      Lead Applicant Category *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setUserType("student")}
                        className={`flex items-center justify-center gap-2 rounded-xl p-3.5 border text-sm font-semibold transition ${
                          userType === "student"
                            ? "border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-200"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <GraduationCap className="h-4 w-4 text-[#0369a1]" />
                        <span>Ahmedabad Univ. Student</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUserType("other")}
                        className={`flex items-center justify-center gap-2 rounded-xl p-3.5 border text-sm font-semibold transition ${
                          userType === "other"
                            ? "border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-200"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Briefcase className="h-4 w-4 text-slate-600" />
                        <span>Other (Faculty / External / Staff)</span>
                      </button>
                    </div>
                  </div>

                  {/* Section 1: Lead Information & Verification */}
                  <section className="space-y-4 pt-2">
                    <h2 className="text-lg font-semibold text-tl-navy">
                      {userType === "student" ? "Student Verification & Academic Details" : "Applicant & Organization Details"}
                    </h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="reg-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="reg-name"
                          type="text"
                          required
                          autoComplete="name"
                          placeholder="e.g. Aarav Patel"
                          value={leadName}
                          onChange={(e) => setLeadName(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                          {userType === "student" ? "AU Student Email (AU ID Verified) *" : "Official Contact Email *"}
                        </label>
                        <div className="relative">
                          <input
                            id="reg-email"
                            type="email"
                            required
                            autoComplete="email"
                            placeholder={userType === "student" ? "student.id@ahduni.edu.in" : "contact@organization.com"}
                            value={leadEmail}
                            onChange={(e) => setLeadEmail(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                          />
                        </div>
                        {userType === "student" && leadEmail && (
                          <div className="mt-1 flex items-center gap-1.5 text-xs">
                            {isAuEmail ? (
                              <span className="text-emerald-700 font-medium flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Valid Ahmedabad University student domain
                              </span>
                            ) : (
                              <span className="text-amber-700">
                                Note: Please use your @ahduni.edu.in AU email ID
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {userType === "student" ? (
                        <>
                          <div>
                            <label htmlFor="reg-enrollment" className="mb-1.5 block text-sm font-medium text-slate-700">
                              Enrollment Number (AU ID) <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="reg-enrollment"
                              type="text"
                              required
                              placeholder="e.g. AU2100456"
                              value={enrollmentNumber}
                              onChange={(e) => setEnrollmentNumber(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label htmlFor="reg-course" className="mb-1.5 block text-sm font-medium text-slate-700">
                              Course Code <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="reg-course"
                              type="text"
                              required
                              placeholder="e.g. ENR201, CSE301, DES102"
                              value={courseCode}
                              onChange={(e) => setCourseCode(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label htmlFor="reg-year" className="mb-1.5 block text-sm font-medium text-slate-700">
                              Year of Study <span className="text-red-500">*</span>
                            </label>
                            <select
                              id="reg-year"
                              value={yearOfStudy}
                              onChange={(e) => setYearOfStudy(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                            >
                              <option value="1st Year">1st Year (Freshman)</option>
                              <option value="2nd Year">2nd Year (Sophomore)</option>
                              <option value="3rd Year">3rd Year (Junior)</option>
                              <option value="4th Year">4th Year (Senior / Capstone)</option>
                              <option value="Postgraduate / PhD">Postgraduate / Masters / PhD</option>
                            </select>
                          </div>

                          <div>
                            <label htmlFor="reg-section" className="mb-1.5 block text-sm font-medium text-slate-700">
                              Section Number / Division <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="reg-section"
                              type="text"
                              required
                              placeholder="e.g. Section A, Div 1"
                              value={sectionNumber}
                              onChange={(e) => setSectionNumber(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label htmlFor="reg-faculty" className="mb-1.5 block text-sm font-medium text-slate-700">
                              Faculty Mentor / Course Instructor Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="reg-faculty"
                              type="text"
                              required
                              placeholder="e.g. Prof. Deepak Sharma / Dr. Shashi Ranjan"
                              value={facultyName}
                              onChange={(e) => setFacultyName(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label htmlFor="reg-other-role" className="mb-1.5 block text-sm font-medium text-slate-700">
                              Role / Designation <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="reg-other-role"
                              type="text"
                              required
                              placeholder="e.g. Research Scholar, Postdoc, Startup Founder, Faculty"
                              value={otherRole}
                              onChange={(e) => setOtherRole(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label htmlFor="reg-other-phone" className="mb-1.5 block text-sm font-medium text-slate-700">
                              Contact Mobile Phone <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="reg-other-phone"
                              type="tel"
                              required
                              placeholder="+91 98765 43210"
                              value={otherPhone}
                              onChange={(e) => setOtherPhone(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label htmlFor="reg-other-org" className="mb-1.5 block text-sm font-medium text-slate-700">
                              Institution / Company / Lab Affiliation <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="reg-other-org"
                              type="text"
                              required
                              placeholder="e.g. Ahmedabad University VentureStudio / Bio-Engineering Lab"
                              value={otherOrganization}
                              onChange={(e) => setOtherOrganization(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label htmlFor="reg-other-id" className="mb-1.5 block text-sm font-medium text-slate-700">
                              Employee / ID / Reference Number
                            </label>
                            <input
                              id="reg-other-id"
                              type="text"
                              placeholder="e.g. EMP-2024-9182"
                              value={otherIdNumber}
                              onChange={(e) => setOtherIdNumber(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label htmlFor="reg-other-purpose" className="mb-1.5 block text-sm font-medium text-slate-700">
                              Lab Access Purpose / Authorized Department
                            </label>
                            <input
                              id="reg-other-purpose"
                              type="text"
                              placeholder="e.g. Incubated Prototype development under VentureStudio"
                              value={otherPurpose}
                              onChange={(e) => setOtherPurpose(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                            />
                          </div>
                        </>
                      )}

                      <div className="sm:col-span-2">
                        <label htmlFor="reg-members" className="mb-1.5 block text-sm font-medium text-slate-700">
                          Additional Collaborator Team Members (Optional)
                        </label>
                        <textarea
                          id="reg-members"
                          rows={2}
                          placeholder="Enter one team member name and email per line"
                          value={teamMembers}
                          onChange={(e) => setTeamMembers(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Section 2: Project Details */}
                  <section className="space-y-4 pt-4 border-t border-slate-100">
                    <h2 className="text-lg font-semibold text-tl-navy">Project details</h2>

                    <div>
                      <label htmlFor="reg-title" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Project title <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="reg-title"
                        type="text"
                        required
                        maxLength={150}
                        placeholder="Enter your project title"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="reg-desc" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Project description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="reg-desc"
                        required
                        rows={4}
                        minLength={20}
                        maxLength={5000}
                        placeholder="Describe your project, how it works, and what you plan to build."
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="reg-prob" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Problem statement and objectives
                      </label>
                      <textarea
                        id="reg-prob"
                        rows={2}
                        maxLength={3000}
                        placeholder="What problem does your project aim to solve?"
                        value={problemStatement}
                        onChange={(e) => setProblemStatement(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                      />
                    </div>
                  </section>

                  {/* Section 3: DIRECT TOOL BORROWING INTEGRATION */}
                  <section className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-tl-navy flex items-center gap-2">
                          <Wrench className="h-5 w-5 text-[#0369a1]" />
                          Borrow Tools for this Project
                        </h2>
                        <p className="text-xs text-slate-500">
                          Select lab tools and equipment you need to check out immediately with this project.
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeToolsWithProject}
                          onChange={(e) => setIncludeToolsWithProject(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0369a1]"></div>
                        <span className="ml-2 text-xs font-semibold text-slate-700">
                          {includeToolsWithProject ? "Active" : "Add Tools"}
                        </span>
                      </label>
                    </div>

                    {includeToolsWithProject && (
                      <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 space-y-4">
                        <div className="text-xs font-semibold text-[#0369a1]">
                          Choose Equipment to Checkout:
                        </div>

                        {/* Quick Tool Selector */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {tools.map((t) => {
                            const isSelected = selectedToolsForProject.some((st) => st.item_id === t.id);
                            return (
                              <button
                                key={t.id}
                                type="button"
                                disabled={t.available === 0}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedToolsForProject(
                                      selectedToolsForProject.filter((st) => st.item_id !== t.id)
                                    );
                                  } else {
                                    const ret = new Date();
                                    ret.setDate(ret.getDate() + 7);
                                    setSelectedToolsForProject([
                                      ...selectedToolsForProject,
                                      {
                                        item_id: t.id,
                                        item_name: t.name,
                                        quantity: 1,
                                        expected_return_date: ret.toISOString().split("T")[0],
                                      },
                                    ]);
                                  }
                                }}
                                className={`flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition ${
                                  isSelected
                                    ? "bg-white border-[#0369a1] text-[#0369a1] shadow-sm font-semibold ring-1 ring-[#0369a1]"
                                    : t.available > 0
                                    ? "bg-white border-slate-200 text-slate-700 hover:border-sky-300"
                                    : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                }`}
                              >
                                <div>
                                  <div className="font-medium">{t.name}</div>
                                  <div className="text-[10px] text-slate-500">
                                    {t.available > 0 ? `${t.available} in stock` : "Out of stock"} • {t.location}
                                  </div>
                                </div>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    isSelected
                                      ? "bg-[#0369a1] text-white"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {isSelected ? "Selected ✓" : "+ Add"}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Configured selected tool lines */}
                        {selectedToolsForProject.length > 0 && (
                          <div className="pt-2 space-y-2">
                            <div className="text-xs font-bold text-slate-700">
                              Selected Tools for Checkout ({selectedToolsForProject.length}):
                            </div>
                            {selectedToolsForProject.map((st, idx) => (
                              <div
                                key={st.item_id}
                                className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-xs"
                              >
                                <span className="font-semibold text-slate-800 flex-1 min-w-[140px]">
                                  {st.item_name}
                                </span>
                                <div className="flex items-center gap-2">
                                  <label className="text-slate-500">Qty:</label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={st.quantity}
                                    onChange={(e) => {
                                      const next = [...selectedToolsForProject];
                                      next[idx].quantity = Math.max(1, Number(e.target.value));
                                      setSelectedToolsForProject(next);
                                    }}
                                    className="w-14 rounded border border-slate-300 px-1.5 py-1 text-center font-bold"
                                  />

                                  <label className="text-slate-500 ml-2">Due:</label>
                                  <input
                                    type="date"
                                    value={st.expected_return_date}
                                    onChange={(e) => {
                                      const next = [...selectedToolsForProject];
                                      next[idx].expected_return_date = e.target.value;
                                      setSelectedToolsForProject(next);
                                    }}
                                    className="rounded border border-slate-300 px-1.5 py-1"
                                  />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedToolsForProject(
                                        selectedToolsForProject.filter((x) => x.item_id !== st.item_id)
                                      )
                                    }
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  {/* Information notice */}
                  <div className="rounded-lg border border-sky-100 bg-sky-50 p-4">
                    <p className="text-xs leading-relaxed text-slate-700 sm:text-sm">
                      Submitting this form sends your proposal and tool allocation request for review.
                      All borrowed equipment must be returned in working order according to university lab safety protocols.
                    </p>
                  </div>

                  {/* Submit button */}
                  <div>
                    <button
                      type="submit"
                      disabled={submittingProject}
                      className="w-full rounded-lg bg-[#0369a1] py-3.5 px-4 text-sm font-semibold text-white transition hover:bg-[#025a8a] disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                    >
                      {submittingProject
                        ? "Registering project & tools..."
                        : includeToolsWithProject && selectedToolsForProject.length > 0
                        ? `Register Project & Borrow ${selectedToolsForProject.length} Tool(s)`
                        : "Register project"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LAB TOOL INVENTORY CATALOG */}
        {activeTab === "borrow" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-[30px] font-bold text-tl-navy">Borrow Lab Tools</h1>
                <p className="text-sm text-slate-600">
                  Select available lab equipment, tools, and components to check out with your verified AU student ID or affiliation.
                </p>
              </div>

              {borrowSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {borrowSuccess}
                </div>
              )}
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tools, equipment, SKU, or workbench location..."
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-sky-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setToolCategory(cat)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      toolCategory === cat
                        ? "bg-[#0369a1] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Tool Grid */}
            {loadingTools ? (
              <div className="py-12 text-center text-sm text-slate-500">
                Loading available lab tools...
              </div>
            ) : filteredTools.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200 p-8">
                No tools match your search criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTools.map((tool) => {
                  const isAvailable = tool.available > 0;
                  return (
                    <div
                      key={tool.id}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-300"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            {tool.category}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              isAvailable
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {isAvailable ? `${tool.available} ${tool.unit} in stock` : "Fully Reserved"}
                          </span>
                        </div>

                        <h3 className="mt-3 text-base font-bold text-tl-navy">{tool.name}</h3>
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                          <span>SKU: {tool.sku}</span>
                          <span>•</span>
                          <span>{tool.location}</span>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                          Type: <span className="capitalize font-medium text-slate-700">{tool.item_type}</span>
                        </div>
                        <button
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => {
                            setSelectedToolForCheckout(tool);
                            setBorrowQty(1);
                            setBorrowError(null);
                            const d = new Date();
                            d.setDate(d.getDate() + 7);
                            setBorrowReturnDate(d.toISOString().split("T")[0]);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0369a1] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#025a8a] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Wrench className="h-3.5 w-3.5" />
                          Borrow Tool
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Standalone Tool Checkout Modal */}
            {selectedToolForCheckout && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
                <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 my-8">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <div className="text-xs font-semibold uppercase text-sky-600">Tool Checkout</div>
                      <h3 className="text-lg font-bold text-tl-navy">{selectedToolForCheckout.name}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedToolForCheckout(null)}
                      className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleStandaloneBorrowSubmit} className="mt-4 space-y-4">
                    {borrowError && (
                      <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                        {borrowError}
                      </div>
                    )}

                    {/* Category Selection in Modal */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Borrower Category *</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBorrowUserType("student")}
                          className={`p-2 rounded-lg text-xs font-semibold border ${
                            borrowUserType === "student"
                              ? "bg-sky-50 border-[#0369a1] text-[#0369a1]"
                              : "bg-white border-slate-200 text-slate-600"
                          }`}
                        >
                          🎓 AU Student
                        </button>
                        <button
                          type="button"
                          onClick={() => setBorrowUserType("other")}
                          className={`p-2 rounded-lg text-xs font-semibold border ${
                            borrowUserType === "other"
                              ? "bg-sky-50 border-[#0369a1] text-[#0369a1]"
                              : "bg-white border-slate-200 text-slate-600"
                          }`}
                        >
                          🏢 Other / Faculty
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Priya Sharma"
                          value={borrowerName}
                          onChange={(e) => setBorrowerName(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          {borrowUserType === "student" ? "AU Email (@ahduni.edu.in) *" : "Contact Email *"}
                        </label>
                        <input
                          type="email"
                          required
                          placeholder={borrowUserType === "student" ? "priya@ahduni.edu.in" : "email@domain.com"}
                          value={borrowerEmail}
                          onChange={(e) => setBorrowerEmail(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    {borrowUserType === "student" ? (
                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                            Enrollment No. (AU ID) *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="AU2100456"
                            value={borrowEnrollment}
                            onChange={(e) => setBorrowEnrollment(e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Course Code *</label>
                          <input
                            type="text"
                            required
                            placeholder="ENR201"
                            value={borrowCourse}
                            onChange={(e) => setBorrowCourse(e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Year of Study *</label>
                          <select
                            value={borrowYear}
                            onChange={(e) => setBorrowYear(e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none"
                          >
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                            <option value="Postgraduate">Postgraduate</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Section Number *</label>
                          <input
                            type="text"
                            required
                            placeholder="Section A"
                            value={borrowSection}
                            onChange={(e) => setBorrowSection(e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Faculty Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Prof. Deepak Sharma"
                            value={borrowFaculty}
                            onChange={(e) => setBorrowFaculty(e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Role / Title *</label>
                          <input
                            type="text"
                            required
                            placeholder="Faculty / Researcher"
                            value={borrowOtherRole}
                            onChange={(e) => setBorrowOtherRole(e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Mobile Phone *</label>
                          <input
                            type="tel"
                            required
                            placeholder="+91 98765 43210"
                            value={borrowOtherPhone}
                            onChange={(e) => setBorrowOtherPhone(e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Quantity (Max {selectedToolForCheckout.available}) *
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={selectedToolForCheckout.available}
                          value={borrowQty}
                          onChange={(e) => setBorrowQty(Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Expected Return Date *</label>
                        <input
                          type="date"
                          required
                          value={borrowReturnDate}
                          onChange={(e) => setBorrowReturnDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Project Name / Reference</label>
                      <input
                        type="text"
                        placeholder="e.g. Autonomous Drone / TL-2026-AGRI9201"
                        value={borrowProjectTitle}
                        onChange={(e) => setBorrowProjectTitle(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Intended Lab Bench Use</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Workbench 2 for oscilloscope waveform analysis"
                        value={borrowNotes}
                        onChange={(e) => setBorrowNotes(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedToolForCheckout(null)}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingBorrow}
                        className="rounded-lg bg-[#0369a1] px-5 py-2 text-xs font-semibold text-white hover:bg-[#025a8a] disabled:opacity-50"
                      >
                        {submittingBorrow ? "Processing..." : "Confirm & Check Out"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CURRENT RECORDS & ADMIN APPROVALS */}
        {activeTab === "records" && (
          <div className="space-y-8">
            {/* Active Tool Borrows & Return Condition */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-tl-navy">Tool Borrows &amp; Return Tracking</h2>
                  <p className="text-xs text-slate-500">
                    Admin Approval (YES/NO) and verification of equipment returned properly
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadDashboardData}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Refresh
                  </button>
                </div>
              </div>

              {borrows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  No tools have been borrowed yet.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Tool Item</th>
                          <th className="px-4 py-3 font-semibold">Borrower Info</th>
                          <th className="px-4 py-3 font-semibold">Project &amp; Due</th>
                          <th className="px-4 py-3 font-semibold">Admin Approval</th>
                          <th className="px-4 py-3 font-semibold">Return Condition</th>
                          <th className="px-4 py-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {borrows.map((b) => {
                          const currentApproval = b.approval_status || "PENDING";
                          const returnCondition = b.return_condition || (b.status === "returned" ? "RETURNED PROPERLY" : "NOT RETURNED / IN USE");

                          return (
                            <tr key={b.id} className="hover:bg-slate-50/70 transition">
                              <td className="px-4 py-3 font-medium text-slate-900">
                                <div className="font-bold text-slate-900">{b.item_name}</div>
                                <div className="text-xs text-slate-500">Qty: {b.quantity} • ID: {b.id}</div>
                              </td>

                              <td className="px-4 py-3 text-xs">
                                <div className="font-semibold text-slate-900">{b.borrower_name}</div>
                                <div className="text-slate-500">{b.borrower_email}</div>
                                {b.enrollment_number && (
                                  <div className="text-slate-400 font-mono text-[10px]">ID: {b.enrollment_number}</div>
                                )}
                              </td>

                              <td className="px-4 py-3 text-xs">
                                <div className="font-medium text-slate-700">{b.project_title}</div>
                                <div className="text-slate-400">Due: {b.expected_return_date}</div>
                              </td>

                              <td className="px-4 py-3 text-xs">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                    currentApproval === "YES"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : currentApproval === "NO"
                                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}
                                >
                                  {currentApproval === "YES" && <Check className="h-3 w-3" />}
                                  {currentApproval === "NO" && <X className="h-3 w-3" />}
                                  {currentApproval}
                                </span>
                              </td>

                              <td className="px-4 py-3 text-xs">
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    returnCondition === "RETURNED PROPERLY"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : returnCondition === "OVERDUE / DAMAGED"
                                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}
                                >
                                  {returnCondition}
                                </span>
                              </td>

                              <td className="px-4 py-3 text-right text-xs">
                                <div className="flex flex-col items-end gap-1.5">
                                  {/* Approval Toggle */}
                                  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
                                    <button
                                      type="button"
                                      onClick={() => handleToolBorrowApproval(b.id, "YES", returnCondition)}
                                      title="Approve borrow"
                                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                                        currentApproval === "YES" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"
                                      }`}
                                    >
                                      YES
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToolBorrowApproval(b.id, "NO", returnCondition)}
                                      title="Deny borrow"
                                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                                        currentApproval === "NO" ? "bg-rose-600 text-white" : "text-slate-600 hover:bg-slate-100"
                                      }`}
                                    >
                                      NO
                                    </button>
                                  </div>

                                  {/* Return Condition Toggle */}
                                  {returnCondition !== "RETURNED PROPERLY" ? (
                                    <button
                                      type="button"
                                      onClick={() => handleToolBorrowApproval(b.id, currentApproval, "RETURNED PROPERLY")}
                                      className="rounded bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold transition"
                                    >
                                      Mark Returned Properly
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleToolBorrowApproval(b.id, currentApproval, "NOT RETURNED / IN USE")}
                                      className="text-slate-400 hover:text-slate-600 text-[10px]"
                                    >
                                      Reopen / In Use
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Registered Projects & Admin Approval */}
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-tl-navy">Registered Projects &amp; Approvals</h2>
                <p className="text-xs text-slate-500">
                  Manage Admin Approval (YES / NO) synced directly to Google Sheet
                </p>
              </div>

              {projectsList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  No projects submitted yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectsList.map((p) => {
                    const currentApproval = p.approval_status || (p.status === "approved" ? "YES" : p.status === "rejected" ? "NO" : "PENDING");

                    return (
                      <div
                        key={p.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-[#0369a1] bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                              {p.reference_code}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                currentApproval === "YES"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : currentApproval === "NO"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              Approval: {currentApproval}
                            </span>
                          </div>

                          <h3 className="font-bold text-base text-tl-navy">{p.title}</h3>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {p.summary}
                          </p>

                          {p.user_type === "student" && p.enrollment_number && (
                            <div className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600 border border-slate-100 flex flex-wrap gap-x-3 gap-y-1">
                              <span><strong>ID:</strong> {p.enrollment_number}</span>
                              {p.course_code && <span><strong>Course:</strong> {p.course_code}</span>}
                              {p.faculty_name && <span><strong>Mentor:</strong> {p.faculty_name}</span>}
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <div className="text-slate-500">Lead: <span className="font-medium text-slate-700">{p.lead_name}</span></div>
                            <div className="text-[10px] text-slate-400">{new Date(p.created_at).toLocaleDateString()}</div>
                          </div>

                          {/* Admin YES / NO Approval Buttons */}
                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                            <span className="text-[10px] text-slate-500 px-1 font-semibold">Admin:</span>
                            <button
                              type="button"
                              onClick={() => handleProjectApproval(p.reference_code, "YES")}
                              className={`px-2 py-0.5 rounded text-xs font-bold transition ${
                                currentApproval === "YES"
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                              }`}
                            >
                              YES
                            </button>
                            <button
                              type="button"
                              onClick={() => handleProjectApproval(p.reference_code, "NO")}
                              className={`px-2 py-0.5 rounded text-xs font-bold transition ${
                                currentApproval === "NO"
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-700"
                              }`}
                            >
                              NO
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Modal for Mutating Workspace/Sheets Operations */}
        {confirmDialog?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
              <h3 className="text-base font-bold text-tl-navy">{confirmDialog.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {confirmDialog.description}
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  className="rounded-lg bg-[#0369a1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#025a8a]"
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-slate-500 border-t border-slate-200 pt-6">
          Tinkerers’ Lab · Ahmedabad University • Google Sheets Synchronized
        </footer>
      </main>
    </div>
  );
}
