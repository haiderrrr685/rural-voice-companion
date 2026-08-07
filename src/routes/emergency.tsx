import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Phone } from "lucide-react";
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
  { label: "Ambulance", number: "108" },
  { label: "Police", number: "100" },
  { label: "Fire", number: "101" },
  { label: "Disaster Help", number: "1077" },
  { label: "Women's Safety", number: "181" },
  { label: "Veterinary", number: "1962" },
];

const firstAid = [
  ["Bleeding", "Press firmly with a clean cloth for 10 minutes. Do not lift to check."],
  ["Snake bite", "Keep the person still and lying down. Do not cut or suck the wound. Reach a hospital fast."],
  ["Burns", "Cool under running water for 20 minutes. No oil, no ice, no toothpaste."],
  ["Unconscious", "Turn on the side, clear the mouth, check breathing, call 108."],
];

function Emergency() {
  return (
    <FeatureShell emoji="🚨" title="Emergency" subtitle="Help, numbers and first aid">
      <div className="grid grid-cols-2 gap-3">
        {contacts.map((c, i) => (
          <motion.a
            key={c.number}
            href={`tel:${c.number}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-3 rounded-3xl bg-card p-4 shadow-soft"
          >
            <span className="grid size-9 place-items-center rounded-full bg-secondary">
              <Phone className="size-4 text-primary" />
            </span>
            <div>
              <p className="text-sm font-semibold">{c.number}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          </motion.a>
        ))}
      </div>

      <Panel className="space-y-4">
        <p className="text-sm font-semibold">First aid, step by step</p>
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
