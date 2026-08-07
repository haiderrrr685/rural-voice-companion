import { AnimatePresence, motion } from "motion/react";
import { Mic, Send, X, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Orb } from "./Orb";
import { useAssistant } from "./AssistantProvider";
import { useNexusState } from "@/lib/state-engine";
import { useSpeech } from "@/hooks/use-speech";
import { useTts } from "@/hooks/use-tts";
import { suggestedPrompts } from "@/lib/rural";
import type { AgentId } from "@/lib/nexus-engine";

type Msg = {
  id: number;
  role: "user" | "ai";
  text: string;
  agent?: string;
  agentId?: AgentId;
  confidence?: string;
};

const AGENT_LABELS: Record<string, { emoji: string; label: string }> = {
  agriculture: { emoji: "🌾", label: "Agriculture Agent" },
  government: { emoji: "🏛", label: "Government Agent" },
  general: { emoji: "💬", label: "General Assistant" },
};

/** Minimum visible thinking time so the animation isn't a jarring flash */
const MIN_THINKING_MS = 500;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let uid = 0;

export function ChatSheet() {
  const {
    chatOpen,
    closeChat,
    seed,
    clearSeed,
    language,
    langCode,
    setLanguage,
    processMessage,
    languageInfo,
  } = useAssistant();

  const nexus = useNexusState();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const inFlightRef = useRef(false);
  const { listenAndDetect, listening, transcript, stop: stopListening } =
    useSpeech();
  const { speak, speaking, stop: stopTts } = useTts();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || inFlightRef.current) return; // debounce guard

    inFlightRef.current = true;

    // Show user message + thinking state IMMEDIATELY
    setMessages((m) => [...m, { id: ++uid, role: "user", text: clean }]);
    setInput("");
    setTyping(true);
    nexus.setPhase("thinking");

    if (!nexus.isOnline) {
      await delay(400);
      setTyping(false);
      nexus.setPhase("error");
      setMessages((m) => [
        ...m,
        {
          id: ++uid,
          role: "ai",
          text: "No internet connection right now. Please try again when connected.",
          agent: "System",
        },
      ]);
      inFlightRef.current = false;
      return;
    }

    try {
      // Run API call + minimum delay in parallel so thinking anim is visible
      const [response] = await Promise.all([
        processMessage(clean),
        delay(MIN_THINKING_MS),
      ]);

      nexus.setAgent(response.agent);
      nexus.setConfidence(response.confidence);

      const agentInfo =
        AGENT_LABELS[response.agent] ?? AGENT_LABELS.general;

      let answerText = response.answer;
      if (response.needsClarification && response.clarifyingQuestion) {
        answerText += `\n\n${response.clarifyingQuestion}`;
      }

      setTyping(false);
      nexus.setPhase("success");

      setMessages((m) => [
        ...m,
        {
          id: ++uid,
          role: "ai",
          text: answerText,
          agent: `${agentInfo.emoji} ${agentInfo.label}`,
          agentId: response.agent,
          confidence: response.confidence,
        },
      ]);

      // TTS auto-play
      nexus.setPhase("speaking");
      await speak(answerText, langCode);
      nexus.setPhase("idle");
    } catch {
      setTyping(false);
      nexus.setPhase("error");
      setMessages((m) => [
        ...m,
        {
          id: ++uid,
          role: "ai",
          text: "मुझे जवाब देने में समस्या हो रही है, फिर से कोशिश करें।",
          agent: "System",
        },
      ]);
    } finally {
      inFlightRef.current = false;
    }
  };

  // Seed messages from card taps
  useEffect(() => {
    if (chatOpen && seed) {
      send(seed);
      clearSeed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen, seed]);

  // Cleanup on close
  useEffect(() => {
    if (!chatOpen) {
      stopTts();
      nexus.setPhase("idle");
      nexus.setAgent(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen]);

  const handleMicPress = () => {
    // If currently listening, stop it
    if (listening) {
      stopListening();
      return;
    }
    // Cancel TTS if it's playing (clean interruption)
    stopTts();
    // Don't start listening if a request is in flight
    if (inFlightRef.current) return;

    const currentLocale = languageInfo?.code ?? "hi-IN";
    nexus.setPhase("listening");

    listenAndDetect(
      (text, detectedLangCode) => {
        setLanguage(detectedLangCode);
        nexus.setPhase("thinking"); // Instant transition to thinking
        send(text);
      },
      "मेरा फसल पीला पड़ रहा है",
      currentLocale,
    );
  };

  return (
    <AnimatePresence>
      {chatOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-background"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        >
          {/* Offline banner */}
          {!nexus.isOnline && (
            <div className="flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-xs font-medium text-destructive-foreground">
              No internet — try again when connected
            </div>
          )}

          {/* Header */}
          <header className="flex items-center gap-3 px-5 pb-3 pt-6">
            <Orb
              size={40}
              interactive={false}
              nexusPhase={nexus.phase}
              activeAgent={nexus.activeAgent}
            />
            <div className="flex-1">
              <p className="text-sm font-semibold">Rural AI</p>
              <p className="text-xs text-muted-foreground">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={
                      listening
                        ? "l"
                        : speaking
                          ? "s"
                          : typing
                            ? "t"
                            : "i"
                    }
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    {listening
                      ? "Listening…"
                      : speaking
                        ? "Speaking…"
                        : typing
                          ? "Thinking…"
                          : `Speaking ${language}`}
                  </motion.span>
                </AnimatePresence>
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

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-4">
            {messages.length === 0 && (
              <div className="pt-6">
                <p className="text-2xl font-semibold leading-snug">
                  Ask me anything.
                  <br />
                  <span className="text-muted-foreground">
                    In any language.
                  </span>
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
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={
                  m.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
                }
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-3xl rounded-br-lg bg-primary px-4 py-3 text-sm text-primary-foreground"
                      : "max-w-[90%] rounded-3xl rounded-bl-lg bg-card px-4 py-3 text-sm shadow-soft"
                  }
                >
                  {m.agent && m.role === "ai" && (
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <span className="text-[11px] font-medium tracking-wide text-primary">
                        {m.agent}
                      </span>
                      {m.confidence && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                            m.confidence === "high"
                              ? "bg-green-100 text-green-700"
                              : m.confidence === "medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {m.confidence}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="whitespace-pre-line leading-relaxed">
                    {m.text}
                  </p>
                </div>
              </motion.div>
            ))}

            {typing && <TypingBubble />}

            {speaking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-center gap-2 rounded-full bg-card px-4 py-2 shadow-soft">
                  <Volume2 className="size-4 text-primary" />
                  <SpeakingWave />
                  <button
                    onClick={stopTts}
                    className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    Stop
                  </button>
                </div>
              </motion.div>
            )}

            <div ref={endRef} />
          </div>

          {/* Input bar */}
          <div className="flex items-center gap-2 px-4 pb-7 pt-2">
            {/* Live transcript shown in the input when listening */}
            <input
              value={listening ? transcript || "Listening…" : input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && send(input)
              }
              disabled={listening}
              placeholder="Type or tap the mic…"
              className="h-12 flex-1 rounded-full bg-card px-5 text-sm shadow-soft outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />
            <button
              aria-label={listening ? "Stop listening" : "Speak"}
              onClick={handleMicPress}
              className={`grid size-12 shrink-0 place-items-center rounded-full transition-all duration-200 ${
                listening
                  ? "bg-primary text-primary-foreground scale-110"
                  : "bg-card shadow-soft"
              }`}
            >
              <Mic className="size-5" />
            </button>
            <button
              aria-label="Send"
              onClick={() => send(input)}
              disabled={inFlightRef.current || !input.trim()}
              className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex justify-start"
    >
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
    </motion.div>
  );
}

function SpeakingWave() {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-primary"
          animate={{ height: [4, 14, 4] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.08,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
