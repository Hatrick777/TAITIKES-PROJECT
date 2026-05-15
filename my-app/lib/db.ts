import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== TYPES =====
export interface User {
  user_id: string;    // 8-digit
  username: string;
  pin: string;        // 7-digit
  banned: boolean;
  device_token: string | null;
  created_at: string;
}

export interface Session {
  token: string;
  user_id: string;
  device_token: string;
}

export interface ChatThread {
  thread_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id?: string;
  thread_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

// ===== USERS =====
export async function getUsers(): Promise<User[]> {
  const { data } = await supabase.from("users").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function getUserByPin(pin: string): Promise<User | null> {
  const { data } = await supabase.from("users").select("*").eq("pin", pin).single();
  return data ?? null;
}

export async function getUserById(userId: string): Promise<User | null> {
  const { data } = await supabase.from("users").select("*").eq("user_id", userId).single();
  return data ?? null;
}

export async function createUser(username: string, pin: string): Promise<User> {
  // Check PIN unique
  const { data: existing } = await supabase.from("users").select("pin").eq("pin", pin).single();
  if (existing) throw new Error("PIN already in use");

  // Generate unique 8-digit userId
  let userId: string;
  while (true) {
    userId = String(Math.floor(10000000 + Math.random() * 90000000));
    const { data: idCheck } = await supabase.from("users").select("user_id").eq("user_id", userId).single();
    if (!idCheck) break;
  }

  const { data, error } = await supabase
    .from("users")
    .insert({ user_id: userId, username, pin, banned: false, device_token: null })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteUser(userId: string): Promise<void> {
  await supabase.from("users").delete().eq("user_id", userId);
}

// ===== SESSIONS =====
export async function createSession(userId: string, deviceToken: string): Promise<string> {
  // Remove old sessions for this user
  await supabase.from("sessions").delete().eq("user_id", userId);

  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36);

  const { error } = await supabase.from("sessions").insert({
    token,
    user_id: userId,
    device_token: deviceToken,
  });
  if (error) throw new Error(error.message);

  // Update device token on user
  await updateUser(userId, { device_token: deviceToken });
  return token;
}

export async function getUserBySession(token: string): Promise<User | null> {
  const { data: session } = await supabase
    .from("sessions")
    .select("user_id")
    .eq("token", token)
    .single();
  if (!session) return null;
  return getUserById(session.user_id);
}

export async function destroySession(token: string): Promise<void> {
  await supabase.from("sessions").delete().eq("token", token);
}

// ===== CHAT HISTORY =====
export async function getUserThreads(userId: string): Promise<ChatThread[]> {
  const { data } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  return data ?? [];
}

export async function upsertThread(thread: Omit<ChatThread, "created_at">): Promise<void> {
  await supabase.from("chat_threads").upsert(
    { ...thread, updated_at: new Date().toISOString() },
    { onConflict: "thread_id,user_id" }
  );
}

export async function getThreadMessages(threadId: string, userId: string): Promise<ChatMessage[]> {
  const { data } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function saveMessage(msg: ChatMessage): Promise<void> {
  await supabase.from("chat_messages").insert(msg);
}

export async function deleteThread(threadId: string, userId: string): Promise<void> {
  await supabase.from("chat_threads").delete().eq("thread_id", threadId).eq("user_id", userId);
  await supabase.from("chat_messages").delete().eq("thread_id", threadId).eq("user_id", userId);
}
