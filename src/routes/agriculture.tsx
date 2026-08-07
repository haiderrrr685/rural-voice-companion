import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  FeatureShell,
  PrimaryButton,
  ResultCard,
  Shimmer,
} from "@/components/FeatureShell";
import { ImagePicker } from "@/components/ImagePicker";

export const Route = createFileRoute("/agriculture")({
  head: () => ({
    meta: [
      { title: "Agriculture Assistant — Rural AI" },
      {
        name: "description",
        content:
          "Photograph your crop and get instant disease, pest and nutrient guidance with organic alternatives.",
      },
      { property: "og:title", content: "Agriculture Assistant — Rural AI" },
      {
        property: "og:description",
        content: "Crop disease detection, irrigation and fertilizer advice in your language.",
      },
    ],
  }),
  component: Agriculture,
});

function Agriculture() {
  const [image, setImage] = useState<string | null>(null);
  const [stage, setStage] = useState<"idle" | "loading" | "done">("idle");

  return (
    <FeatureShell
      emoji="🌾"
      title="Agriculture Assistant"
      subtitle="Crop health, soil and irrigation"
    >
      <ImagePicker
        hint="A clear photo of the affected leaf works best"
        onPick={(url) => {
          setImage(url);
          setStage("idle");
        }}
      />
      <PrimaryButton
        disabled={!image || stage === "loading"}
        onClick={() => {
          setStage("loading");
          setTimeout(() => setStage("done"), 2200);
        }}
      >
        {stage === "done" ? "Analyse again" : "Analyse crop"}
      </PrimaryButton>

      {stage === "loading" && <Shimmer label="Looking at leaf colour, spots and veins…" />}
      {stage === "done" && (
        <ResultCard
          agent="Agriculture Agent"
          title="Early leaf blight with nitrogen deficiency"
          body={
            "Confidence: 91%\n\nWhat is happening:\nBrown rings on older leaves show early blight. The pale yellow between veins shows the plant is short of nitrogen.\n\nWhat to do now:\n• Remove and burn the badly spotted leaves\n• Spray Mancozeb 2 g per litre, evening time, repeat after 7 days\n• Apply 20 kg urea per acre with the next irrigation\n• Water at the roots, never on the leaves\n\nOrganic option:\nNeem oil 5 ml per litre + buttermilk spray, twice a week."
          }
          chips={["Cost ≈ ₹450 / acre", "Recheck in 5 days", "Spray after 5 PM"]}
        />
      )}
    </FeatureShell>
  );
}
