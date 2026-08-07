import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Mic } from "lucide-react";
import { useState } from "react";
import { Orb } from "@/components/Orb";
import { useAssistant } from "@/components/AssistantProvider";
import { useNexusState } from "@/lib/state-engine";
import { useSpeech } from "@/hooks/use-speech";
import { features, greetings } from "@/lib/rural";
import { SUPPORTED_LANGUAGES } from "@/lib/language-detect";
import { t, tFeature } from "@/lib/i18n";

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
  const navigate = useNavigate();

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
      t("FallbackMicPrompt", initialLocale),
      initialLocale,
    );
  };

  const isHome = phase === "home";

  const handleCardTap = (feature: (typeof features)[number]) => {
    // Emergency and agriculture navigate to their own routes
    const directRoutes = ["emergency", "agriculture"];
    if (directRoutes.includes(feature.slug)) {
      navigate({ to: `/${feature.slug}` });
      return;
    }

    // Other cards open chat with a translated seed message
    let seedText = tFeature(feature.slug, "seed", langCode);
    if (!seedText) {
      seedText = `I need help with ${feature.title}`;
    }

    openChat(seedText);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Prototype Language Toggle */}
      {isHome && (
        <button
          onClick={() => setLanguage(langCode === "en" ? "hi" : "en")}
          className="absolute right-4 top-4 z-50 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-md transition-colors hover:bg-primary/20"
        >
          {langCode === "en" ? "हिंदी में स्विच करें" : "Switch to English"}
        </button>
      )}

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
              {t("Listening…", langCode)}
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
              {detectedLangName} {t("detected", langCode)}
            </motion.p>
          )}
          {isHome && (
            <motion.p
              key="home-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-center text-sm text-muted-foreground"
            >
              {t("Tap the orb and ask anything", langCode)}
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
            <p className="text-sm text-foreground/70">{t("Speak in any language", langCode)}</p>
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
                {t("Good morning · Today", langCode)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                {t("WeatherBrief", langCode)}
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
                  <p className="mt-3 text-sm font-semibold">{tFeature(f.slug, "title", langCode) || f.title}</p>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">
                    {tFeature(f.slug, "desc", langCode) || f.desc}
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
