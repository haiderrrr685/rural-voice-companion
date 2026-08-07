import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FeatureShell, PrimaryButton, ResultCard, Shimmer } from "@/components/FeatureShell";
import { ImagePicker } from "@/components/ImagePicker";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Document Assistant — Rural AI" },
      {
        name: "description",
        content:
          "Photograph any official letter, bill or notice and get a simple summary with important dates.",
      },
      { property: "og:title", content: "Document Assistant — Rural AI" },
      {
        property: "og:description",
        content: "Land papers, bank letters and notices explained in plain language.",
      },
    ],
  }),
  component: Documents,
});

function Documents() {
  const [image, setImage] = useState<string | null>(null);
  const [stage, setStage] = useState<"idle" | "loading" | "done">("idle");

  return (
    <FeatureShell emoji="📄" title="Document Assistant" subtitle="Any paper, explained simply">
      <ImagePicker
        hint="Land papers, bank letters, bills, notices"
        onPick={(url) => {
          setImage(url);
          setStage("idle");
        }}
      />
      <PrimaryButton
        disabled={!image || stage === "loading"}
        onClick={() => {
          setStage("loading");
          setTimeout(() => setStage("done"), 2100);
        }}
      >
        Read this document
      </PrimaryButton>

      {stage === "loading" && <Shimmer label="Reading the text and finding key dates…" />}
      {stage === "done" && (
        <ResultCard
          agent="Document Agent"
          title="Land record correction notice — Tehsil office"
          body={
            "In simple words:\nThe tehsil office found a spelling mistake in your land record. They want you to come in person and correct it.\n\nWhat you must do:\n• Visit the tehsil office on any working day before the 12th\n• Carry your original khasra copy and Aadhaar\n• Ask for a stamped receipt after submitting\n\n⚠️ Page 2 is missing your signature — sign it before going.\n\nIf you miss the date, the correction request is closed and you must apply again with a ₹100 fee."
          }
          chips={["📅 Deadline: 12th", "📎 Aadhaar + khasra", "🗣 Read aloud"]}
        />
      )}
    </FeatureShell>
  );
}
