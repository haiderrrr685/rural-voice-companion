/**
 * State Engine — centralised state for the nexus AI pipeline.
 *
 * States: idle, listening, thinking, processing, success, error, speaking
 * Tracks which specialist agent responded and confidence level.
 *
 * The Orb and other UI components consume this state — they have
 * no direct LLM awareness.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type NexusPhase =
  | "idle"
  | "listening"
  | "thinking"
  | "processing"
  | "success"
  | "error"
  | "speaking";

export type ActiveAgent = "agriculture" | "government" | "general" | null;
export type Confidence = "high" | "medium" | "low";

export interface NexusState {
  phase: NexusPhase;
  activeAgent: ActiveAgent;
  confidence: Confidence;
  isOnline: boolean;
}

export interface NexusActions {
  setPhase: (phase: NexusPhase) => void;
  setAgent: (agent: ActiveAgent) => void;
  setConfidence: (c: Confidence) => void;
  reset: () => void;
}

export type NexusContext = NexusState & NexusActions;

const Ctx = createContext<NexusContext | null>(null);

const INITIAL_STATE: NexusState = {
  phase: "idle",
  activeAgent: null,
  confidence: "medium",
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
};

export function NexusStateProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<NexusPhase>(INITIAL_STATE.phase);
  const [activeAgent, setAgent] = useState<ActiveAgent>(INITIAL_STATE.activeAgent);
  const [confidence, setConfidence] = useState<Confidence>(INITIAL_STATE.confidence);
  const [isOnline, setIsOnline] = useState(INITIAL_STATE.isOnline);

  // Listen for connectivity changes
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setAgent(null);
    setConfidence("medium");
  }, []);

  const value = useMemo<NexusContext>(
    () => ({
      phase,
      activeAgent,
      confidence,
      isOnline,
      setPhase,
      setAgent,
      setConfidence,
      reset,
    }),
    [phase, activeAgent, confidence, isOnline, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNexusState(): NexusContext {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useNexusState must be used inside NexusStateProvider");
  return ctx;
}
