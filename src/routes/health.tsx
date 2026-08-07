import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  FeatureShell,
  Field,
  Panel,
  PrimaryButton,
  ResultCard,
  Shimmer,
  inputClass,
} from "@/components/FeatureShell";

export const Route = createFileRoute("/health")({
  head: () => ({
    meta: [
      { title: "Health Assistant — Rural AI" },
      {
        name: "description",
        content:
          "Describe symptoms in your own words and get simple care guidance, first aid steps and when to see a doctor.",
      },
      { property: "og:title", content: "Health Assistant — Rural AI" },
      {
        property: "og:description",
        content: "Accessible health guidance for families — not a diagnosis.",
      },
    ],
  }),
  component: Health,
});

function Health() {
  const [symptoms, setSymptoms] = useState("");
  const [stage, setStage] = useState<"idle" | "loading" | "done">("idle");

  return (
    <FeatureShell emoji="❤️" title="Health Assistant" subtitle="Guidance, care and first aid">
      <Panel>
        <Field label="What is troubling you?">
          <textarea
            rows={4}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Fever for two days and body pain…"
            className={`${inputClass} resize-none`}
          />
        </Field>
      </Panel>
      <PrimaryButton
        disabled={!symptoms.trim() || stage === "loading"}
        onClick={() => {
          setStage("loading");
          setTimeout(() => setStage("done"), 1700);
        }}
      >
        Get guidance
      </PrimaryButton>

      {stage === "loading" && <Shimmer label="Preparing safe, simple guidance…" />}
      {stage === "done" && (
        <ResultCard
          agent="Health Agent"
          title="General care guidance"
          body={
            "This is guidance, not a diagnosis.\n\nAt home:\n• Rest and drink warm water often\n• Light food — khichdi, curd, fruit\n• Paracetamol as written on the strip, after food\n• Check temperature morning and night\n\nSee a doctor today if:\n• Fever stays above 102°F for two days\n• Breathing becomes difficult\n• There is chest pain, fits, or confusion\n\nNearest PHC: Rampur Health Centre, 4 km, opens 9 AM."
          }
          chips={["🚑 Ambulance 108", "💊 Set medicine reminder", "🏥 Nearby PHC"]}
        />
      )}
    </FeatureShell>
  );
}
