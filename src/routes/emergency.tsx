import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Phone, Volume2 } from "lucide-react";
import { FeatureShell, Panel } from "@/components/FeatureShell";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency Help — Rural AI" },
      {
        name: "description",
        content:
          "Emergency helplines, first aid steps and nearby services — one calm screen when every second matters.",
      },
      { property: "og:title", content: "Emergency Help — Rural AI" },
      {
        property: "og:description",
        content: "Ambulance, police, disaster and women's safety numbers with first aid steps.",
      },
    ],
  }),
  component: Emergency,
});

const contacts = [
  { label: "Police", number: "100", emoji: "🚔" },
  { label: "Ambulance", number: "108", emoji: "🚑" },
  { label: "Fire", number: "101", emoji: "🚒" },
  { label: "Women's Helpline", number: "181", emoji: "🛡️" },
  { label: "Disaster Help", number: "1077", emoji: "⚠️" },
  { label: "Kisan Call Centre", number: "18001801551", display: "1800-180-1551", emoji: "🌾" },
];

const firstAid = [
  ["Bleeding", "Press firmly with a clean cloth for 10 minutes. Do not lift to check."],
  [
    "Snake bite",
    "Keep the person still and lying down. Do not cut or suck the wound. Reach a hospital fast.",
  ],
  ["Burns", "Cool under running water for 20 minutes. No oil, no ice, no toothpaste."],
  ["Unconscious", "Turn on the side, clear the mouth, check breathing, call 108."],
];

/** Read a number aloud using browser TTS — zero API dependency */
function speakNumber(number: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  // Read digits one by one for clarity
  const spaced = number.replace(/[^\d]/g, "").split("").join(" ");
  const utt = new SpeechSynthesisUtterance(spaced);
  utt.rate = 0.8;
  utt.lang = "hi-IN"; // Works broadly — digits sound the same
  window.speechSynthesis.speak(utt);
}

function Emergency() {
  return (
    <FeatureShell
      emoji="🚨"
      title="Emergency SOS"
      subtitle="Helplines & first aid — no internet needed"
    >
      {/* Emergency contacts — red/orange accent grid */}
      <div className="grid grid-cols-2 gap-3">
        {contacts.map((c, i) => (
          <motion.div
            key={c.number}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="relative overflow-hidden rounded-3xl shadow-soft"
            style={{
              background: "linear-gradient(135deg, oklch(0.95 0.06 25), oklch(0.97 0.03 40))",
            }}
          >
            <a href={`tel:${c.number}`} className="flex items-center gap-3 p-4">
              <span className="grid size-10 place-items-center rounded-full bg-white/80 text-lg shadow-sm">
                {c.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-red-800">{c.display ?? c.number}</p>
                <p className="text-xs font-medium text-red-700/70">{c.label}</p>
              </div>
            </a>
            {/* Speaker button — reads number aloud */}
            <button
              onClick={(e) => {
                e.preventDefault();
                speakNumber(c.number);
              }}
              aria-label={`Read ${c.label} number aloud`}
              className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/60 text-red-700 transition-colors hover:bg-white/90"
            >
              <Volume2 className="size-3.5" />
            </button>
          </motion.div>
        ))}
      </div>

      <Panel className="space-y-4">
        <p className="text-sm font-semibold">First aid — step by step</p>
        {firstAid.map(([title, body]) => (
          <div key={title} className="border-b border-border pb-3 last:border-0 last:pb-0">
            <p className="text-sm font-medium">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Nearby services</p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>🏥 Rampur PHC — 4 km · open 9 AM–5 PM</li>
          <li>🏥 District Hospital — 18 km · 24 hours</li>
          <li>🚓 Rampur Police Station — 3 km</li>
          <li>🛖 Flood shelter: Govt. School, Rampur — 1.2 km</li>
        </ul>
      </Panel>
    </FeatureShell>
  );
}
