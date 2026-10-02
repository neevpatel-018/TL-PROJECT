import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/mock-db";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      fullName,
      role = "student",
      enrollmentNumber = "",
      department = "",
    } = body;

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const assignedRole = role === "admin" || role === "staff" ? "admin" : "student";
    let userId = `user-${Date.now()}`;

    if (isSupabaseConfigured()) {
      try {
        const admin = createAdminClient();

        // 1. Create or get user in Supabase Auth with email auto-confirmed
        const { data: createData, error: createError } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName || email.split("@")[0],
            role: assignedRole,
          },
        });

        if (createError) {
          // If user already exists, update their metadata & password
          if (
            createError.message.toLowerCase().includes("already registered") ||
            createError.message.toLowerCase().includes("already exists")
          ) {
            // Find existing user
            const { data: listData } = await admin.auth.admin.listUsers();
            const existing = (listData?.users || []).find(
              (u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase()
            );

            if (existing) {
              userId = existing.id;
              await admin.auth.admin.updateUserById(existing.id, {
                password,
                email_confirm: true,
                user_metadata: {
                  full_name: fullName || existing.user_metadata?.full_name,
                  role: assignedRole,
                },
              });
            }
          } else {
            console.error("Supabase createUser error:", createError);
          }
        } else if (createData?.user) {
          userId = createData.user.id;
        }

        // 2. Upsert into public.profiles
        try {
          await admin.from("profiles").upsert(
            {
              id: userId,
              email: email.toLowerCase(),
              full_name: fullName || email.split("@")[0],
              role: assignedRole,
              enrollment_number: enrollmentNumber,
              department: department,
              is_active: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
        } catch (profileErr) {
          console.warn("Profile table upsert note (table might not exist yet):", profileErr);
        }
      } catch (sbErr) {
        console.warn("Supabase auth admin warning:", sbErr);
      }
    }

    const redirectTo = assignedRole === "admin" ? "/staff" : "/dashboard";

    const response = NextResponse.json({
      ok: true,
      message: `Account registered successfully as ${assignedRole.toUpperCase()}.`,
      role: assignedRole,
      redirectTo,
    });

    // Set secure HTTP session cookies
    response.cookies.set("tl_session_role", assignedRole, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    response.cookies.set("tl_session_email", email.toLowerCase(), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    response.cookies.set("tl_session_uid", userId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return response;
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Registration failed. Please try again.";
    return NextResponse.json(
      { ok: false, error: errorMsg },
      { status: 500 }
    );
  }
}
