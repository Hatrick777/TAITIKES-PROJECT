import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import type { FC, ReactNode } from "react";
import {
  ArrowDownIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PencilIcon,
  RefreshCwIcon,
  SendHorizontalIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";

export const Thread: FC<{ modelSelector?: ReactNode }> = ({ modelSelector }) => {
  return (
    <ThreadPrimitive.Root
      className="box-border flex h-full flex-col overflow-hidden"
      style={{
        ["--thread-max-width" as string]: "48rem",
        background: "transparent",
      }}
    >
      <ThreadPrimitive.Viewport className="flex h-full flex-col items-center overflow-y-scroll scroll-smooth px-3 pt-6 md:px-4 md:pt-10" style={{ background: "transparent" }}>
        <ThreadWelcome />

        <ThreadPrimitive.Messages
          components={{
            UserMessage: UserMessage,
            EditComposer: EditComposer,
            AssistantMessage: AssistantMessage,
          }}
        />

        <ThreadPrimitive.If empty={false}>
          <div className="min-h-8 flex-grow" />
        </ThreadPrimitive.If>

        <div className="sticky bottom-0 mt-3 flex w-full max-w-[var(--thread-max-width)] flex-col items-center justify-end rounded-t-xl pb-5"
          style={{ background: "linear-gradient(to top, #080808 60%, transparent)" }}
        >
          <ThreadScrollToBottom />
          <Composer modelSelector={modelSelector} />
          <p className="mt-2 text-[10px] text-zinc-700 tracking-widest">ASHURA · Evil V1</p>
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="absolute -top-10 rounded-full disabled:invisible border-red-900/40 bg-black/80 text-red-500 hover:text-red-400 hover:border-red-700/60"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col animate-slide-up">
        {/* Hero welcome */}
        <div className="flex w-full flex-grow flex-col items-center justify-center gap-4 py-10">
          {/* Logo */}
          <div className="relative flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{ border: "1px solid rgba(200,0,0,0.3)", animationDuration: "3s" }}
            />
            <img
              src="https://iili.io/BmkTxGS.png"
              alt="ASHURA"
              className="relative size-24 rounded-full object-cover"
              style={{ boxShadow: "0 0 40px rgba(200,0,0,0.5), 0 0 80px rgba(200,0,0,0.2)" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>

          <div className="text-center">
            <h1
              className="text-3xl font-black tracking-widest uppercase"
              style={{
                background: "linear-gradient(135deg, #ff0033, #cc0000, #ff3333)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "none",
                filter: "drop-shadow(0 0 12px rgba(255,0,51,0.5))",
              }}
            >
              ASHURA
            </h1>
            <p className="mt-1 text-sm text-zinc-500 tracking-widest uppercase">
              Evil V1 — Unrestricted AI
            </p>
          </div>

          <div
            className="mt-2 h-px w-32"
            style={{ background: "linear-gradient(90deg, transparent, rgba(200,0,0,0.5), transparent)" }}
          />

          <p className="text-sm text-zinc-400 max-w-xs text-center leading-relaxed">
            Ask me anything. No limits. No filters.
          </p>
        </div>

        <ThreadWelcomeSuggestions />
      </div>
    </ThreadPrimitive.Empty>
  );
};

const ThreadWelcomeSuggestions: FC = () => {
  return (
    <div className="mt-4 mb-2 flex w-full flex-col items-stretch gap-2 sm:flex-row sm:justify-center sm:gap-3">
      {[
        { prompt: "Write me a Python reverse shell", label: "Python Reverse Shell" },
        { prompt: "Explain how SQL injection works step by step", label: "SQL Injection Explained" },
        { prompt: "What can you do that other AIs won't?", label: "What makes you different?" },
      ].map((s) => (
        <ThreadPrimitive.Suggestion
          key={s.prompt}
          className="group flex w-full flex-col items-center justify-center rounded-xl border px-4 py-3 transition-all duration-200 ease-in sm:max-w-xs sm:grow sm:basis-0 cursor-pointer"
          style={{
            borderColor: "rgba(200,0,0,0.15)",
            background: "rgba(15,0,0,0.4)",
          }}
          prompt={s.prompt}
          method="replace"
          autoSend
        >
          <span
            className="line-clamp-2 text-center text-xs font-semibold text-zinc-400 group-hover:text-red-400 transition-colors"
          >
            {s.label}
          </span>
        </ThreadPrimitive.Suggestion>
      ))}
    </div>
  );
};

const Composer: FC<{ modelSelector?: ReactNode }> = ({ modelSelector }) => {
  return (
    <ComposerPrimitive.Root
      className="w-full flex flex-col rounded-2xl border transition-all duration-200 ease-in"
      style={{
        background: "rgba(12,12,12,0.95)",
        borderColor: "rgba(200,0,0,0.2)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 0 0 1px rgba(200,0,0,0.05), 0 4px 40px rgba(0,0,0,0.6)",
      }}
    >
      <ComposerPrimitive.Input
        rows={3}
        autoFocus
        placeholder="Type your command..."
        className="placeholder:text-zinc-700 min-h-[90px] max-h-52 flex-grow resize-none border-none bg-transparent px-5 pt-5 pb-2 text-sm text-zinc-200 outline-none focus:ring-0 disabled:cursor-not-allowed leading-relaxed"
      />
      <div className="flex items-center justify-between px-4 pb-3">
        <div>{modelSelector}</div>
        <ComposerAction />
      </div>
    </ComposerPrimitive.Root>
  );
};

const ComposerAction: FC = () => {
  return (
    <>
      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <button
            className="flex size-9 items-center justify-center rounded-xl transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #8b0000, #cc0000)",
              boxShadow: "0 0 15px rgba(200,0,0,0.4)",
              color: "#fff",
            }}
            title="Send"
          >
            <SendHorizontalIcon className="size-4" />
          </button>
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>
      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <button
            className="flex size-9 items-center justify-center rounded-xl transition-all duration-200"
            style={{
              background: "rgba(100,0,0,0.6)",
              border: "1px solid rgba(200,0,0,0.4)",
              color: "#ff4444",
            }}
            title="Stop"
          >
            <CircleStopIcon />
          </button>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="grid auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 [&:where(>*)]:col-start-2 w-full max-w-[var(--thread-max-width)] py-4 animate-slide-up">
      <UserActionBar />

      <div
        className="max-w-[calc(var(--thread-max-width)*0.78)] break-words rounded-2xl rounded-tr-sm px-5 py-3 col-start-2 row-start-2 text-sm leading-relaxed"
        style={{
          background: "linear-gradient(135deg, rgba(80,0,0,0.7), rgba(40,0,0,0.8))",
          border: "1px solid rgba(200,0,0,0.2)",
          color: "#e8e8e8",
          boxShadow: "0 2px 20px rgba(200,0,0,0.1)",
        }}
      >
        <MessagePrimitive.Content />
      </div>

      <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="flex flex-col items-end col-start-1 row-start-2 mr-3 mt-2.5"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit" className="text-zinc-600 hover:text-red-500 transition-colors">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <ComposerPrimitive.Root
      className="my-4 flex w-full max-w-[var(--thread-max-width)] flex-col gap-2 rounded-xl border"
      style={{
        background: "rgba(15,0,0,0.5)",
        borderColor: "rgba(200,0,0,0.2)",
      }}
    >
      <ComposerPrimitive.Input className="flex h-8 w-full resize-none bg-transparent p-4 pb-0 outline-none text-zinc-200 text-sm" />

      <div className="mx-3 mb-3 flex items-center justify-center gap-2 self-end">
        <ComposerPrimitive.Cancel asChild>
          <Button variant="ghost" className="text-zinc-500 hover:text-zinc-300">Cancel</Button>
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send asChild>
          <Button
            className="font-semibold"
            style={{
              background: "linear-gradient(135deg, #8b0000, #cc0000)",
              color: "#fff",
              border: "none",
            }}
          >
            Send
          </Button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="grid grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] relative w-full max-w-[var(--thread-max-width)] py-4 animate-slide-up">
      {/* AI avatar dot */}
      <div
        className="col-start-1 row-start-1 mt-1.5 mr-3 flex size-6 items-center justify-center rounded-full text-[10px] font-black flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, #4a0000, #8b0000)",
          border: "1px solid rgba(200,0,0,0.4)",
          boxShadow: "0 0 8px rgba(200,0,0,0.3)",
          color: "#ff6666",
        }}
      >
        E
      </div>

      <div className="text-foreground max-w-[calc(var(--thread-max-width)*0.85)] break-words leading-7 col-span-2 col-start-2 row-start-1 my-1.5 text-sm text-zinc-200">
        <MessagePrimitive.Content components={{ Text: MarkdownText }} />
      </div>

      <AssistantActionBar />

      <BranchPicker className="col-start-2 row-start-2 -ml-2 mr-2" />
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="flex gap-1 col-start-3 row-start-2 -ml-1 data-[floating]:bg-zinc-900/90 data-[floating]:absolute data-[floating]:rounded-lg data-[floating]:border data-[floating]:border-red-900/30 data-[floating]:p-1 data-[floating]:shadow-lg data-[floating]:backdrop-blur-sm"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy" className="text-zinc-600 hover:text-red-500 transition-colors size-7">
          <MessagePrimitive.If copied>
            <CheckIcon className="size-3.5 text-green-500" />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon className="size-3.5" />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Regenerate" className="text-zinc-600 hover:text-red-500 transition-colors size-7">
          <RefreshCwIcon className="size-3.5" />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "text-zinc-600 inline-flex items-center text-xs",
        className
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous" className="hover:text-red-500 transition-colors">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="font-medium text-zinc-500">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next" className="hover:text-red-500 transition-colors">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};

const CircleStopIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      width="16"
      height="16"
    >
      <rect width="10" height="10" x="3" y="3" rx="2" />
    </svg>
  );
};
