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
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      final = text;
      setTranscript(text);
    };
    rec.onerror = () => {
      setListening(false);
      setTranscript(fallbackText);
      onDone(fallbackText);
    };
    rec.onend = () => {
      setListening(false);
      const text = final.trim() || fallbackText;
      setTranscript(text);
      onDone(text);
    };
    try {
      rec.start();
    } catch {
      setListening(false);
      onDone(fallbackText);
    }
  }, []);

  return { listen, stop, listening, transcript, supported };
}
