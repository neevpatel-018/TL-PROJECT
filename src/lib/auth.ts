import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "./mock-db";

export type AuthUser = {
  id: string;
  email?: string;
  role?: "student" | "staff" | "admin";
};

export async function getSignedInUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const demoRole = cookieStore.get("tl_demo_role")?.value;
  const demoUser = cookieStore.get("tl_demo_user")?.value;

  if (demoRole && demoUser) {
    return {
      id: "demo-" + demoRole + "-id",
      email: demoUser,
      role: demoRole as "student" | "staff" | "admin",
    };
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return {
          id: user.id,
          email: user.email,
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
  if (!user) redirect("/login");

  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.is_active || !["staff", "admin"].includes(profile.role)) {
        redirect("/dashboard");
      }
      return { user, role: profile.role as "staff" | "admin" };
    } catch {
      redirect("/dashboard");
    }
  }

  // If in demo mode and not staff
  redirect("/dashboard");
}
