import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Field,
  FeatureShell,
  Panel,
  PrimaryButton,
  ResultCard,
  Shimmer,
  inputClass,
} from "@/components/FeatureShell";

export const Route = createFileRoute("/schemes")({
  head: () => ({
    meta: [
      { title: "Government Schemes — Rural AI" },
      {
        name: "description",
        content:
          "Tell the assistant your work and land size to see the government schemes you can actually apply for.",
      },
      { property: "og:title", content: "Government Schemes — Rural AI" },
      {
        property: "og:description",
        content: "Eligibility, documents and deadlines explained in simple language.",
      },
    ],
  }),
  component: Schemes,
});

const schemes = [
  {
    name: "PM-KISAN",
    amount: "₹6,000 per year",
    body: "Direct income support paid in three instalments to your bank account.",
    docs: "Aadhaar · Land record · Bank passbook",
  },
  {
    name: "PM Fasal Bima Yojana",
    amount: "~2% premium",
    body: "Crop insurance against drought, flood and pest damage for the whole season.",
    docs: "Aadhaar · Sowing certificate · Bank passbook",
  },
  {
    name: "Kisan Credit Card",
    amount: "Up to ₹3 lakh",
    body: "Low-interest crop loan, 4% effective if repaid on time.",
    docs: "Aadhaar · Land papers · Two photos",
  },
];

function Schemes() {
  const [occupation, setOccupation] = useState("Farmer");
  const [land, setLand] = useState("2");
  const [stage, setStage] = useState<"idle" | "loading" | "done">("idle");

  return (
    <FeatureShell emoji="🏛" title="Government Schemes" subtitle="Find what you are eligible for">
      <Panel className="space-y-4">
        <Field label="What work do you do?">
          <input
            className={inputClass}
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            placeholder="Farmer, labourer, shopkeeper…"
          />
        </Field>
        <Field label="How much land do you have (acres)?">
          <input
            className={inputClass}
            value={land}
            onChange={(e) => setLand(e.target.value)}
            inputMode="decimal"
          />
        </Field>
      </Panel>

      <PrimaryButton
        onClick={() => {
          setStage("loading");
          setTimeout(() => setStage("done"), 1800);
        }}
      >
        Find my schemes
      </PrimaryButton>

      {stage === "loading" && <Shimmer label="Checking central and state schemes…" />}
      {stage === "done" && (
        <div className="space-y-4">
          <p className="px-1 text-xs text-muted-foreground">
            {occupation} · {land} acres — 3 schemes match
          </p>
          {schemes.map((s) => (
            <ResultCard
              key={s.name}
              agent="Government Agent"
              title={`${s.name} · ${s.amount}`}
              body={`${s.body}\n\nDocuments needed:\n${s.docs}`}
              chips={["Apply at CSC centre", "Deadline: 31 March"]}
            />
          ))}
        </div>
      )}
    </FeatureShell>
  );
}
