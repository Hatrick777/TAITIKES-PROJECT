import { NextResponse } from "next/server";
import { getUserBySession, getUserThreads, upsertThread, deleteThread, updateThreadTitle } from "@/lib/db";
import { cookies } from "next/headers";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ashura_session")?.value;
  if (!token) return null;
  return getUserBySession(token);
}

// GET /api/chats — list user threads
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const threads = await getUserThreads(user.user_id);
  return NextResponse.json({ threads });
}

// POST /api/chats — create thread
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { threadId, title } = await req.json();
  if (!threadId) return NextResponse.json({ error: "threadId required" }, { status: 400 });
  await upsertThread({ thread_id: threadId, user_id: user.user_id, title: title ?? "New Chat", updated_at: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}

// PATCH /api/chats — rename thread title (user edits)
export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { threadId, title } = await req.json();
  if (!threadId || !title?.trim()) return NextResponse.json({ error: "threadId and title required" }, { status: 400 });
  await updateThreadTitle(threadId, user.user_id, title.trim());
  return NextResponse.json({ ok: true });
}

// DELETE /api/chats — delete thread
export async function DELETE(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { threadId } = await req.json();
  if (!threadId) return NextResponse.json({ error: "threadId required" }, { status: 400 });
  await deleteThread(threadId, user.user_id);
  return NextResponse.json({ ok: true });
}
