import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "./mock-db";

export type AuthUser = {
  id: string;
  email?: string;
  role?: "student" | "staff" | "admin";
  full_name?: string;
};

export async function getSignedInUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();

  // 1. Check custom session cookies
  const sessionRole = cookieStore.get("tl_session_role")?.value;
  const sessionEmail = cookieStore.get("tl_session_email")?.value;
  const sessionUid = cookieStore.get("tl_session_uid")?.value;

  if (sessionRole && sessionEmail) {
    return {
      id: sessionUid || "user-" + sessionRole + "-id",
      email: sessionEmail,
      role: sessionRole as "student" | "staff" | "admin",
    };
  }

  // 2. Check demo cookies
  const demoRole = cookieStore.get("tl_demo_role")?.value;
  const demoUser = cookieStore.get("tl_demo_user")?.value;

  if (demoRole && demoUser) {
    return {
      id: "demo-" + demoRole + "-id",
      email: demoUser,
      role: demoRole as "student" | "staff" | "admin",
    };
  }

  // 3. Check Supabase Auth
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let role: "student" | "staff" | "admin" =
          (user.user_metadata?.role as "student" | "staff" | "admin" | undefined) || "student";

        try {
          const admin = createAdminClient();
          const { data: profile } = await admin
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          if (profile?.role) {
            role = profile.role as "student" | "staff" | "admin";
          }
        } catch {
          // Keep metadata role
        }

        return {
          id: user.id,
          email: user.email,
          role,
          full_name: user.user_metadata?.full_name,
        };
      }
    } catch {
      return null;
    }
  }

  return null;
}

export async function requireStaff() {
  const cookieStore = await cookies();

  const sessionRole = cookieStore.get("tl_session_role")?.value;
  const sessionEmail = cookieStore.get("tl_session_email")?.value;
  if (sessionRole === "staff" || sessionRole === "admin") {
    return {
      user: {
        id: cookieStore.get("tl_session_uid")?.value || "admin-session-id",
        email: sessionEmail || "admin@ahduni.edu.in",
      },
      role: sessionRole as "staff" | "admin",
    };
  }

  const demoRole = cookieStore.get("tl_demo_role")?.value;
  const demoUser = cookieStore.get("tl_demo_user")?.value;
  if (demoRole === "staff" || demoRole === "admin") {
    return {
      user: {
        id: "demo-" + demoRole + "-id",
        email: demoUser || "staff@ahduni.edu.in",
      },
      role: demoRole as "staff" | "admin",
    };
  }

  const user = await getSignedInUser();
  if (!user) redirect("/login?role=admin");

  if (user.role === "staff" || user.role === "admin") {
    return { user, role: user.role };
  }

  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.is_active && ["staff", "admin"].includes(profile.role)) {
        return { user, role: profile.role as "staff" | "admin" };
      }
    } catch {}
  }

  redirect("/dashboard");
}
