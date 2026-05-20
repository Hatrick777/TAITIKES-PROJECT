import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

const ADMIN_PASSWORD = "ASHURABOSS";

function checkAdmin(req: Request) {
  return req.headers.get("x-admin-token") === ADMIN_PASSWORD;
}

// Public GET — called by frontend to check maintenance status
export async function GET() {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "maintenance")
    .single();

  if (!data) return NextResponse.json({ enabled: false, message: "" });

  const val = data.value as { enabled: boolean; message: string };
  return NextResponse.json({ enabled: val.enabled ?? false, message: val.message ?? "" });
}

// Admin POST — update maintenance mode
export async function POST(req: Request) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { enabled, message } = await req.json();

  const { error } = await supabase
    .from("app_settings")
    .upsert(
      { key: "maintenance", value: { enabled: !!enabled, message: (message ?? "").trim() }, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
