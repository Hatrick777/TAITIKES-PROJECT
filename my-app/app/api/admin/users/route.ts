import { NextResponse } from "next/server";
import { getUsers, updateUser, deleteUser } from "@/lib/db";

const ADMIN_PASSWORD = "ASHURABOSS";

function checkAdmin(req: Request) {
  return req.headers.get("x-admin-token") === ADMIN_PASSWORD;
}

export async function GET(req: Request) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const users = await getUsers();
  return NextResponse.json({ users: users.map((u) => ({
    userId: u.user_id, username: u.username, pin: u.pin, banned: u.banned, createdAt: u.created_at,
  }))});
}

export async function POST(req: Request) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action, userId, updates } = await req.json();

  if (action === "ban") {
    await updateUser(userId, { banned: true, device_token: null });
    return NextResponse.json({ ok: true });
  }
  if (action === "unban") {
    await updateUser(userId, { banned: false });
    return NextResponse.json({ ok: true });
  }
  if (action === "edit") {
    const allowed: Record<string, unknown> = {};
    if (updates.username) allowed.username = updates.username;
    if (updates.pin && /^\d{7}$/.test(updates.pin)) allowed.pin = updates.pin;
    await updateUser(userId, allowed);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(req: Request) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = await req.json();
  await deleteUser(userId);
  return NextResponse.json({ ok: true });
}
