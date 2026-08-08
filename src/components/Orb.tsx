import { motion } from "motion/react";
import type { NexusPhase, ActiveAgent } from "@/lib/state-engine";

/**
 * Agent-specific glow colors for the orb halo.
 */
const AGENT_HALOS: Record<string, string> = {
  agriculture:
    "radial-gradient(circle, oklch(0.65 0.18 145 / 0.28) 0%, oklch(0.65 0.18 145 / 0) 68%)",
  government:
    "radial-gradient(circle, oklch(0.62 0.185 265 / 0.28) 0%, oklch(0.62 0.185 265 / 0) 68%)",
  general:
    "radial-gradient(circle, oklch(0.62 0.185 265 / 0.22) 0%, oklch(0.62 0.185 265 / 0) 68%)",
};

const AGENT_ACCENTS: Record<string, string> = {
  agriculture: "oklch(0.55 0.2 145 / 0.75)",
  government: "oklch(0.55 0.2 265 / 0.75)",
  general: "oklch(0.55 0.2 265 / 0.75)",
};

/**
 * Animation config based on nexus phase.
 */
function getAnimationConfig(phase?: NexusPhase) {
  switch (phase) {
    case "listening":
      return {
        scale: [1, 1.08, 1],
        duration: 1.2,
      };
    case "thinking":
    case "processing":
      return {
        scale: [1, 1.04, 0.97, 1.04, 1],
        duration: 1.0,
      };
    case "speaking":
      return {
        scale: [1, 1.03, 0.98, 1.05, 0.97, 1],
        duration: 1.8,
      };
    case "success":
      return {
        scale: [1, 1.06, 1],
        duration: 1.6,
      };
    case "error":
      return {
        scale: [1, 0.96, 1.02, 0.98, 1],
        duration: 0.8,
      };
    case "idle":
    default:
      return {
        scale: [0.98, 1.02, 0.98],
        duration: 5,
      };
  }
}

export function Orb({
  size = 220,
  active = false,
  onClick,
  interactive = true,
  nexusPhase,
  activeAgent,
}: {
  size?: number;
  active?: boolean;
  onClick?: () => void;
  /** Set false when the orb is rendered inside another button/link. */
  interactive?: boolean;
  /** Current nexus state phase */
  nexusPhase?: NexusPhase;
  /** Which agent is currently active */
  activeAgent?: ActiveAgent;
}) {
  const Root = interactive ? motion.button : motion.div;

  // Determine animation based on nexus phase or legacy `active` prop
  const effectivePhase = nexusPhase ?? (active ? "listening" : "idle");
  const anim = getAnimationConfig(effectivePhase);

  // Agent-specific visuals
  const agentKey = activeAgent ?? "general";
  const haloGradient = AGENT_HALOS[agentKey] ?? AGENT_HALOS["general"]!;
  const accentLine = AGENT_ACCENTS[agentKey] ?? AGENT_ACCENTS["general"]!;

  // Show stop affordance when in active state and interactive
  const isActive = ["listening", "thinking", "processing", "speaking"].includes(effectivePhase);
  const showStop = interactive && isActive;

  return (
    <Root
      {...(interactive
        ? {
            type: "button" as const,
            onClick,
            "aria-label": showStop ? "Stop" : "Talk to the assistant",
            whileTap: { scale: 0.94 },
          }
        : { "aria-hidden": true })}
      className="relative grid place-items-center rounded-full outline-none"
      style={{ width: size, height: size }}
      animate={{ scale: anim.scale }}
      transition={{
        duration: anim.duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* Halo — agent-colored glow */}
      <span
        className="absolute inset-[-28%] rounded-full opacity-70 blur-2xl"
        style={{ background: haloGradient }}
      />
      {/* Body — glass sphere */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: "var(--gradient-orb)",
          boxShadow: "var(--shadow-orb)",
        }}
      />
      {/* Orbital rings */}
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-[14%] overflow-visible opacity-80"
        animate={{ rotate: 360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
      >
        {[0, 36, 72, 108, 144].map((r, i) => (
          <motion.g
            key={r}
            style={{ transformOrigin: "50px 50px" }}
            animate={{ scaleY: [1, 1.5, 1] }}
            transition={{
              duration: 7 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <ellipse
              cx="50"
              cy="50"
              rx="38"
              ry="16"
              fill="none"
              stroke={accentLine}
              strokeWidth={1.1}
              opacity={0.55 - i * 0.06}
              transform={`rotate(${r} 50 50)`}
            />
          </motion.g>
        ))}
      </motion.svg>
      {/* Specular highlight / sheen */}
      <span
        className="absolute rounded-full blur-md"
        style={{
          width: size * 0.3,
          height: size * 0.3,
          top: size * 0.16,
          left: size * 0.2,
          background: "var(--gradient-sheen)",
        }}
      />
      {/* Stop indicator — square icon overlaid when active */}
      {showStop && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.9, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="absolute z-10 rounded-sm bg-white/90"
          style={{
            width: size * 0.16,
            height: size * 0.16,
          }}
        />
      )}
    </Root>
  );
}
