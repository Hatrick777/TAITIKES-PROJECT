import { NextResponse } from "next/server";
import { getUserBySession, getThreadMessages, saveMessage } from "@/lib/db";
import { cookies } from "next/headers";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ashura_session")?.value;
  if (!token) return null;
  return getUserBySession(token);
}

// GET /api/chats/[threadId] — load messages for a thread
export async function GET(req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { threadId } = await params;
  const messages = await getThreadMessages(threadId, user.user_id);
  return NextResponse.json({ messages });
}

// POST /api/chats/[threadId] — save a message
export async function POST(req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { threadId } = await params;
  const { role, content } = await req.json();
  if (!role || !content) return NextResponse.json({ error: "role and content required" }, { status: 400 });
  await saveMessage({ thread_id: threadId, user_id: user.user_id, role, content });
  return NextResponse.json({ ok: true });
}
