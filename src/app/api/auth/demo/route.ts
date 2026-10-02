import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body: { role?: string; action?: string; email?: string } = {};
  try {
    body = await req.json();
  } catch {
    // Empty body
  }

  const res = NextResponse.json({ ok: true });

  if (body.action === "logout") {
    res.cookies.delete("tl_demo_role");
    res.cookies.delete("tl_demo_user");
    return res;
  }

  const role = body.role || "staff";
  const email = body.email || (role === "staff" ? "staff@ahduni.edu.in" : "student@ahduni.edu.in");

  res.cookies.set("tl_demo_role", role, { path: "/", maxAge: 60 * 60 * 24 });
  res.cookies.set("tl_demo_user", email, { path: "/", maxAge: 60 * 60 * 24 });

  return res;
}
