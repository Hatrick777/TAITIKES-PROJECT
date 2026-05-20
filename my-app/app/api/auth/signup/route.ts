import { NextResponse } from "next/server";
import { createUser, createSession } from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { username, pin } = await req.json();
    if (!username || !pin) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (pin.length !== 7 || !/^\d{7}$/.test(pin))
      return NextResponse.json({ error: "PIN must be exactly 7 digits" }, { status: 400 });
    if (username.trim().length < 2)
      return NextResponse.json({ error: "Username too short" }, { status: 400 });

    const user = await createUser(username.trim(), pin);
    const deviceToken = Math.random().toString(36).slice(2) + Date.now();
    const sessionToken = await createSession(user.user_id, deviceToken);

    const cookieStore = await cookies();
    cookieStore.set("ashura_session", sessionToken, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 });
    cookieStore.set("ashura_device", deviceToken, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 });

    return NextResponse.json({ userId: user.user_id, username: user.username, sessionToken, deviceToken });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
