import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/mock-db";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {}
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete("tl_session_role");
  response.cookies.delete("tl_session_email");
  response.cookies.delete("tl_session_uid");
  response.cookies.delete("tl_demo_role");
  response.cookies.delete("tl_demo_user");

  return response;
}
