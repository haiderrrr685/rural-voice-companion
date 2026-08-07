import { useCallback, useEffect, useRef, useState } from "react";

type Recognition = {
  start: () => void;
  stop: () => void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function getRecognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, new () => Recognition>;
  return w["SpeechRecognition"] ?? w["webkitSpeechRecognition"] ?? null;
}

/**
 * Speech recognition with a graceful simulated fallback so the prototype
 * always works, even in browsers without the Web Speech API.
 */
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
      recRef.current?.stop();
    };
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
    if (timerRef.current) clearTimeout(timerRef.current);
    setListening(false);
  }, []);

  const listen = useCallback((onDone: (text: string) => void, fallbackText: string) => {
    const Ctor = getRecognitionCtor();
    setTranscript("");
    setListening(true);

    if (!Ctor) {
      timerRef.current = setTimeout(() => {
        setListening(false);
        setTranscript(fallbackText);
        onDone(fallbackText);
      }, 2200);
      return;
    }

    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = "en-IN";
    rec.continuous = false;
    rec.interimResults = true;
    let final = "";
    let settled = false;
    const finish = (text: string) => {
      if (settled) return;
      settled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      setListening(false);
      setTranscript(text);
      onDone(text);
    };
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i]?.[0]?.transcript ?? "";
      }
      final = text;
      setTranscript(text);
    };
    rec.onerror = () => finish(fallbackText);
    rec.onend = () => finish(final.trim() || fallbackText);
    // Safety net: never leave the prototype stuck in "Listening…".
    timerRef.current = setTimeout(() => {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      finish(final.trim() || fallbackText);
    }, 4000);
    try {
      rec.start();
    } catch {
      finish(fallbackText);
    }
  }, []);

  return { listen, stop, listening, transcript, supported };
}
