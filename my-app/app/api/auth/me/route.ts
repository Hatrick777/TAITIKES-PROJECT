import { NextResponse } from "next/server";
import { getUserBySession, destroySession } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ashura_session")?.value;
  if (!token) return NextResponse.json({ user: null });
  const user = await getUserBySession(token);
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { userId: user.user_id, username: user.username, banned: user.banned } });
}

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ashura_session")?.value;
  if (token) await destroySession(token);
  cookieStore.delete("ashura_session");
  cookieStore.delete("ashura_device");
  return NextResponse.json({ ok: true });
}
