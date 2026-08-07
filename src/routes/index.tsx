import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Mic } from "lucide-react";
import { useState } from "react";
import { Orb } from "@/components/Orb";
import { useAssistant } from "@/components/AssistantProvider";
import { useSpeech } from "@/hooks/use-speech";
import { features, greetings } from "@/lib/rural";

export const Route = createFileRoute("/")({
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
});

type Phase = "welcome" | "listening" | "detected" | "home";

function Index() {
  const [phase, setPhase] = useState<Phase>("welcome");
  const { setLanguage, openChat } = useAssistant();
  const { listen, listening, transcript } = useSpeech();
  const navigate = useNavigate();

  const start = () => {
    if (phase !== "welcome") return;
    setPhase("listening");
    listen(() => {
      setPhase("detected");
      setLanguage("English");
      setTimeout(() => setPhase("home"), 1400);
    }, "My wheat crop has started turning yellow.");
  };

  const isHome = phase === "home";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatePresence>
        {!isHome && (
          <motion.div
            key="cloud"
            className="pointer-events-none absolute inset-0"
            exit={{ opacity: 0, scale: 1.06, filter: "blur(6px)" }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            {greetings.map((g, i) => {
              const x = 50 + Math.cos(g.angle) * g.radius * 46;
              const y = 50 + Math.sin(g.angle) * g.radius * 44;
              const opacity = Math.max(0.08, 0.95 - g.radius * 0.95);
              return (
                <motion.span
                  key={`${g.text}-${i}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center text-sm font-medium text-primary"
                  style={{ left: `${x}%`, top: `${y}%`, opacity }}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: phase === "listening" ? opacity * 0.5 : opacity,
                    x: [0, Math.cos(g.angle) * 6, 0],
                    y: [0, Math.sin(g.angle) * 6, 0],
                  }}
                  transition={{
                    opacity: { duration: 1.2, delay: i * 0.03 },
                    x: { duration: 22 + (i % 7) * 3, repeat: Infinity, ease: "easeInOut" },
                    y: { duration: 26 + (i % 5) * 3, repeat: Infinity, ease: "easeInOut" },
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
            active={listening || phase === "detected"}
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
              {transcript && <span className="mt-2 block text-foreground">“{transcript}”</span>}
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
              English detected
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
                Rain expected by evening — water your crops after sunset. Wheat prices are up 3% at
                the nearby mandi, and a subsidy deadline is 6 days away.
              </p>
            </motion.div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {features.map((f, i) => (
                <motion.button
                  key={f.slug}
                  initial={{ opacity: 0, y: 24, scale: 0.94 }}
                  animate={{ opacity: 1, y: i % 2 === 1 ? 14 : 0, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 220,
                    damping: 20,
                    delay: 0.2 + i * 0.06,
                  }}
                  whileHover={{ y: (i % 2 === 1 ? 14 : 0) - 4 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate({ to: `/${f.slug}` })}
                  className="rounded-3xl bg-card p-4 text-left shadow-soft"
                >
                  <span
                    className="grid size-10 place-items-center rounded-2xl text-lg"
                    style={{ background: f.tint }}
                  >
                    {f.emoji}
                  </span>
                  <p className="mt-3 text-sm font-semibold">{f.title}</p>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">{f.desc}</p>
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
