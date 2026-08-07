import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FeatureShell, PrimaryButton, ResultCard, Shimmer } from "@/components/FeatureShell";
import { ImagePicker } from "@/components/ImagePicker";

export const Route = createFileRoute("/livestock")({
  head: () => ({
    meta: [
      { title: "Livestock Care — Rural AI" },
      {
        name: "description",
        content:
          "Photograph your animal for health suggestions, feed advice, vaccination reminders and milk guidance.",
      },
      { property: "og:title", content: "Livestock Care — Rural AI" },
      {
        property: "og:description",
        content: "Animal health, feed and vaccination guidance for cattle and goats.",
      },
    ],
  }),
  component: Livestock,
});

function Livestock() {
  const [image, setImage] = useState<string | null>(null);
  const [stage, setStage] = useState<"idle" | "loading" | "done">("idle");

  return (
    <FeatureShell emoji="🐄" title="Livestock Care" subtitle="Animal health and feed guidance">
      <ImagePicker
        hint="Show the animal's face, hooves or affected area"
        onPick={(url) => {
          setImage(url);
          setStage("idle");
        }}
      />
      <PrimaryButton
        disabled={!image || stage === "loading"}
        onClick={() => {
          setStage("loading");
          setTimeout(() => setStage("done"), 2000);
        }}
      >
        Check animal health
      </PrimaryButton>

      {stage === "loading" && <Shimmer label="Checking coat, eyes and posture…" />}
      {stage === "done" && (
        <ResultCard
          agent="Livestock Agent"
          title="Early signs of foot-and-mouth risk"
          body={
            "Confidence: 84%\n\nWhat I see:\nSlight drooling and reluctance to stand suggests hoof soreness. This can be an early foot-and-mouth sign.\n\nDo today:\n• Keep this animal separate from the herd\n• Wash hooves with warm salt water twice a day\n• Soft green fodder and plenty of clean water\n• Call the block veterinary officer — the FMD vaccine is free\n\nMilk: expect a temporary drop of 15–20%. It should recover in about ten days."
          }
          chips={["🩺 Vet: 1962", "💉 FMD vaccine due", "🌾 Soft fodder"]}
        />
      )}
    </FeatureShell>
  );
}
