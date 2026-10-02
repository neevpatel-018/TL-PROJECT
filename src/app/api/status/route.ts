import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/mock-db";
import firebaseConfig from "../../../../firebase-applet-config.json";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const geminiKey = process.env.GEMINI_API_KEY || "";

  return NextResponse.json({
    status: "ok",
    services: {
      supabase: {
        configured: isSupabaseConfigured(),
        urlConfigured: Boolean(supabaseUrl && !supabaseUrl.includes("YOUR_PROJECT")),
        anonKeyConfigured: Boolean(supabaseAnon && !supabaseAnon.includes("YOUR_SUPABASE")),
        serviceRoleKeyConfigured: Boolean(supabaseService && !supabaseService.includes("YOUR_SUPABASE")),
      },
      googleWorkspace: {
        configured: Boolean(firebaseConfig?.projectId && firebaseConfig?.apiKey),
        projectId: firebaseConfig?.projectId || "",
        scopesConfigured: true,
      },
      geminiAi: {
        configured: Boolean(geminiKey && geminiKey !== "MY_GEMINI_API_KEY"),
      },
    },
    timestamp: new Date().toISOString(),
  });
}
