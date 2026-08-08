import { useCallback, useEffect, useRef, useState } from "react";
import { evaluateTranscriptLanguage } from "@/lib/gemini";
import {
  detectLanguageFromText,
  normaliseLanguageCode,
  type LanguageCode,
} from "@/lib/language-detect";

type Recognition = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

function getRecognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, new () => Recognition>;
  return w["SpeechRecognition"] ?? w["webkitSpeechRecognition"] ?? null;
}

export function useSpeech() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(false);
  const recRef = useRef<Recognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSupported(Boolean(getRecognitionCtor()));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setListening(false);
  }, []);

  const recognizeWithLocale = useCallback(
    (locale: string, onResult: (text: string) => void, fallbackText: string, timeoutMs = 8000) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) {
        // Simulated fallback for dev environments without SpeechRecognition
        timerRef.current = setTimeout(() => {
          setListening(false);
          setTranscript(fallbackText);
          onResult(fallbackText);
        }, 2200);
        return;
      }

      const rec = new Ctor();
      recRef.current = rec;
      rec.lang = locale;
      rec.continuous = false;
      rec.interimResults = true;

      // ──── DEBUG LOG 1: SpeechRecognition .lang ────
      console.log(`[LANG-DEBUG] SpeechRecognition instantiated with .lang="${rec.lang}"`);

      let final = "";
      let settled = false;

      const finish = (text: string) => {
        if (settled) return;
        settled = true;
        if (timerRef.current) clearTimeout(timerRef.current);
        setListening(false);
        setTranscript(text);
        onResult(text);
      };

      rec.onresult = (e) => {
        let text = "";
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i]?.[0]?.transcript ?? "";
        }
        final = text;
        setTranscript(text);
      };

      rec.onerror = (e) => {
        if (e.error === "no-speech" || e.error === "aborted") {
          finish(final.trim() || fallbackText);
        } else {
          finish(fallbackText);
        }
      };

      rec.onend = () => finish(final.trim() || fallbackText);

      timerRef.current = setTimeout(() => {
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
        finish(final.trim() || fallbackText);
      }, timeoutMs);

      try {
        rec.start();
      } catch {
        finish(fallbackText);
      }
    },
    [],
  );

  const listen = useCallback(
    (onDone: (text: string) => void, fallbackText: string, locale = "hi-IN") => {
      setTranscript("");
      setListening(true);
      recognizeWithLocale(locale, onDone, fallbackText);
    },
    [recognizeWithLocale],
  );

  const listenAndDetect = useCallback(
    (
      onDone: (
        text: string,
        detectedLangCode: LanguageCode,
        confidence: "high" | "medium" | "low",
      ) => void,
      fallbackText: string,
      initialLocale = "hi-IN",
    ) => {
      setTranscript("");
      setListening(true);

      // Start with the session/default locale, then test the languages promised
      // by this voice-first prototype. A successful evaluation returns a short
      // app language code, never a BCP-47 locale.
      const locales = Array.from(new Set([initialLocale, "hi-IN", "mr-IN", "en-IN"]));
      const results: { transcript: string; locale: string }[] = [];

      const attempt = async (index: number) => {
        if (index >= locales.length) {
          // All attempts failed (all gibberish or empty). Fall back to the longest transcript.
          const best = results.reduce(
            (prev, curr) => (curr.transcript.length > prev.transcript.length ? curr : prev),
            { transcript: fallbackText, locale: initialLocale },
          );
          const detected = detectLanguageFromText(best.transcript);
          onDone(best.transcript, normaliseLanguageCode(best.locale), detected.confidence);
          return;
        }

        const locale = locales[index] ?? initialLocale;

        recognizeWithLocale(
          locale,
          async (text) => {
            const status = await evaluateTranscriptLanguage(text);
            console.log(
              `[LANG-DEBUG] Attempt ${index + 1}: tried "${locale}", got: "${text}", Gemini says: ${status}`,
            );

            results.push({ transcript: text, locale });

            if (status === "GIBBERISH") {
              setTranscript("");
              setListening(true);
              attempt(index + 1);
            } else {
              // Gemini's evaluator identifies the spoken language; do not
              // confuse the recognition locale (e.g. mr-IN) with app state.
              const languageByStatus: Record<Exclude<typeof status, "GIBBERISH">, LanguageCode> = {
                HINDI: "hi",
                MARATHI: "mr",
                ENGLISH: "en",
              };
              const detected = detectLanguageFromText(text);
              onDone(
                text,
                languageByStatus[status],
                detected.confidence === "low" ? "medium" : detected.confidence,
              );
            }
          },
          fallbackText,
          8000,
        );
      };

      attempt(0);
    },
    [recognizeWithLocale],
  );

  return { listen, listenAndDetect, stop, listening, transcript, supported };
}
