"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { MenuIcon, XIcon, ChevronDownIcon, ZapIcon, UserIcon, LogOutIcon, PlusIcon, Trash2Icon, MessageSquareIcon, PencilIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Thread } from "@/components/assistant-ui/thread";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";

// ─── Types ─────────────────────────────────────────────────────────────────
interface UserInfo { userId: string; username: string; }
interface ChatThread { thread_id: string; title: string; updated_at: string; }
type InitMsg = { id: string; role: "user" | "assistant"; content: string };

export const MODELS = [
  { id: "mistralai/mistral-nemotron", label: "ASHURA Evil V1" },
  { id: "meta/llama-4-maverick-17b-128e-instruct", label: "ASHURA V2" },
];

// ─── ThreadContainer — remounts fully when key (threadId) changes ────────────
// This guarantees useChatRuntime gets fresh initialMessages for each thread.
const ThreadContainer = ({
  threadId,
  initialMessages,
  model,
  modelSelector,
  onFinish,
}: {
  threadId: string;
  initialMessages: InitMsg[];
  model: string;
  modelSelector: React.ReactNode;
  onFinish: () => void;
}) => {
  const runtime = useChatRuntime({
    api: "/api/chat",
    body: { model, threadId },
    initialMessages,
    onFinish,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread modelSelector={modelSelector} />
    </AssistantRuntimeProvider>
  );
};

// ─── Main ──────────────────────────────────────────────────────────────────
export const Assistant = () => {
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>(() => crypto.randomUUID());
  const [initialMessages, setInitialMessages] = useState<InitMsg[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // ─── Load user ──────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("ashura_user");
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.user) {
        const u = { userId: d.user.userId, username: d.user.username };
        setUser(u);
        localStorage.setItem("ashura_user", JSON.stringify(u));
      }
    });
  }, []);

  // ─── Fetch thread list ──────────────────────────────────────────────────
  const fetchThreads = useCallback(async () => {
    const res = await fetch("/api/chats");
    if (!res.ok) return;
    const data = await res.json();
    setThreads(data.threads ?? []);
  }, []);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  // ─── Switch thread — loads history from Supabase ────────────────────────
  const switchThread = useCallback(async (threadId: string) => {
    setLoadingHistory(true);
    setSidebarOpen(false);
    try {
      const res = await fetch(`/api/chats/${threadId}`);
      const data = await res.json();
      const history: InitMsg[] = (data.messages ?? []).map((m: { role: string; content: string; id?: string }) => ({
        id: m.id ?? crypto.randomUUID(),
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      setInitialMessages(history);
      setActiveThreadId(threadId);   // key changes → ThreadContainer remounts with history
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // ─── New chat ────────────────────────────────────────────────────────────
  const newChat = useCallback(() => {
    setInitialMessages([]);
    setActiveThreadId(crypto.randomUUID());  // fresh key → fresh runtime
    setSidebarOpen(false);
  }, []);

  // ─── Delete thread ────────────────────────────────────────────────────────
  const deleteThread = useCallback(async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch("/api/chats", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId }),
    });
    if (threadId === activeThreadId) newChat();
    await fetchThreads();
  }, [activeThreadId, newChat, fetchThreads]);

  // ─── Start inline title edit ───────────────────────────────────────────────
  const startEdit = useCallback((t: ChatThread, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingThreadId(t.thread_id);
    setEditTitle(t.title);
    setTimeout(() => editInputRef.current?.focus(), 30);
  }, []);

  // ─── Save edited title ────────────────────────────────────────────────────
  const saveTitle = useCallback(async (threadId: string) => {
    const trimmed = editTitle.trim();
    if (!trimmed) { setEditingThreadId(null); return; }
    // Optimistic update
    setThreads((prev) => prev.map((t) => t.thread_id === threadId ? { ...t, title: trimmed } : t));
    setEditingThreadId(null);
    await fetch("/api/chats", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId, title: trimmed }),
    });
  }, [editTitle]);

  // ─── Logout ──────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await fetch("/api/auth/me", { method: "DELETE" });
    localStorage.removeItem("ashura_user");
    localStorage.removeItem("ashura_device");
    router.replace("/login");
  };

  // ─── Model Selector JSX ───────────────────────────────────────────────────
  const ModelSelector = (
    <div className="relative inline-flex items-center gap-1.5">
      <ZapIcon className="size-3 text-red-500 animate-pulse" />
      <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
        className="appearance-none cursor-pointer rounded-full border border-red-900/40 bg-black/60 py-1 pl-3 pr-7 text-xs font-semibold text-red-400 outline-none hover:border-red-700/60 hover:text-red-300 focus:ring-1 focus:ring-red-800 transition-all"
        style={{ textShadow: "0 0 8px rgba(255,0,51,0.5)" }}>
        {MODELS.map((m) => (
          <option key={m.id} value={m.id} className="bg-black text-red-400">{m.label}</option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2 size-3 text-red-600" />
    </div>
  );

  // ─── Group threads by date ────────────────────────────────────────────────
  const groupThreads = () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const week = new Date(today); week.setDate(week.getDate() - 7);
    const groups: { label: string; items: ChatThread[] }[] = [
      { label: "Today", items: [] },
      { label: "Yesterday", items: [] },
      { label: "Last 7 Days", items: [] },
      { label: "Older", items: [] },
    ];
    for (const t of threads) {
      const d = new Date(t.updated_at); d.setHours(0, 0, 0, 0);
      if (d >= today) groups[0].items.push(t);
      else if (d >= yesterday) groups[1].items.push(t);
      else if (d >= week) groups[2].items.push(t);
      else groups[3].items.push(t);
    }
    return groups.filter((g) => g.items.length > 0);
  };

  return (
    <div className="relative flex h-dvh overflow-hidden" style={{ background: "#080808" }}>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(ellipse 60% 40% at 10% 0%, rgba(200,0,0,0.07) 0%, transparent 70%)" }} />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/70 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ═══ SIDEBAR ════════════════════════════════════════════════════════ */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r transition-transform duration-300 ease-in-out",
        "md:static md:z-auto md:w-[220px] md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )} style={{ background: "rgba(8,8,8,0.97)", borderColor: "rgba(200,0,0,0.12)", backdropFilter: "blur(20px)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b" style={{ borderColor: "rgba(200,0,0,0.1)" }}>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://iili.io/BmkTxGS.png" alt="ASHURA" className="size-6 rounded-full object-cover"
              style={{ boxShadow: "0 0 8px rgba(200,0,0,0.5)" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <span className="text-xs font-black tracking-widest uppercase" style={{ color: "#cc3333" }}>ASHURA</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={newChat} title="New Chat"
              className="flex size-7 items-center justify-center rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-950/20 transition-all">
              <PlusIcon className="size-4" />
            </button>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden flex size-7 items-center justify-center rounded-lg text-zinc-600 hover:text-red-400 transition-all">
              <XIcon className="size-4" />
            </button>
          </div>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-4"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(200,0,0,0.2) transparent" }}>
          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <MessageSquareIcon className="size-8 text-zinc-800" />
              <p className="text-xs text-zinc-700">No chats yet</p>
              <p className="text-[10px] text-zinc-800">Start a conversation</p>
            </div>
          ) : (
            groupThreads().map((group) => (
              <div key={group.label}>
                <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-700">{group.label}</p>
                <div className="space-y-0.5">
                  {group.items.map((t) => (
                    <div key={t.thread_id}
                      className={cn(
                        "group relative flex items-center rounded-lg px-2 py-1.5 text-xs transition-all",
                        activeThreadId === t.thread_id
                          ? "bg-red-950/30 text-zinc-200"
                          : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                      )}>

                      {editingThreadId === t.thread_id ? (
                        /* ── Inline edit mode ── */
                        <div className="flex flex-1 items-center gap-1 min-w-0">
                          <input
                            ref={editInputRef}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveTitle(t.thread_id);
                              if (e.key === "Escape") setEditingThreadId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 min-w-0 rounded bg-black/60 border border-red-800/40 px-1.5 py-0.5 text-xs text-zinc-200 outline-none focus:border-red-600/60"
                          />
                          <button onClick={(e) => { e.stopPropagation(); saveTitle(t.thread_id); }}
                            className="shrink-0 flex size-5 items-center justify-center rounded text-green-500 hover:bg-green-950/30 transition-all">
                            <CheckIcon className="size-3" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingThreadId(null); }}
                            className="shrink-0 flex size-5 items-center justify-center rounded text-zinc-600 hover:text-zinc-400 hover:bg-white/5 transition-all">
                            <XIcon className="size-3" />
                          </button>
                        </div>
                      ) : (
                        /* ── Normal mode ── */
                        <>
                          <button className="flex-1 min-w-0 text-left py-0.5" onClick={() => switchThread(t.thread_id)}>
                            <span className="block truncate leading-tight">{t.title}</span>
                          </button>
                          {/* Action icons — shown on hover */}
                          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                            <span onClick={(e) => startEdit(t, e)}
                              className="flex size-5 items-center justify-center rounded text-zinc-700 hover:text-zinc-300 hover:bg-white/10 transition-all cursor-pointer">
                              <PencilIcon className="size-3" />
                            </span>
                            <span onClick={(e) => deleteThread(t.thread_id, e)}
                              className="flex size-5 items-center justify-center rounded text-zinc-700 hover:text-red-500 hover:bg-red-950/30 transition-all cursor-pointer">
                              <Trash2Icon className="size-3" />
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom: Telegram + Profile */}
        <div className="border-t px-2 py-2 space-y-1" style={{ borderColor: "rgba(200,0,0,0.1)" }}>
          <a href="https://t.me/+UntJ3WSNNt43Yzk1" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 w-full rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #0088cc22, #0088cc44)", border: "1px solid #0088cc44", color: "#29b6f6" }}>
            <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.657l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.646.929z" />
            </svg>
            <span>Join Telegram</span>
          </a>

          <button onClick={() => setShowProfile((p) => !p)}
            className="w-full flex items-center gap-2 rounded-xl px-2 py-2 transition-all hover:bg-red-950/20">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full"
              style={{ background: "linear-gradient(135deg,#8b0000,#cc0000)" }}>
              <UserIcon className="size-3 text-white" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-semibold text-zinc-200 truncate">{user?.username ?? "..."}</p>
              <p className="text-[10px] text-zinc-600 font-mono">#{user?.userId ?? "--------"}</p>
            </div>
            <ChevronDownIcon className={cn("size-3 text-zinc-600 transition-transform", showProfile && "rotate-180")} />
          </button>

          {showProfile && (
            <div className="rounded-xl border p-3 space-y-2" style={{ background: "rgba(15,0,0,0.8)", borderColor: "rgba(200,0,0,0.15)" }}>
              <div className="text-center">
                <p className="text-sm font-bold text-zinc-200">{user?.username}</p>
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">User ID</p>
                <p className="text-xs font-mono text-red-500">{user?.userId}</p>
              </div>
              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-all">
                <LogOutIcon className="size-3" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ MAIN AREA ══════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* Mobile topbar */}
        <div className="flex items-center gap-3 border-b px-4 py-3 md:hidden"
          style={{ borderColor: "rgba(200,0,0,0.12)", background: "rgba(8,8,8,0.9)" }}>
          <button onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-950/30 transition-all">
            <MenuIcon className="size-5" />
          </button>
          <span className="text-sm font-bold tracking-widest uppercase" style={{ color: "#cc3333" }}>ASHURA</span>
        </div>

        {loadingHistory ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="size-6 rounded-full animate-ping" style={{ background: "rgba(200,0,0,0.5)" }} />
              <p className="text-xs text-zinc-700">Loading history...</p>
            </div>
          </div>
        ) : (
          /* KEY = activeThreadId forces full remount → fresh runtime with correct initialMessages */
          <ThreadContainer
            key={activeThreadId}
            threadId={activeThreadId}
            initialMessages={initialMessages}
            model={selectedModel}
            modelSelector={ModelSelector}
            onFinish={fetchThreads}
          />
        )}
      </div>
    </div>
  );
};
