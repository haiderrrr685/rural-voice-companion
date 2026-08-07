import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  FeatureShell,
  PrimaryButton,
  ResultCard,
  Shimmer,
} from "@/components/FeatureShell";
import { ImagePicker } from "@/components/ImagePicker";
import { askNexusVision, getErrorMessage, isGeminiConfigured } from "@/lib/gemini";
import { useAssistant } from "@/components/AssistantProvider";

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
  const [stage, setStage] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<string>("");
  const { language, langCode } = useAssistant();

  const analyse = async () => {
    if (!image) return;
    setStage("loading");

    try {
      // Extract base64 and mime type from data URL
      const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) {
        setResult("Could not read the image. Please try another photo.");
        setStage("error");
        return;
      }
      const [, mimeType, base64] = match;

      const response = await askNexusVision(base64, mimeType, language);
      setResult(response.answer);
      setStage("done");
    } catch (err: any) {
      const code = err?.message || "DEFAULT";
      setResult(getErrorMessage(code, langCode));
      setStage("error");
    }
  };

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
          setResult("");
        }}
      />
      <PrimaryButton
        disabled={!image || stage === "loading"}
        onClick={analyse}
      >
        {stage === "done" || stage === "error" ? "Analyse again" : "Analyse crop"}
      </PrimaryButton>

      {stage === "loading" && <Shimmer label="Looking at leaf colour, spots and veins…" />}
      {(stage === "done" || stage === "error") && (
        <ResultCard
          agent="Agriculture Agent"
          title={stage === "error" ? "Error" : "Analysis Result"}
          body={result}
          chips={stage === "done" ? [
            ...(isGeminiConfigured() ? ["Powered by Gemini Vision"] : []),
            "Recheck in 5 days",
          ] : []}
        />
      )}
    </FeatureShell>
  );
}
