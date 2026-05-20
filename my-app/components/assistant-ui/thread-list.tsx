import type { FC } from "react";
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
} from "@assistant-ui/react";
import { ArchiveIcon, PlusIcon, MessageSquareIcon } from "lucide-react";

import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";

export const ThreadList: FC = () => {
  return (
    <ThreadListPrimitive.Root className="flex flex-col items-stretch gap-1">
      <ThreadListNew />
      <div
        className="my-2 h-px w-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(200,0,0,0.2), transparent)" }}
      />
      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
        History
      </p>
      <ThreadListItems />
    </ThreadListPrimitive.Root>
  );
};

const ThreadListNew: FC = () => {
  return (
    <ThreadListPrimitive.New asChild>
      <button
        className="group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start transition-all duration-200"
        style={{
          borderColor: "rgba(200,0,0,0.2)",
          background: "rgba(20,0,0,0.4)",
          color: "#cc3333",
        }}
      >
        <PlusIcon className="size-3.5 flex-shrink-0 group-hover:rotate-90 transition-transform duration-200" />
        <span className="text-xs font-semibold tracking-wide">New Chat</span>
      </button>
    </ThreadListPrimitive.New>
  );
};

const ThreadListItems: FC = () => {
  return <ThreadListPrimitive.Items components={{ ThreadListItem }} />;
};

const ThreadListItem: FC = () => {
  return (
    <ThreadListItemPrimitive.Root
      className="group flex items-center gap-2 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-900"
      style={{ color: "#888" }}
    >
      <ThreadListItemPrimitive.Trigger
        className="flex flex-grow items-center gap-2 px-2.5 py-2 text-start"
        style={{}}
      >
        <MessageSquareIcon className="size-3 flex-shrink-0 text-zinc-700 group-hover:text-red-700 transition-colors" />
        <ThreadListItemTitle />
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemArchive />
    </ThreadListItemPrimitive.Root>
  );
};

const ThreadListItemTitle: FC = () => {
  return (
    <p className="truncate text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors group-data-[active]:text-red-400">
      <ThreadListItemPrimitive.Title fallback="New Chat" />
    </p>
  );
};

const ThreadListItemArchive: FC = () => {
  return (
    <ThreadListItemPrimitive.Archive asChild>
      <TooltipIconButton
        className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-500 ml-auto mr-2 size-4 p-0 transition-all"
        variant="ghost"
        tooltip="Archive"
      >
        <ArchiveIcon className="size-3" />
      </TooltipIconButton>
    </ThreadListItemPrimitive.Archive>
  );
};
