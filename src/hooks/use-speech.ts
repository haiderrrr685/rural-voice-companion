import { useCallback, useEffect, useRef, useState } from "react";
import {
  detectLanguageFromText,
  shouldRetryWithLocale,
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
    (
      locale: string,
      onResult: (text: string) => void,
      fallbackText: string,
      timeoutMs = 8000,
    ) => {
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
    (
      onDone: (text: string) => void,
      fallbackText: string,
      locale = "hi-IN",
    ) => {
      setTranscript("");
      setListening(true);
      recognizeWithLocale(locale, onDone, fallbackText);
    },
    [recognizeWithLocale],
  );

  const listenAndDetect = useCallback(
    (
      onDone: (text: string, detectedLangCode: string) => void,
      fallbackText: string,
      initialLocale = "hi-IN",
    ) => {
      setTranscript("");
      setListening(true);

      recognizeWithLocale(
        initialLocale,
        (firstTranscript) => {
          const detection = detectLanguageFromText(firstTranscript);
          const retryLocale = shouldRetryWithLocale(firstTranscript, initialLocale);

          if (retryLocale && retryLocale !== initialLocale) {
            console.log(`[LANG-DEBUG] Locale mismatch detected. Retrying with "${retryLocale}"`);
            setTranscript("");
            setListening(true);

            recognizeWithLocale(
              retryLocale,
              (retryTranscript) => {
                const retryDetection = detectLanguageFromText(retryTranscript);
                onDone(retryTranscript, retryDetection.langCode);
              },
              fallbackText,
              8000,
            );
          } else {
            onDone(firstTranscript, detection.langCode);
          }
        },
        fallbackText,
        8000,
      );
    },
    [recognizeWithLocale],
  );

  return { listen, listenAndDetect, stop, listening, transcript, supported };
}
