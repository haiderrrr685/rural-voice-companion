import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type AssistantState = {
  language: string;
  setLanguage: (l: string) => void;
  chatOpen: boolean;
  openChat: (seed?: string) => void;
  closeChat: () => void;
  seed: string | null;
  clearSeed: () => void;
};

const Ctx = createContext<AssistantState | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState("English");
  const [chatOpen, setChatOpen] = useState(false);
  const [seed, setSeed] = useState<string | null>(null);

  const value = useMemo<AssistantState>(
    () => ({
      language,
      setLanguage,
      chatOpen,
      seed,
      openChat: (s?: string) => {
        setSeed(s ?? null);
        setChatOpen(true);
      },
      closeChat: () => setChatOpen(false),
      clearSeed: () => setSeed(null),
    }),
    [language, chatOpen, seed],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAssistant() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAssistant must be used inside AssistantProvider");
  return ctx;
}
