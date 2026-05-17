import { NextResponse } from "next/server";
import { getUserByPin, createSession } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { pin, deviceToken: clientDevice } = await req.json();
    if (!pin || !/^\d{7}$/.test(pin))
      return NextResponse.json({ error: "Invalid PIN" }, { status: 400 });

    const user = await getUserByPin(pin);
    if (!user) return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
    if (user.banned) return NextResponse.json({ error: "BANNED" }, { status: 403 });

    // One-device check
    if (user.device_token && clientDevice && user.device_token !== clientDevice) {
      return NextResponse.json({ error: "This account is logged in on another device" }, { status: 409 });
    }

    const deviceToken = clientDevice || Math.random().toString(36).slice(2) + Date.now();
    const sessionToken = await createSession(user.user_id, deviceToken);

    const cookieStore = await cookies();
    cookieStore.set("ashura_session", sessionToken, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 });
    cookieStore.set("ashura_device", deviceToken, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 });

    return NextResponse.json({ userId: user.user_id, username: user.username, sessionToken, deviceToken });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
