import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Mic } from "lucide-react";
import { useState } from "react";
import { Orb } from "@/components/Orb";
import { useAssistant } from "@/components/AssistantProvider";
import { useNexusState } from "@/lib/state-engine";
import { useSpeech } from "@/hooks/use-speech";
import { features, greetings } from "@/lib/rural";
import { SUPPORTED_LANGUAGES } from "@/lib/language-detect";

export const Route = createFileRoute("/")(
  {
    head: () => ({
      meta: [
        { title: "Rural AI — Speak in any language" },
        {
          name: "description",
          content:
            "Tap the orb and speak. Rural AI understands your language and helps with crops, government schemes, documents, health, markets and more.",
        },
        { property: "og:title", content: "Rural AI — Speak in any language" },
        {
          property: "og:description",
          content:
            "A voice-first AI companion for rural India. One assistant, many specialists, zero complexity.",
        },
      ],
    }),
    component: Index,
  },
);

type Phase = "welcome" | "listening" | "detected" | "home";

function Index() {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [detectedLangName, setDetectedLangName] = useState("Hindi");
  const { setLanguage, confirmLanguage, openChat, languageInfo, langCode } =
    useAssistant();
  const nexus = useNexusState();
  const { listenAndDetect, listening, transcript } = useSpeech();

  const start = () => {
    if (phase !== "welcome") return;
    setPhase("listening");
    nexus.setPhase("listening");

    const initialLocale = languageInfo?.code ?? "hi-IN";

    listenAndDetect(
      (text, detectedCode) => {
        const langInfo = SUPPORTED_LANGUAGES[detectedCode] ?? SUPPORTED_LANGUAGES.hi;

        setLanguage(detectedCode);
        setDetectedLangName(langInfo.name);
        confirmLanguage();

        nexus.setPhase("success");
        setPhase("detected");
        setTimeout(() => {
          nexus.setPhase("idle");
          setPhase("home");

          // Send the first message to the chat sheet
          openChat(text);
        }, 1400);
      },
      "मेरा गेहूं का फसल पीला पड़ रहा है।",
      initialLocale,
    );
  };

  const isHome = phase === "home";

  const handleCardTap = (feature: (typeof features)[number]) => {
    const seedMessages: Record<string, string> = {
      agriculture: "I need help with my farming and crops",
      schemes: "What government schemes can I apply for?",
      documents: "I need help understanding a document",
      health: "I need health advice",
      market: "What are today's market prices?",
      education: "Help my child with studies",
      livestock: "I need help with my animals",
      emergency: "I need emergency help",
    };

    openChat(seedMessages[feature.slug] ?? `I need help with ${feature.title}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Greeting word cloud */}
      <AnimatePresence>
        {!isHome && (
          <motion.div
            key="cloud"
            className="pointer-events-none absolute inset-0"
            exit={{ opacity: 0, scale: 1.06, filter: "blur(6px)" }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            {greetings.map((g, i) => {
              const x = Number(
                Math.min(
                  88,
                  Math.max(12, 50 + Math.cos(g.angle) * g.radius * 42),
                ).toFixed(2),
              );
              const y = Number(
                Math.min(
                  92,
                  Math.max(8, 50 + Math.sin(g.angle) * g.radius * 44),
                ).toFixed(2),
              );
              const opacity = Math.max(0.12, 1.35 - g.radius * 1.15);
              return (
                <motion.span
                  key={`${g.text}-${i}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center text-sm font-medium text-primary"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: phase === "listening" ? opacity * 0.5 : opacity,
                    x: [0, Math.cos(g.angle) * 6, 0],
                    y: [0, Math.sin(g.angle) * 6, 0],
                  }}
                  transition={{
                    opacity: { duration: 1.2, delay: i * 0.03 },
                    x: {
                      duration: 22 + (i % 7) * 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                    y: {
                      duration: 26 + (i % 5) * 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                >
                  {g.text}
                  <span className="block text-[10px] font-normal text-muted-foreground">
                    {g.lang}
                  </span>
                </motion.span>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orb + status text */}
      <motion.div
        layout
        className={
          isHome
            ? "relative z-10 flex flex-col items-center pt-10"
            : "relative z-10 flex min-h-screen flex-col items-center justify-center"
        }
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      >
        <motion.div layout>
          <Orb
            size={isHome ? 90 : 220}
            nexusPhase={nexus.phase}
            activeAgent={nexus.activeAgent}
            onClick={() => (isHome ? openChat() : start())}
          />
        </motion.div>

        <AnimatePresence mode="wait">
          {phase === "listening" && (
            <motion.p
              key="listening"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 max-w-xs text-center text-sm text-muted-foreground"
            >
              Listening…
              {transcript && (
                <span className="mt-2 block text-foreground">
                  "{transcript}"
                </span>
              )}
            </motion.p>
          )}
          {phase === "detected" && (
            <motion.p
              key="detected"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 rounded-full bg-card px-5 py-2 text-sm font-medium text-primary shadow-soft"
            >
              {detectedLangName} detected
            </motion.p>
          )}
          {isHome && (
            <motion.p
              key="home-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-center text-sm text-muted-foreground"
            >
              Tap the orb and ask anything
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Hint at bottom */}
      <AnimatePresence>
        {!isHome && (
          <motion.div
            key="hint"
            exit={{ opacity: 0, y: 10 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="absolute inset-x-0 bottom-10 z-10 flex flex-col items-center gap-2"
          >
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.6, repeat: Infinity }}
              className="grid size-10 place-items-center rounded-full bg-card shadow-soft"
            >
              <Mic className="size-4 text-primary" />
            </motion.span>
            <p className="text-sm text-foreground/70">Speak in any language</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Home screen: daily brief + feature cards */}
      <AnimatePresence>
        {isHome && (
          <motion.section
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 mx-auto w-full max-w-md px-5 pb-16 pt-10"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-3xl bg-card p-5 shadow-soft"
            >
              <p className="text-[11px] font-medium tracking-wide text-primary">
                Good morning · Today
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                Rain expected by evening — water your crops after sunset. Wheat
                prices are up 3% at the nearby mandi, and a subsidy deadline is
                6 days away.
              </p>
            </motion.div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {features.map((f, i) => (
                <motion.button
                  key={f.slug}
                  initial={{ opacity: 0, y: 24, scale: 0.94 }}
                  animate={{
                    opacity: 1,
                    y: i % 2 === 1 ? 14 : 0,
                    scale: 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 220,
                    damping: 20,
                    delay: 0.2 + i * 0.06,
                  }}
                  whileHover={{ y: (i % 2 === 1 ? 14 : 0) - 4 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleCardTap(f)}
                  className="rounded-3xl bg-card p-4 text-left shadow-soft"
                >
                  <span
                    className="grid size-10 place-items-center rounded-2xl text-lg"
                    style={{ background: f.tint }}
                  >
                    {f.emoji}
                  </span>
                  <p className="mt-3 text-sm font-semibold">{f.title}</p>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">
                    {f.desc}
                  </p>
                </motion.button>
              ))}
            </div>
            <div className="h-6" />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
