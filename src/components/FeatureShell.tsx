import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Orb } from "./Orb";
import { useAssistant } from "./AssistantProvider";

export function FeatureShell({
  emoji,
  title,
  subtitle,
  children,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { openChat } = useAssistant();
  return (
    <motion.main
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="mx-auto min-h-screen w-full max-w-md px-5 pb-32 pt-6"
    >
      <div className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="Back"
          className="grid size-10 place-items-center rounded-full bg-card shadow-soft transition-transform active:scale-95"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <span className="text-2xl">{emoji}</span>
        <div>
          <h1 className="text-lg font-semibold leading-tight">{title}</h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="mt-7 space-y-5">{children}</div>

      <motion.div
        className="fixed bottom-6 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <button
          onClick={() => openChat()}
          className="flex items-center gap-3 rounded-full bg-card/80 py-2 pl-2 pr-5 shadow-float backdrop-blur-xl"
        >
          <Orb size={38} />
          <span className="text-sm font-medium">Ask anything</span>
        </button>
      </motion.div>
    </motion.main>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl bg-card p-5 shadow-soft ${className}`}>{children}</div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";

export function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl bg-primary py-3.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform active:scale-[0.98] disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function Shimmer({ label = "Analysing…" }: { label?: string }) {
  return (
    <Panel>
      <p className="mb-3 text-sm text-muted-foreground">{label}</p>
      <div className="space-y-2.5">
        {[100, 85, 70].map((w) => (
          <div
            key={w}
            className="h-3 overflow-hidden rounded-full bg-secondary"
            style={{ width: `${w}%` }}
          >
            <motion.div
              className="h-full w-1/3 rounded-full"
              style={{ background: "var(--gradient-shimmer)" }}
              animate={{ x: ["-100%", "320%"] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function ResultCard({
  agent,
  title,
  body,
  chips = [],
}: {
  agent: string;
  title: string;
  body: string;
  chips?: string[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 24 }}
    >
      <Panel>
        <p className="text-[11px] font-medium tracking-wide text-primary">{agent}</p>
        <h2 className="mt-1 text-base font-semibold">{title}</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
          {body}
        </p>
        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((c) => (
              <span key={c} className="rounded-full bg-secondary px-3 py-1.5 text-xs">
                {c}
              </span>
            ))}
          </div>
        )}
      </Panel>
    </motion.div>
  );
}
