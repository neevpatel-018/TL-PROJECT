"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Wrench,
  Trash2,
  AlertCircle
} from "lucide-react";

type ToolItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  location: string;
  available: number;
};

type SelectedTool = {
  item_id: string;
  item_name: string;
  quantity: number;
  expected_return_date: string;
};

export default function RegisterProject() {
  const [userType, setUserType] = useState<"student" | "other">("student");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const organization = "Ahmedabad University";
  const [teamMembers, setTeamMembers] = useState("");

  // Student details
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("3rd Year");
  const [facultyName, setFacultyName] = useState("");
  const [sectionNumber, setSectionNumber] = useState("Section A");

  // Other details
  const [otherRole, setOtherRole] = useState("Faculty / Research Scholar");
  const [otherOrganization, setOtherOrganization] = useState("");
  const [otherPhone, setOtherPhone] = useState("");
  const [otherIdNumber, setOtherIdNumber] = useState("");
  const [otherPurpose, setOtherPurpose] = useState("");

  // Tool borrowing options
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [includeTools, setIncludeTools] = useState(false);
  const [selectedTools, setSelectedTools] = useState<SelectedTool[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successReference, setSuccessReference] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tools/borrow")
      .then((r) => r.json())
      .then((d) => {
        if (d.tools) setTools(d.tools);
      })
      .catch(() => {});
  }, []);

  const isAuEmail = leadEmail.toLowerCase().includes("@ahduni.edu");

  function resetForm() {
    setTitle("");
    setDescription("");
    setProblemStatement("");
    setLeadName("");
    setLeadEmail("");
    setTeamMembers("");
    setEnrollmentNumber("");
    setCourseCode("");
    setFacultyName("");
    setOtherPhone("");
    setOtherIdNumber("");
    setOtherPurpose("");
    setSelectedTools([]);
    setIncludeTools(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (description.trim().length < 20) {
      setError("Project description must be at least 20 characters.");
      return;
    }

    if (userType === "student" && !enrollmentNumber.trim()) {
      setError("Enrollment number is required for Ahmedabad University students.");
      return;
    }

    if (userType === "other" && (!otherPhone.trim() || !otherRole.trim())) {
      setError("Please provide your contact phone and role details.");
      return;
    }

    setSubmitting(true);

    const fullSummary = problemStatement.trim()
      ? `${description.trim()}\n\nProblem Statement and Objectives:\n${problemStatement.trim()}`
      : description.trim();

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
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
          borrowed_tools: includeTools ? selectedTools : [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit project. Please try again.");
        setSubmitting(false);
        return;
      }

      setSuccessReference(data.reference || "SUBMITTED");
      resetForm();
      setSubmitting(false);
    } catch {
      setError("An unexpected network error occurred. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <main className="mx-auto max-w-3xl px-5 py-10">
        {/* Navigation link */}
        <div>
          <Link
            href="/"
            className="text-sm font-medium text-sky-600 transition hover:text-sky-800"
          >
            ← Home / Dashboard
          </Link>
        </div>

        {/* Header */}
        <header className="mt-8">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Tinkerers’ Lab · Ahmedabad University
          </p>
          <h1 className="mt-2 text-[30px] font-bold leading-[36px] text-tl-navy">
            Register a project &amp; borrow tools
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Submit your project proposal for review by Tinkerers’ Lab. Verified Ahmedabad University students
            and affiliated researchers can register proposals and request lab equipment directly in this form.
          </p>
        </header>

        {/* Registration Form Card */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {successReference ? (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800"
            >
              <h2 className="text-lg font-semibold text-emerald-900">
                Project proposal &amp; tool request submitted successfully!
              </h2>
              <p className="mt-2 text-sm text-emerald-700">
                Your proposal has been logged for staff review. Your project reference code is:
              </p>
              <div className="my-4 inline-block rounded-lg border border-emerald-300 bg-white px-4 py-2 font-mono text-base font-bold text-emerald-900">
                {successReference}
              </div>
              <p className="text-xs text-emerald-600">
                Please keep this reference code for your records and for follow-up with Tinkerers’
                Lab mentors.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setSuccessReference(null)}
                  className="rounded-lg bg-[#0369a1] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#025a8a]"
                >
                  Submit another proposal
                </button>
                <Link
                  href="/"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  View on Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Lead Applicant Category */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#0369a1]">
                  Applicant Category *
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
                  {userType === "student"
                    ? "Student Verification & Academic Details"
                    : "Applicant & Organization Details"}
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="lead-name"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Lead name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="lead-name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Full name"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lead-email"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      {userType === "student" ? "AU Student Email (AU ID Verified) *" : "Lead email *"}
                    </label>
                    <input
                      id="lead-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder={userType === "student" ? "you@ahduni.edu.in" : "you@example.com"}
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                    />
                    {userType === "student" && leadEmail && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs">
                        {isAuEmail ? (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Verified Ahmedabad University domain
                          </span>
                        ) : (
                          <span className="text-amber-700">
                            Please use your @ahduni.edu.in AU email ID
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {userType === "student" ? (
                    <>
                      <div>
                        <label
                          htmlFor="enrollment-number"
                          className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                          Enrollment Number (AU ID) <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="enrollment-number"
                          type="text"
                          required
                          placeholder="e.g. AU2100456"
                          value={enrollmentNumber}
                          onChange={(e) => setEnrollmentNumber(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="course-code"
                          className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                          Course Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="course-code"
                          type="text"
                          required
                          placeholder="e.g. ENR201, CSE301, DES102"
                          value={courseCode}
                          onChange={(e) => setCourseCode(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="year-of-study"
                          className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                          Year of Study <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="year-of-study"
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
                        <label
                          htmlFor="section-number"
                          className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                          Section Number / Division <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="section-number"
                          type="text"
                          required
                          placeholder="e.g. Section A, Div 1"
                          value={sectionNumber}
                          onChange={(e) => setSectionNumber(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          htmlFor="faculty-name"
                          className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                          Faculty Mentor / Guide Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="faculty-name"
                          type="text"
                          required
                          placeholder="e.g. Prof. Deepak Sharma"
                          value={facultyName}
                          onChange={(e) => setFacultyName(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label
                          htmlFor="other-role"
                          className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                          Role / Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="other-role"
                          type="text"
                          required
                          placeholder="Faculty, Research Scholar, Incubatee"
                          value={otherRole}
                          onChange={(e) => setOtherRole(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="other-phone"
                          className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                          Contact Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="other-phone"
                          type="tel"
                          required
                          placeholder="+91 98765 43210"
                          value={otherPhone}
                          onChange={(e) => setOtherPhone(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          htmlFor="other-org"
                          className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                          Organization / Affiliation <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="other-org"
                          type="text"
                          required
                          placeholder="e.g. VentureStudio Incubator / Research Lab"
                          value={otherOrganization}
                          onChange={(e) => setOtherOrganization(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="other-id"
                          className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                          Official ID / Reference Number
                        </label>
                        <input
                          id="other-id"
                          type="text"
                          placeholder="e.g. EMP-9021"
                          value={otherIdNumber}
                          onChange={(e) => setOtherIdNumber(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="other-purpose"
                          className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                          Purpose of Lab Access
                        </label>
                        <input
                          id="other-purpose"
                          type="text"
                          placeholder="e.g. Prototype fabrication"
                          value={otherPurpose}
                          onChange={(e) => setOtherPurpose(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="team-members"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Team members (names and emails)
                    </label>
                    <textarea
                      id="team-members"
                      rows={2}
                      placeholder="Enter one team member per line"
                      value={teamMembers}
                      onChange={(e) => setTeamMembers(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Section 2: Project details */}
              <section aria-labelledby="project-details-heading" className="space-y-4 pt-4 border-t border-slate-100">
                <h2
                  id="project-details-heading"
                  className="text-lg font-semibold text-tl-navy"
                >
                  Project details
                </h2>

                <div>
                  <label
                    htmlFor="project-title"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Project title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="project-title"
                    type="text"
                    required
                    maxLength={150}
                    placeholder="Enter your project title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="project-description"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Project description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="project-description"
                    required
                    rows={4}
                    minLength={20}
                    maxLength={5000}
                    placeholder="Describe your project, how it works, and what you plan to build."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="problem-statement"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Problem statement and objectives
                  </label>
                  <textarea
                    id="problem-statement"
                    rows={2}
                    maxLength={3000}
                    placeholder="What problem does your project aim to solve?"
                    value={problemStatement}
                    onChange={(e) => setProblemStatement(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                  />
                </div>
              </section>

              {/* Section 3: Tool Borrowing Integration */}
              <section className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-tl-navy flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-[#0369a1]" />
                      Borrow Lab Tools for this Project
                    </h2>
                    <p className="text-xs text-slate-500">
                      Check out equipment, microcontrollers, or test benches simultaneously.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTools}
                      onChange={(e) => setIncludeTools(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0369a1]"></div>
                    <span className="ml-2 text-xs font-semibold text-slate-700">
                      {includeTools ? "Active" : "Add Tools"}
                    </span>
                  </label>
                </div>

                {includeTools && (
                  <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {tools.map((t) => {
                        const isSelected = selectedTools.some((st) => st.item_id === t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            disabled={t.available === 0}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedTools(selectedTools.filter((st) => st.item_id !== t.id));
                              } else {
                                const ret = new Date();
                                ret.setDate(ret.getDate() + 7);
                                setSelectedTools([
                                  ...selectedTools,
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
                                isSelected ? "bg-[#0369a1] text-white" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {isSelected ? "Selected ✓" : "+ Add"}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedTools.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <div className="text-xs font-bold text-slate-700">
                          Selected Tools for Checkout ({selectedTools.length}):
                        </div>
                        {selectedTools.map((st, idx) => (
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
                                  const next = [...selectedTools];
                                  next[idx].quantity = Math.max(1, Number(e.target.value));
                                  setSelectedTools(next);
                                }}
                                className="w-14 rounded border border-slate-300 px-1.5 py-1 text-center font-bold"
                              />

                              <label className="text-slate-500 ml-2">Due:</label>
                              <input
                                type="date"
                                value={st.expected_return_date}
                                onChange={(e) => {
                                  const next = [...selectedTools];
                                  next[idx].expected_return_date = e.target.value;
                                  setSelectedTools(next);
                                }}
                                className="rounded border border-slate-300 px-1.5 py-1"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedTools(selectedTools.filter((x) => x.item_id !== st.item_id))
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
                  Submitting this form sends your proposal for review. Submission does not mean your
                  project has been approved. You can request tools or materials through the portal if
                  that feature is enabled.
                </p>
              </div>

              {/* Submit button */}
              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-[#0369a1] py-3 px-4 text-sm font-semibold text-white transition hover:bg-[#025a8a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Submitting project..."
                    : includeTools && selectedTools.length > 0
                    ? `Submit Project & Borrow ${selectedTools.length} Tool(s)`
                    : "Submit project"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-slate-500">
          Tinkerers’ Lab · Ahmedabad University
        </footer>
      </main>
    </div>
  );
}
