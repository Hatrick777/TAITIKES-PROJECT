"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Assistant } from "./assistant";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) { router.replace("/login"); }
        else { setReady(true); }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full animate-ping" style={{ background: "rgba(200,0,0,0.5)" }} />
          <p className="text-xs text-zinc-700 uppercase tracking-widest">Authenticating...</p>
        </div>
      </div>
    );
  }

  return <Assistant />;
}
