import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/mock-db";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    let detectedRole: "student" | "admin" | "staff" = role || "student";
    let userId = "";

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

        if (signInError) {
          // Check if admin client can check user existence
          try {
            const admin = createAdminClient();
            const { data: listData } = await admin.auth.admin.listUsers();
            const found = (listData?.users || []).find(
              (u: { email?: string }) => u.email?.toLowerCase() === cleanEmail
            );

            if (!found) {
              return NextResponse.json(
                {
                  ok: false,
                  error:
                    "Account not found. Please click 'Create Account' tab above to register first.",
                },
                { status: 401 }
              );
            } else {
              return NextResponse.json(
                {
                  ok: false,
                  error:
                    "Incorrect password. Please verify your credentials or register a new password.",
                },
                { status: 401 }
              );
            }
          } catch {
            return NextResponse.json(
              {
                ok: false,
                error: signInError.message || "Invalid email or password.",
              },
              { status: 401 }
            );
          }
        }

        if (signInData?.user) {
          userId = signInData.user.id;
          detectedRole =
            (signInData.user.user_metadata?.role as "student" | "admin" | "staff" | undefined) || detectedRole;

          // Check profiles table for role
          try {
            const admin = createAdminClient();
            const { data: profile } = await admin
              .from("profiles")
              .select("role")
              .eq("id", userId)
              .maybeSingle();

            if (profile?.role) {
              detectedRole = profile.role as "student" | "admin" | "staff";
            }
          } catch {
            // Keep existing role
          }
        }
      } catch (err: unknown) {
        console.warn("Supabase login error:", err);
      }
    } else {
      // Fallback mode: check if it's admin or student
      if (cleanEmail.includes("admin") || cleanEmail.includes("staff")) {
        detectedRole = "admin";
      } else {
        detectedRole = "student";
      }
      userId = `local-${detectedRole}-${Date.now()}`;
    }

    const effectiveRole =
      detectedRole === "admin" || detectedRole === "staff" ? "admin" : "student";
    const redirectTo = effectiveRole === "admin" ? "/staff" : "/dashboard";

    const response = NextResponse.json({
      ok: true,
      role: effectiveRole,
      email: cleanEmail,
      redirectTo,
    });

    // Set persistent session cookies
    response.cookies.set("tl_session_role", effectiveRole, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    response.cookies.set("tl_session_email", cleanEmail, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    if (userId) {
      response.cookies.set("tl_session_uid", userId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      });
    }

    return response;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Sign in failed.";
    return NextResponse.json(
      { ok: false, error: errorMsg },
      { status: 500 }
    );
  }
}
