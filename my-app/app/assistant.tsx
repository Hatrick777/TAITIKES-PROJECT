"use client";

import { useState } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { MenuIcon, XIcon, ChevronDownIcon, ZapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const MODELS = [
  { id: "mistralai/mistral-nemotron", label: "ASHURA Evil V1" },
  // Add more models here in the future
];

export const Assistant = () => {
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const runtime = useChatRuntime({ api: "/api/chat", body: { model: selectedModel } });
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        {/* Ambient red glow top-left */}
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 10% 0%, rgba(200,0,0,0.07) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 90% 100%, rgba(150,0,0,0.05) 0%, transparent 70%)",
          }}
        />

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/70 md:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ===== SIDEBAR ===== */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r px-3 py-4 transition-transform duration-300 ease-in-out",
            "md:static md:z-auto md:w-[210px] md:translate-x-0 md:px-2",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
          style={{
            background: "rgba(8,8,8,0.97)",
            borderColor: "rgba(200,0,0,0.12)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Sidebar header */}
          <div className="mb-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              {/* ASHURA logo image */}
              <img
                src="https://iili.io/BmkTxGS.png"
                alt="ASHURA"
                className="size-7 rounded-full object-cover"
                style={{ boxShadow: "0 0 10px rgba(200,0,0,0.5)" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <span
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: "#cc3333", textShadow: "0 0 10px rgba(200,0,0,0.6)" }}
              >
                ASHURA
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-1 text-zinc-600 hover:text-red-500 transition-colors md:hidden"
            >
              <XIcon className="size-4" />
            </button>
          </div>

          {/* Divider */}
          <div
            className="mb-3 h-px w-full"
            style={{ background: "linear-gradient(90deg, transparent, rgba(200,0,0,0.3), transparent)" }}
          />

          <ThreadList />
        </div>

        {/* ===== MAIN AREA ===== */}
        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          {/* Mobile topbar */}
          <div
            className="flex items-center gap-3 border-b px-4 py-3 md:hidden"
            style={{ borderColor: "rgba(200,0,0,0.12)", background: "rgba(8,8,8,0.9)" }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-950/30 transition-all"
            >
              <MenuIcon className="size-5" />
            </button>
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-bold tracking-widest uppercase"
                style={{ color: "#cc3333", textShadow: "0 0 10px rgba(200,0,0,0.5)" }}
              >
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
