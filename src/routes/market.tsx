import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { FeatureShell, Panel, ResultCard } from "@/components/FeatureShell";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Market Prices — Rural AI" },
      {
        name: "description",
        content:
          "Check nearby mandi rates, price trends and get simple advice on when to sell your crop.",
      },
      { property: "og:title", content: "Market Prices — Rural AI" },
      {
        property: "og:description",
        content: "Mandi rates, trends and selling advice for farmers.",
      },
    ],
  }),
  component: Market,
});

const data: Record<string, { mandi: string; price: number; change: number }[]> = {
  Wheat: [
    { mandi: "Rampur Mandi", price: 2340, change: 3.1 },
    { mandi: "Sitapur Mandi", price: 2295, change: 1.4 },
    { mandi: "District APMC", price: 2410, change: 4.2 },
  ],
  Onion: [
    { mandi: "Rampur Mandi", price: 1180, change: -2.0 },
    { mandi: "Sitapur Mandi", price: 1240, change: -0.6 },
    { mandi: "District APMC", price: 1320, change: 1.1 },
  ],
  Soybean: [
    { mandi: "Rampur Mandi", price: 4620, change: 1.0 },
    { mandi: "Sitapur Mandi", price: 4580, change: 0.4 },
    { mandi: "District APMC", price: 4700, change: 2.3 },
  ],
};

function Market() {
  const crops = Object.keys(data);
  const [crop, setCrop] = useState<string>(crops[0] as string);
  const rows = data[crop] ?? [];

  return (
    <FeatureShell emoji="💰" title="Market Prices" subtitle="Nearby mandi rates and trends">
      <div className="flex gap-2">
        {crops.map((c) => (
          <button
            key={c}
            onClick={() => setCrop(c)}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              c === crop ? "bg-primary text-primary-foreground" : "bg-card shadow-soft"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <Panel className="space-y-3">
        {rows.map((r, i) => (
          <motion.div
            key={r.mandi}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <div>
              <p className="text-sm font-medium">{r.mandi}</p>
              <p className="text-xs text-muted-foreground">per quintal · today</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">₹{r.price.toLocaleString("en-IN")}</p>
              <p
                className={`text-xs ${r.change >= 0 ? "text-primary" : "text-destructive"}`}
              >
                {r.change >= 0 ? "▲" : "▼"} {Math.abs(r.change)}%
              </p>
            </div>
          </motion.div>
        ))}
      </Panel>

      <ResultCard
        agent="Market Agent"
        title={`Selling advice for ${crop}`}
        body={
          "Prices at the District APMC are highest today, but transport costs about ₹90 per quintal from your village.\n\nAdvice: hold for 4–6 days. Demand is steady and rain is expected, which usually lifts prices slightly. If you must sell now, District APMC still gives the best net return."
        }
        chips={["Best: District APMC", "Hold 4–6 days", "Est. profit ₹8,400"]}
      />
    </FeatureShell>
  );
}
