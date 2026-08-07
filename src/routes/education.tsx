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

export const Route = createFileRoute("/education")({
  head: () => ({
    meta: [
      { title: "Education Assistant — Rural AI" },
      {
        name: "description",
        content:
          "Ask any homework question and get a simple spoken explanation, plus practice questions for children.",
      },
      { property: "og:title", content: "Education Assistant — Rural AI" },
      {
        property: "og:description",
        content: "Homework help, concept explanations and scholarship guidance.",
      },
    ],
  }),
  component: Education,
});

function Education() {
  const [q, setQ] = useState("Why does it rain?");
  const [stage, setStage] = useState<"idle" | "loading" | "done">("idle");

  return (
    <FeatureShell emoji="📚" title="Education" subtitle="Homework help and learning">
      <Panel>
        <Field label="What should I explain?">
          <input className={inputClass} value={q} onChange={(e) => setQ(e.target.value)} />
        </Field>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Why does it rain?", "Explain photosynthesis", "Fractions for class 5"].map((s) => (
            <button
              key={s}
              onClick={() => setQ(s)}
              className="rounded-full bg-secondary px-3 py-1.5 text-xs"
            >
              {s}
            </button>
          ))}
        </div>
      </Panel>
      <PrimaryButton
        disabled={stage === "loading"}
        onClick={() => {
          setStage("loading");
          setTimeout(() => setStage("done"), 1600);
        }}
      >
        Explain simply
      </PrimaryButton>

      {stage === "loading" && <Shimmer label="Writing a simple explanation…" />}
      {stage === "done" && (
        <ResultCard
          agent="Education Agent"
          title={q}
          body={
            "Simple explanation:\nThe sun heats water in rivers, ponds and fields. That water turns into vapour and rises into the sky. High above, the air is cold, so the vapour turns back into tiny drops. Many drops together make a cloud. When the drops become heavy, they fall down — that is rain.\n\nPractice questions:\n1. What makes water rise into the sky?\n2. Why do the drops fall down?\n3. Name one thing that happens to fields after rain."
          }
          chips={["🗣 Read aloud", "📝 3 practice questions", "🎓 Scholarships"]}
        />
      )}
    </FeatureShell>
  );
}
