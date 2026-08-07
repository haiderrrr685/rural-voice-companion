import { AnimatePresence, motion } from "motion/react";
import { Mic, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Orb } from "./Orb";
import { useAssistant } from "./AssistantProvider";
import { useSpeech } from "@/hooks/use-speech";
import { mockReply, suggestedPrompts } from "@/lib/rural";

type Msg = { id: number; role: "user" | "ai"; text: string; agent?: string };

let uid = 0;

export function ChatSheet() {
  const { chatOpen, closeChat, seed, clearSeed, language } = useAssistant();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const { listen, listening, transcript } = useSpeech();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setMessages((m) => [...m, { id: ++uid, role: "user", text: clean }]);
    setInput("");
    setTyping(true);
    const reply = mockReply(clean);
    setTimeout(
      () => {
        setTyping(false);
        setMessages((m) => [...m, { id: ++uid, role: "ai", ...reply }]);
      },
      1100 + Math.random() * 700,
    );
  };

  useEffect(() => {
    if (chatOpen && seed) {
      send(seed);
      clearSeed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen, seed]);

  return (
    <AnimatePresence>
      {chatOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-background/85 backdrop-blur-xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        >
          <header className="flex items-center gap-3 px-5 pb-3 pt-6">
            <Orb size={40} active={typing || listening} />
            <div className="flex-1">
              <p className="text-sm font-semibold">Rural AI</p>
              <p className="text-xs text-muted-foreground">
                {listening ? "Listening…" : typing ? "Thinking…" : `Speaking ${language}`}
              </p>
            </div>
            <button
              onClick={closeChat}
              aria-label="Close chat"
              className="grid size-9 place-items-center rounded-full bg-card shadow-soft"
            >
              <X className="size-4" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-4">
            {messages.length === 0 && (
              <div className="pt-6">
                <p className="text-2xl font-semibold leading-snug">
                  Ask me anything.
                  <br />
                  <span className="text-muted-foreground">In any language.</span>
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {suggestedPrompts.map((p, i) => (
                    <motion.button
                      key={p}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 * i }}
                      onClick={() => send(p)}
                      className="rounded-2xl bg-card px-4 py-2 text-sm shadow-soft transition-transform active:scale-95"
                    >
                      {p}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-3xl rounded-br-lg bg-primary px-4 py-3 text-sm text-primary-foreground"
                      : "max-w-[90%] rounded-3xl rounded-bl-lg bg-card px-4 py-3 text-sm shadow-soft"
                  }
                >
                  {m.agent && (
                    <p className="mb-1 text-[11px] font-medium tracking-wide text-primary">
                      {m.agent}
                    </p>
                  )}
                  <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                </div>
              </motion.div>
            ))}

            {typing && <TypingBubble />}
            <div ref={endRef} />
          </div>

          <div className="flex items-center gap-2 px-4 pb-7 pt-2">
            <input
              value={listening ? transcript || "Listening…" : input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Type or tap the mic…"
              className="h-12 flex-1 rounded-full bg-card px-5 text-sm shadow-soft outline-none placeholder:text-muted-foreground"
            />
            <button
              aria-label="Speak"
              onClick={() => listen((t) => send(t), "Why are my crop leaves yellow?")}
              className={`grid size-12 shrink-0 place-items-center rounded-full transition-colors ${
                listening ? "bg-primary text-primary-foreground" : "bg-card shadow-soft"
              }`}
            >
              <Mic className="size-5" />
            </button>
            <button
              aria-label="Send"
              onClick={() => send(input)}
              className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
            >
              <Send className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex gap-1.5 rounded-3xl rounded-bl-lg bg-card px-4 py-4 shadow-soft">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full bg-primary/50"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
