"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin !== confirmPin) { setError("PINs do not match"); return; }
    if (pin.length !== 7) { setError("PIN must be 7 digits"); return; }
    if (username.trim().length < 2) { setError("Username must be at least 2 characters"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), pin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      localStorage.setItem("ashura_device", data.sessionToken);
      localStorage.setItem("ashura_user", JSON.stringify({ userId: data.userId, username: data.username }));
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handlePinInput = (val: string, setter: (v: string) => void) => {
    if (/^\d{0,7}$/.test(val)) setter(val);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#080808", backgroundImage: "linear-gradient(rgba(200,0,0,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(200,0,0,0.04) 1px,transparent 1px)", backgroundSize: "40px 40px" }}>
      <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%,rgba(200,0,0,0.08) 0%,transparent 70%)" }} />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src="https://iili.io/BmkTxGS.png" alt="ASHURA" className="size-16 rounded-full"
            style={{ boxShadow: "0 0 30px rgba(200,0,0,0.5)" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <h1 className="text-2xl font-black tracking-widest uppercase"
            style={{ background: "linear-gradient(135deg,#ff0033,#cc0000)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 10px rgba(255,0,51,0.4))" }}>
            ASHURA
          </h1>
          <p className="text-xs text-zinc-600 tracking-widest uppercase">Create Your Account</p>
        </div>

        <form onSubmit={handleSignup} className="rounded-2xl border p-6 space-y-4"
          style={{ background: "rgba(10,10,10,0.95)", borderColor: "rgba(200,0,0,0.15)", backdropFilter: "blur(20px)", boxShadow: "0 0 40px rgba(0,0,0,0.8)" }}>

          {/* Username */}
          <div>
            <label className="block mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-widest">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username" maxLength={20}
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all"
              style={{ background: "rgba(20,0,0,0.5)", borderColor: username.length >= 2 ? "rgba(200,0,0,0.5)" : "rgba(200,0,0,0.15)", color: "#e8e8e8", caretColor: "#cc0000" }}
              required autoFocus />
          </div>

          {/* PIN */}
          <div>
            <label className="block mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-widest">7-Digit PIN</label>
            <input type="password" inputMode="numeric" maxLength={7}
              value={pin} onChange={(e) => handlePinInput(e.target.value, setPin)}
              placeholder="● ● ● ● ● ● ●"
              className="w-full rounded-xl border px-4 py-3 text-center text-lg font-mono tracking-widest outline-none transition-all"
              style={{ background: "rgba(20,0,0,0.5)", borderColor: pin.length === 7 ? "rgba(200,0,0,0.5)" : "rgba(200,0,0,0.15)", color: "#e8e8e8", caretColor: "#cc0000" }}
              required />
            <div className="mt-2 flex justify-center gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="size-1.5 rounded-full transition-all duration-200"
                  style={{ background: i < pin.length ? "#cc0000" : "rgba(100,0,0,0.3)" }} />
              ))}
            </div>
          </div>

          {/* Confirm PIN */}
          <div>
            <label className="block mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-widest">Confirm PIN</label>
            <input type="password" inputMode="numeric" maxLength={7}
              value={confirmPin} onChange={(e) => handlePinInput(e.target.value, setConfirmPin)}
              placeholder="● ● ● ● ● ● ●"
              className="w-full rounded-xl border px-4 py-3 text-center text-lg font-mono tracking-widest outline-none transition-all"
              style={{ background: "rgba(20,0,0,0.5)", borderColor: confirmPin.length === 7 && confirmPin === pin ? "rgba(0,200,50,0.4)" : "rgba(200,0,0,0.15)", color: "#e8e8e8", caretColor: "#cc0000" }}
              required />
          </div>

          {error && (
            <div className="rounded-lg px-3 py-2 text-sm text-center"
              style={{ background: "rgba(200,0,0,0.12)", border: "1px solid rgba(200,0,0,0.3)", color: "#ff4444" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || pin.length !== 7 || confirmPin !== pin || username.length < 2}
            className="w-full rounded-xl py-3 text-sm font-bold uppercase tracking-widest transition-all duration-200 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#8b0000,#cc0000)", color: "#fff", boxShadow: "0 0 20px rgba(200,0,0,0.3)" }}>
            {loading ? "Creating..." : "Create Account"}
          </button>

          <div className="text-center pt-1">
            <Link href="/login" className="text-xs text-zinc-600 hover:text-red-500 transition-colors">
              Already have account? <span className="text-red-700">Sign In</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
