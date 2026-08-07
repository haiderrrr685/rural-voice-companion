import { Camera } from "lucide-react";
import { useRef, useState } from "react";
import { motion } from "motion/react";

export function ImagePicker({
  hint,
  onPick,
}: {
  hint: string;
  onPick: (dataUrl: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const url = String(reader.result);
            setPreview(url);
            onPick(url);
          };
          reader.readAsDataURL(file);
        }}
      />
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => ref.current?.click()}
        className="grid w-full place-items-center overflow-hidden rounded-3xl border border-dashed border-border bg-card p-6 shadow-soft"
      >
        {preview ? (
          <img
            src={preview}
            alt="Selected preview"
            className="max-h-64 w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-secondary">
              <Camera className="size-5 text-primary" />
            </span>
            <p className="text-sm font-medium">Take or upload a photo</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        )}
      </motion.button>
    </div>
  );
}
