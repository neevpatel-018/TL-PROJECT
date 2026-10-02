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
  AlertCircle
} from "lucide-react";

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
  project_title: string;
  item_id: string;
  item_name: string;
  quantity: number;
  borrowed_date: string;
  expected_return_date: string;
  status: "active" | "returned" | "overdue";
  notes?: string;
};

type SelectedToolRequest = {
  item_id: string;
  item_name: string;
  quantity: number;
  expected_return_date: string;
};

export default function LabPortalDashboard() {
  const [activeTab, setActiveTab] = useState<"register" | "borrow" | "records">("register");

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

  useEffect(() => {
    loadDashboardData();
  }, []);

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
          organization: userType === "student" ? "Ahmedabad University" : (otherOrganization.trim() || organization.trim()),
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

      setProjectSuccessRef(data.reference || "SUBMITTED");
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

  // Return tool
  async function handleReturnTool(borrowId: string) {
    try {
      const res = await fetch("/api/tools/borrow", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ borrow_id: borrowId }),
      });
      if (res.ok) {
        loadDashboardData();
      }
    } catch {
      // Ignore
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
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 sm:inline-flex border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Lab Desk Active
            </span>
            <Link
              href="/login"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Staff Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
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
            <div className="mt-1 text-xs text-slate-500">Proposals registered in lab system</div>
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
            <div className="mt-1 text-xs text-slate-500">Currently in maker use</div>
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
            <span>3. Current Records &amp; Status</span>
            {activeBorrows.length > 0 && (
              <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 font-bold">
                {activeBorrows.length} borrowed
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

                      {/* If Student: Enrollment Num, Course Code, Year, Faculty, Section */}
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
                        /* If Other: Role, Organization, Phone, ID, Purpose */
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

            {/* Standalone Tool Checkout Modal with full AU student / other details */}
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

        {/* TAB 3: CURRENT RECORDS & STATUS */}
        {activeTab === "records" && (
          <div className="space-y-8">
            {/* Active Tool Borrows */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-tl-navy">Active Tool Borrows</h2>
                  <p className="text-xs text-slate-500">Currently checked out tools and due dates</p>
                </div>
                <button
                  type="button"
                  onClick={loadDashboardData}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Refresh
                </button>
              </div>

              {borrows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  No tools have been borrowed yet.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Tool Item</th>
                          <th className="px-5 py-3 font-semibold">Borrower</th>
                          <th className="px-5 py-3 font-semibold">Project</th>
                          <th className="px-5 py-3 font-semibold">Borrowed</th>
                          <th className="px-5 py-3 font-semibold">Expected Return</th>
                          <th className="px-5 py-3 font-semibold">Status</th>
                          <th className="px-5 py-3 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {borrows.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-5 py-3.5 font-medium text-slate-900">
                              <div>{b.item_name}</div>
                              <div className="text-xs text-slate-400">Qty: {b.quantity}</div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="text-slate-900 font-medium">{b.borrower_name}</div>
                              <div className="text-xs text-slate-400">{b.borrower_email}</div>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-600">{b.project_title}</td>
                            <td className="px-5 py-3.5 text-xs text-slate-500">{b.borrowed_date}</td>
                            <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">
                              {b.expected_return_date}
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  b.status === "active"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                {b.status === "active" ? "In Use" : "Returned"}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              {b.status === "active" && (
                                <button
                                  type="button"
                                  onClick={() => handleReturnTool(b.id)}
                                  className="rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-3 py-1.5 text-xs font-semibold text-slate-700 transition border border-slate-200"
                                >
                                  Return Tool
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Registered Projects in Portal */}
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-tl-navy">Registered Projects</h2>
                <p className="text-xs text-slate-500">All submitted student &amp; maker lab proposals</p>
              </div>

              {projectsList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  No projects submitted yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectsList.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-[#0369a1] bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                          {p.reference_code}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                          {p.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-tl-navy">{p.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {p.summary}
                      </p>

                      {p.user_type === "student" && p.enrollment_number && (
                        <div className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600 border border-slate-100 flex flex-wrap gap-x-3 gap-y-1">
                          <span><strong>Enrollment:</strong> {p.enrollment_number}</span>
                          {p.course_code && <span><strong>Course:</strong> {p.course_code}</span>}
                          {p.faculty_name && <span><strong>Mentor:</strong> {p.faculty_name}</span>}
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div>
                          Lead: <span className="font-medium text-slate-700">{p.lead_name}</span>
                        </div>
                        <div>{new Date(p.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-slate-500 border-t border-slate-200 pt-6">
          Tinkerers’ Lab · Ahmedabad University
        </footer>
      </main>
    </div>
  );
}
