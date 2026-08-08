/**
 * Text-to-Speech hook — auto-selects the best available voice
 * for the detected language and provides speaking state.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { SUPPORTED_LANGUAGES } from "@/lib/language-detect";

export function useTts() {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, []);

  /**
   * Find the best matching voice for a language code.
   * Falls back to any available voice.
   */
  const findVoice = useCallback((langCode: string): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    const langInfo = SUPPORTED_LANGUAGES[langCode];
    const speechCode = langInfo?.speechCode ?? `${langCode}-IN`;

    // Exact match
    let voice = voices.find((v) => v.lang.toLowerCase() === speechCode.toLowerCase());
    if (voice) return voice;

    // Prefix match (e.g. "hi" matches "hi-IN")
    voice = voices.find((v) => v.lang.toLowerCase().startsWith(langCode.toLowerCase()));
    if (voice) return voice;

    // Try English Indian
    voice = voices.find((v) => v.lang.toLowerCase().startsWith("en-in"));
    if (voice) return voice;

    // Try any English
    voice = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
    if (voice) return voice;

    // Return first available
    return voices[0] ?? null;
  }, []);

  /**
   * Speak text aloud. Auto-selects voice based on language.
   * Returns a promise that resolves when speaking is done.
   *
   * @param text  Text to speak
   * @param langCode  ISO language code — defaults to "hi" (NOT "en")
   */
  const speak = useCallback(
    (text: string, langCode = "hi"): Promise<void> => {
      return new Promise((resolve) => {
        if (!supported || !text.trim()) {
          resolve();
          return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utter = new SpeechSynthesisUtterance(text);
        utterRef.current = utter;

        const voice = findVoice(langCode);
        if (voice) utter.voice = voice;

        const langInfo = SUPPORTED_LANGUAGES[langCode];
        utter.lang = langInfo?.speechCode ?? `${langCode}-IN`;
        utter.rate = 0.9;
        utter.pitch = 1;

        // ──── DEBUG LOG: TTS language ────
        console.log(
          `[LANG-DEBUG] TTS: langCode="${langCode}", utter.lang="${utter.lang}", voice="${voice?.name ?? "default"}" (${voice?.lang ?? "none"})`,
        );

        utter.onstart = () => setSpeaking(true);
        utter.onend = () => {
          setSpeaking(false);
          resolve();
        };
        utter.onerror = () => {
          setSpeaking(false);
          resolve();
        };

        // Chrome requires voices to be loaded; retry once if empty
        if (window.speechSynthesis.getVoices().length === 0) {
          window.speechSynthesis.onvoiceschanged = () => {
            const v = findVoice(langCode);
            if (v) utter.voice = v;
            window.speechSynthesis.speak(utter);
          };
        } else {
          window.speechSynthesis.speak(utter);
        }
      });
    },
    [supported, findVoice],
  );

  /**
   * Stop current speech immediately.
   */
  const stop = useCallback(() => {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking, supported };
}
