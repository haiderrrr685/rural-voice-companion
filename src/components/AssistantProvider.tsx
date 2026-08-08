import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from "react";
import { processQuery, type AgentResponse } from "@/lib/nexus-engine";
import {
  detectLanguageFromText,
  normaliseLanguageCode,
  getLanguageInfo,
  type LanguageInfo,
  SUPPORTED_LANGUAGES,
} from "@/lib/language-detect";
import { isGeminiConfigured, processWithGemini, getErrorMessage } from "@/lib/gemini";
import { saveExchange } from "@/lib/offline-cache";

type AssistantState = {
  langCode: string;
  languageInfo: LanguageInfo;
  language: string;
  languageConfirmed: boolean;
  setLanguage: (code: string) => void;
  confirmLanguage: () => void;
  detectLanguage: (text: string) => {
    langCode: string;
    confidence: string;
    languageInfo: LanguageInfo;
  };
  /** Process a user message — tries Gemini API, falls back to local engine */
  processMessage: (
    text: string,
    signal?: AbortSignal,
    languageOverride?: string,
  ) => Promise<AgentResponse>;
  chatOpen: boolean;
  openChat: (seed?: string) => void;
  closeChat: () => void;
  seed: string | null;
  clearSeed: () => void;
};

const Ctx = createContext<AssistantState | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [langCode, setLangCode] = useState("hi");
  const [languageConfirmed, setLanguageConfirmed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [seed, setSeed] = useState<string | null>(null);

  const languageInfo = getLanguageInfo(langCode);
  const language = languageInfo.name;

  const setLanguage = useCallback((code: string) => {
    const normalised = normaliseLanguageCode(code);
    console.log(
      `[LANG-DEBUG] State: langCode="${normalised}" (${getLanguageInfo(normalised).name})`,
    );
    setLangCode(normalised);
  }, []);

  const confirmLanguage = useCallback(() => {
    setLanguageConfirmed(true);
  }, []);

  const detectLanguage = useCallback(
    (text: string) => {
      const result = detectLanguageFromText(text);
      if (result.confidence !== "low") {
        setLanguage(result.langCode);
      }
      return result;
    },
    [setLanguage],
  );

  const processMessage = useCallback(
    async (
      text: string,
      signal?: AbortSignal,
      languageOverride?: string,
    ): Promise<AgentResponse> => {
      // Detect language from incoming text
      const detection = detectLanguageFromText(text);
      let currentLangCode = languageOverride ? normaliseLanguageCode(languageOverride) : langCode;

      if (!languageOverride && detection.confidence !== "low") {
        currentLangCode = detection.langCode;
        setLangCode(detection.langCode);
      }

      const currentLangInfo = getLanguageInfo(currentLangCode);
      const targetLanguage = currentLangInfo.name;

      console.log(
        `[LANG-DEBUG] LLM: language="${targetLanguage}" (${currentLangCode}), gemini=${isGeminiConfigured()}`,
      );

      // Try Gemini API first — fall back to local engine
      if (isGeminiConfigured() && navigator.onLine) {
        try {
          const geminiResult = await processWithGemini(text, targetLanguage, signal);

          saveExchange(text, geminiResult.answer, geminiResult.agent, targetLanguage);

          return {
            answer: geminiResult.answer,
            agent: geminiResult.agent,
            confidence: geminiResult.confidence,
            needsClarification: false,
            clarifyingQuestion: null,
          };
        } catch (err) {
          const errorCode = err instanceof Error ? err.message : "DEFAULT";
          console.warn(`[Gemini] Failed (${errorCode}), using local fallback`);

          // If it's a real API error (not just missing key), return error message
          if (errorCode !== "NO_API_KEY") {
            return {
              answer: getErrorMessage(errorCode, currentLangCode),
              agent: "general",
              confidence: "low",
              needsClarification: false,
              clarifyingQuestion: null,
            };
          }
          // NO_API_KEY → fall through to local engine
        }
      }

      // Local fallback (offline or no API key)
      const response = processQuery(text, targetLanguage);
      saveExchange(text, response.answer, response.agent, targetLanguage);
      return response;
    },
    [langCode],
  );

  const value = useMemo<AssistantState>(
    () => ({
      langCode,
      languageInfo,
      language,
      languageConfirmed,
      setLanguage,
      confirmLanguage,
      detectLanguage,
      processMessage,
      chatOpen,
      seed,
      openChat: (s?: string) => {
        setSeed(s ?? null);
        setChatOpen(true);
      },
      closeChat: () => setChatOpen(false),
      clearSeed: () => setSeed(null),
    }),
    [
      langCode,
      languageInfo,
      language,
      languageConfirmed,
      setLanguage,
      confirmLanguage,
      detectLanguage,
      processMessage,
      chatOpen,
      seed,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAssistant() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAssistant must be used inside AssistantProvider");
  return ctx;
}
