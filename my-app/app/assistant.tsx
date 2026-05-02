"use client";

import { useState } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { MenuIcon, XIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const MODELS = [
  { id: "DeepSeek R1", label: "EVIL GPT V1" },
  // Add more models here in the future
];

export const Assistant = () => {
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const runtime = useChatRuntime({ api: "/api/chat", body: { model: selectedModel } });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const ModelSelector = (
    <div className="relative inline-flex items-center gap-1">
      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        className="appearance-none cursor-pointer rounded-full border border-border bg-muted/50 py-1 pl-3 pr-7 text-xs font-semibold text-foreground outline-none hover:bg-muted focus:ring-1 focus:ring-ring transition-colors"
      >
        {MODELS.map((m) => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2 size-3 text-muted-foreground" />
    </div>
  );

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="relative flex h-dvh overflow-hidden bg-background">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r bg-background px-3 py-4 transition-transform duration-300 ease-in-out",
            "md:static md:z-auto md:w-[200px] md:translate-x-0 md:border-r-0 md:px-2",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="mb-2 flex justify-end md:hidden">
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-1 hover:bg-muted"
            >
              <XIcon className="size-5" />
            </button>
          </div>
          <ThreadList />
        </div>

        {/* Main area */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center border-b px-3 py-2 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-1 hover:bg-muted"
            >
              <MenuIcon className="size-5" />
            </button>
            <span className="ml-3 text-sm font-semibold">EVIL GPT</span>
          </div>
          <Thread modelSelector={ModelSelector} />
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
};
