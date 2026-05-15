"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { MenuIcon, XIcon, ChevronDownIcon, ZapIcon, UserIcon, LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const MODELS = [
  { id: "mistralai/mistral-nemotron", label: "ASHURA Evil V1" },
  { id: "meta/llama-4-maverick-17b-128e-instruct", label: "ASHURA V2" },
];

interface UserInfo {
  userId: string;
  username: string;
}

export const Assistant = () => {
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const runtime = useChatRuntime({ api: "/api/chat", body: { model: selectedModel } });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Try local first, then fetch
    const stored = localStorage.getItem("ashura_user");
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.user) {
        setUser({ userId: d.user.userId, username: d.user.username });
        localStorage.setItem("ashura_user", JSON.stringify({ userId: d.user.userId, username: d.user.username }));
      }
    });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/me", { method: "DELETE" });
    localStorage.removeItem("ashura_user");
    localStorage.removeItem("ashura_device");
    router.replace("/login");
  };

  const ModelSelector = (
    <div className="relative inline-flex items-center gap-1.5">
      <ZapIcon className="size-3 text-red-500 animate-pulse" />
      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        className="appearance-none cursor-pointer rounded-full border border-red-900/40 bg-black/60 py-1 pl-3 pr-7 text-xs font-semibold text-red-400 outline-none hover:border-red-700/60 hover:text-red-300 focus:ring-1 focus:ring-red-800 transition-all"
        style={{ textShadow: "0 0 8px rgba(255,0,51,0.5)" }}
      >
        {MODELS.map((m) => (
          <option key={m.id} value={m.id} className="bg-black text-red-400">
            {m.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2 size-3 text-red-600" />
    </div>
  );

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="relative flex h-dvh overflow-hidden" style={{ background: "#080808" }}>
        {/* Ambient glow */}
        <div className="pointer-events-none fixed inset-0 z-0"
          style={{ background: "radial-gradient(ellipse 60% 40% at 10% 0%, rgba(200,0,0,0.07) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 90% 100%, rgba(150,0,0,0.05) 0%, transparent 70%)" }} />

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black/70 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ===== SIDEBAR ===== */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r px-3 py-4 transition-transform duration-300 ease-in-out",
            "md:static md:z-auto md:w-[210px] md:translate-x-0 md:px-2",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
          style={{ background: "rgba(8,8,8,0.97)", borderColor: "rgba(200,0,0,0.12)", backdropFilter: "blur(20px)" }}
        >
          {/* Sidebar header */}
          <div className="mb-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <img src="https://iili.io/BmkTxGS.png" alt="ASHURA" className="size-7 rounded-full object-cover"
                style={{ boxShadow: "0 0 10px rgba(200,0,0,0.5)" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#cc3333", textShadow: "0 0 10px rgba(200,0,0,0.6)" }}>
                ASHURA
              </span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="rounded-md p-1 text-zinc-600 hover:text-red-500 transition-colors md:hidden">
              <XIcon className="size-4" />
            </button>
          </div>

          {/* Divider */}
          <div className="mb-3 h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(200,0,0,0.3), transparent)" }} />

          {/* Thread list — takes remaining space */}
          <div className="flex-1 overflow-hidden">
            <ThreadList />
          </div>

          {/* ===== PROFILE SECTION ===== */}
          <div className="mt-auto pt-3 border-t" style={{ borderColor: "rgba(200,0,0,0.1)" }}>
            {/* Profile button */}
            <button
              onClick={() => setShowProfile((p) => !p)}
              className="w-full flex items-center gap-2 rounded-xl px-2 py-2.5 transition-all hover:bg-red-950/20"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: "linear-gradient(135deg,#8b0000,#cc0000)", boxShadow: "0 0 10px rgba(200,0,0,0.4)" }}>
                <UserIcon className="size-3.5 text-white" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-semibold text-zinc-200 truncate">{user?.username ?? "..."}</p>
                <p className="text-[10px] text-zinc-600 font-mono">#{user?.userId ?? "--------"}</p>
              </div>
              <ChevronDownIcon className={cn("size-3 text-zinc-600 transition-transform", showProfile && "rotate-180")} />
            </button>

            {/* Profile panel */}
            {showProfile && (
              <div className="mt-2 rounded-xl border p-3 space-y-2" style={{ background: "rgba(15,0,0,0.8)", borderColor: "rgba(200,0,0,0.15)" }}>
                <div className="text-center pb-2 border-b" style={{ borderColor: "rgba(200,0,0,0.1)" }}>
                  <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full"
                    style={{ background: "linear-gradient(135deg,#8b0000,#cc0000)", boxShadow: "0 0 20px rgba(200,0,0,0.4)" }}>
                    <UserIcon className="size-5 text-white" />
                  </div>
                  <p className="text-sm font-bold text-zinc-200">{user?.username ?? "—"}</p>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-0.5">User ID</p>
                  <p className="text-xs font-mono text-red-500 mt-0.5 tracking-wider">{user?.userId ?? "—"}</p>
                </div>
                <button onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-all">
                  <LogOutIcon className="size-3" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===== MAIN AREA ===== */}
        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          {/* Mobile topbar */}
          <div className="flex items-center gap-3 border-b px-4 py-3 md:hidden"
            style={{ borderColor: "rgba(200,0,0,0.12)", background: "rgba(8,8,8,0.9)" }}>
            <button onClick={() => setSidebarOpen(true)}
              className="rounded-md p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-950/30 transition-all">
              <MenuIcon className="size-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-widest uppercase" style={{ color: "#cc3333", textShadow: "0 0 10px rgba(200,0,0,0.5)" }}>
                ASHURA
              </span>
            </div>
          </div>

          <Thread modelSelector={ModelSelector} />
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
};
