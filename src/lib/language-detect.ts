/**
 * Language detection from text — uses Unicode script ranges to identify
 * Indian languages without requiring an API call.
 *
 * Strategy:
 * 1. SpeechRecognition captures speech (with hi-IN as default locale)
 * 2. We analyse the transcript's Unicode characters to detect the script
 * 3. Script → language mapping for Indian languages
 * 4. For Devanagari, disambiguate between Hindi and Marathi using marker words
 */

export interface LanguageInfo {
  code: string; // BCP 47 locale code for SpeechRecognition
  name: string; // Human-readable name
  nativeName: string; // Name in the language itself
  speechCode: string; // Locale for SpeechSynthesis
}

export type LanguageCode =
  "hi" | "en" | "ta" | "te" | "bn" | "mr" | "gu" | "kn" | "ml" | "pa" | "or" | "ur" | "as";

export const SUPPORTED_LANGUAGES: Record<string, LanguageInfo> = {
  hi: {
    code: "hi-IN",
    name: "Hindi",
    nativeName: "हिन्दी",
    speechCode: "hi-IN",
  },
  en: {
    code: "en-IN",
    name: "English",
    nativeName: "English",
    speechCode: "en-IN",
  },
  ta: {
    code: "ta-IN",
    name: "Tamil",
    nativeName: "தமிழ்",
    speechCode: "ta-IN",
  },
  te: {
    code: "te-IN",
    name: "Telugu",
    nativeName: "తెలుగు",
    speechCode: "te-IN",
  },
  bn: {
    code: "bn-IN",
    name: "Bengali",
    nativeName: "বাংলা",
    speechCode: "bn-IN",
  },
  mr: {
    code: "mr-IN",
    name: "Marathi",
    nativeName: "मराठी",
    speechCode: "mr-IN",
  },
  gu: {
    code: "gu-IN",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    speechCode: "gu-IN",
  },
  kn: {
    code: "kn-IN",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    speechCode: "kn-IN",
  },
  ml: {
    code: "ml-IN",
    name: "Malayalam",
    nativeName: "മലയാളം",
    speechCode: "ml-IN",
  },
  pa: {
    code: "pa-IN",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    speechCode: "pa-IN",
  },
  or: {
    code: "or-IN",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    speechCode: "or-IN",
  },
  ur: {
    code: "ur-IN",
    name: "Urdu",
    nativeName: "اردو",
    speechCode: "ur-IN",
  },
  as: {
    code: "as-IN",
    name: "Assamese",
    nativeName: "অসমীয়া",
    speechCode: "as-IN",
  },
};

/** Convert a BCP-47 locale (for example `mr-IN`) to the app's short code. */
export function normaliseLanguageCode(value: string): LanguageCode {
  const code = value.toLowerCase().split("-")[0] ?? "";
  return code in SUPPORTED_LANGUAGES ? (code as LanguageCode) : "hi";
}

export function getLanguageInfo(code: string): LanguageInfo {
  return SUPPORTED_LANGUAGES[normaliseLanguageCode(code)]!;
}

/** Unicode script ranges for Indian languages */
const SCRIPT_RANGES: Array<{
  name: string;
  langCode: string;
  ranges: Array<[number, number]>;
}> = [
  {
    name: "Devanagari",
    langCode: "hi", // Could be Hindi or Marathi — disambiguated later
    ranges: [
      [0x0900, 0x097f],
      [0xa8e0, 0xa8ff],
    ],
  },
  {
    name: "Tamil",
    langCode: "ta",
    ranges: [[0x0b80, 0x0bff]],
  },
  {
    name: "Telugu",
    langCode: "te",
    ranges: [[0x0c00, 0x0c7f]],
  },
  {
    name: "Bengali",
    langCode: "bn",
    ranges: [[0x0980, 0x09ff]],
  },
  {
    name: "Gujarati",
    langCode: "gu",
    ranges: [[0x0a80, 0x0aff]],
  },
  {
    name: "Kannada",
    langCode: "kn",
    ranges: [[0x0c80, 0x0cff]],
  },
  {
    name: "Malayalam",
    langCode: "ml",
    ranges: [[0x0d00, 0x0d7f]],
  },
  {
    name: "Gurmukhi",
    langCode: "pa",
    ranges: [[0x0a00, 0x0a7f]],
  },
  {
    name: "Odia",
    langCode: "or",
    ranges: [[0x0b00, 0x0b7f]],
  },
  {
    name: "Arabic", // Urdu uses Arabic script
    langCode: "ur",
    ranges: [
      [0x0600, 0x06ff],
      [0x0750, 0x077f],
      [0xfb50, 0xfdff],
      [0xfe70, 0xfeff],
    ],
  },
];

function charInRange(code: number, ranges: Array<[number, number]>): boolean {
  return ranges.some(([lo, hi]) => code >= lo && code <= hi);
}

/**
 * Detect language from transcript text using Unicode script analysis.
 * Returns the language code (e.g. "hi", "ta", "en") and confidence level.
 */
export function detectLanguageFromText(text: string): {
  langCode: string;
  confidence: "high" | "medium" | "low";
  languageInfo: LanguageInfo;
} {
  if (!text.trim()) {
    return {
      langCode: "hi",
      confidence: "low",
      languageInfo: getLanguageInfo("hi"),
    };
  }

  // Count characters belonging to each script
  const scriptCounts: Record<string, number> = {};
  let totalAlpha = 0;
  let latinCount = 0;

  for (const char of text) {
    const code = char.codePointAt(0)!;

    // Skip spaces, punctuation, digits
    if (code <= 0x7e) {
      // ASCII letters
      if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) {
        latinCount++;
        totalAlpha++;
      }
      continue;
    }

    for (const script of SCRIPT_RANGES) {
      if (charInRange(code, script.ranges)) {
        scriptCounts[script.langCode] = (scriptCounts[script.langCode] ?? 0) + 1;
        totalAlpha++;
        break;
      }
    }
  }

  if (totalAlpha === 0) {
    return {
      langCode: "hi",
      confidence: "low",
      languageInfo: getLanguageInfo("hi"),
    };
  }

  // Find the dominant script
  const entries = Object.entries(scriptCounts);
  if (entries.length === 0) {
    // All Latin characters — English
    return {
      langCode: "en",
      confidence: latinCount > 3 ? "high" : "medium",
      languageInfo: getLanguageInfo("en"),
    };
  }

  entries.sort((a, b) => b[1] - a[1]);
  const [topLang, topCount] = entries[0]!;
  const ratio = topCount / totalAlpha;

  // If Latin is dominant over any Indic script, it's English
  if (latinCount > topCount && latinCount / totalAlpha > 0.6) {
    return {
      langCode: "en",
      confidence: "high",
      languageInfo: getLanguageInfo("en"),
    };
  }

  let langCode = topLang;
  const confidence = ratio > 0.7 ? "high" : ratio > 0.4 ? "medium" : "low";

  // Disambiguate Devanagari between Hindi and Marathi
  if (langCode === "hi") {
    langCode = disambiguateDevanagari(text);
  }

  return {
    langCode,
    confidence,
    languageInfo: getLanguageInfo(langCode),
  };
}

/**
 * Disambiguation Devanagari between Hindi and Marathi.
 * Uses common marker words. Defaults to Hindi if unsure.
 */
export function disambiguateDevanagari(text: string): "hi" | "mr" {
  const marathiMarkers =
    /(?:आहे|नाही|काय|तुम्ही|होतो|होती|आम्ही|कसे|पण|किंवा|आणि|हवे|नको|कुठे|माझ्या|तुमच्या|शेतात|पिकाला|पाने|पिवळे)/;
  const hindiMarkers =
    /(?:है|हैं|नहीं|क्या|तुम|हूँ|था|थी|कैसे|लेकिन|या|और|मेरा|मेरी|मेरे|कब|कहाँ|कौन|कैसा|पत्ते|पीले|फसल)/;

  const mrCount = (text.match(new RegExp(marathiMarkers.source, "g")) || []).length;
  const hiCount = (text.match(new RegExp(hindiMarkers.source, "g")) || []).length;

  return mrCount > hiCount ? "mr" : "hi";
}

/**
 * Mimics an LLM language identification prompt:
 * "Identify the language of this text. Respond with ONLY the ISO language code."
 *
 * Uses Unicode script analysis + keyword detection locally.
 * Function signature designed for easy swap to a real LLM API call.
 */
export function identifyLanguage(text: string): string {
  const { langCode } = detectLanguageFromText(text);
  return langCode;
}

/**
 * Determine the correct SpeechRecognition locale for a detected language.
 * If a session language is already confirmed, use that locale.
 * Otherwise, default to hi-IN (most common for target audience).
 */
export function getRecognitionLocale(sessionLangCode?: string): string {
  if (sessionLangCode && SUPPORTED_LANGUAGES[sessionLangCode]) {
    return SUPPORTED_LANGUAGES[sessionLangCode].code;
  }
  // Default: Hindi first (most common for rural Indian audience)
  return "hi-IN";
}

/**
 * Given a transcript that was captured with a mismatched locale,
 * determine if we need to retry with a different locale.
 *
 * Returns null if no retry needed, or the correct locale string.
 */
export function shouldRetryWithLocale(transcript: string, usedLocale: string): string | null {
  const detection = detectLanguageFromText(transcript);
  const detectedCode = detection.langCode;
  const detectedLocale = SUPPORTED_LANGUAGES[detectedCode]?.code;

  // If the detected language matches the used locale, no retry needed
  if (detectedLocale === usedLocale) return null;
  if (!detectedLocale) return null;

  // Only retry if confidence is high enough that we're sure of the mismatch
  if (detection.confidence === "low") return null;

  return detectedLocale;
}

/**
 * Get a spoken confirmation prompt for the detected language.
 * "I heard [language], is that correct?"
 */
export function getConfirmationPrompt(langCode: string): string {
  const prompts: Record<string, string> = {
    hi: "मैंने हिंदी में सुना, सही है?",
    en: "I heard English, is that correct?",
    ta: "நான் தமிழில் கேட்டேன், சரியா?",
    te: "నేను తెలుగులో విన్నాను, సరైనదా?",
    bn: "আমি বাংলায় শুনেছি, ঠিক আছে?",
    mr: "मी मराठीत ऐकलं, बरोबर आहे का?",
    gu: "મેં ગુજરાતીમાં સાંભળ્યું, બરાબર છે?",
    kn: "ನಾನು ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿದೆ, ಸರಿಯಾ?",
    ml: "ഞാൻ മലയാളത്തിൽ കേട്ടു, ശരിയാണോ?",
    pa: "ਮੈਂ ਪੰਜਾਬੀ ਵਿੱਚ ਸੁਣਿਆ, ਠੀਕ ਹੈ?",
    or: "ମୁଁ ଓଡ଼ିଆରେ ଶୁଣିଲି, ଠିକ୍ ଅଛି?",
    ur: "میں نے اردو میں سنا، ٹھیک ہے؟",
    as: "মই অসমীয়াত শুনিলোঁ, ঠিকেই আছে?",
  };

  return prompts[langCode] ?? prompts["en"]!;
}

/**
 * Check if a spoken response is affirmative (yes) in any Indian language.
 */
export function isAffirmative(text: string): boolean {
  const lower = text.toLowerCase().trim();
  const affirmatives = [
    // English
    "yes",
    "yeah",
    "yep",
    "yup",
    "correct",
    "right",
    "ok",
    "okay",
    // Hindi
    "हाँ",
    "हां",
    "हा",
    "जी",
    "जी हाँ",
    "सही",
    "ठीक",
    "बिल्कुल",
    // Marathi
    "हो",
    "होय",
    "बरोबर",
    // Tamil
    "ஆம்",
    "சரி",
    // Telugu
    "అవును",
    "సరే",
    // Bengali
    "হ্যাঁ",
    "ঠিক",
    // Gujarati
    "હા",
    "બરાબર",
    // Punjabi
    "ਹਾਂ",
    "ਠੀਕ",
    // Kannada
    "ಹೌದು",
    "ಸರಿ",
    // Malayalam
    "അതെ",
    "ശരി",
    // Romanized
    "haan",
    "ha",
    "ji",
    "sahi",
    "theek",
    "barobar",
  ];

  return affirmatives.some((a) => lower.includes(a));
}

/**
 * Check if a spoken response is negative (no) in any Indian language.
 */
export function isNegative(text: string): boolean {
  const lower = text.toLowerCase().trim();
  const negatives = [
    // English
    "no",
    "nope",
    "wrong",
    "incorrect",
    "not",
    // Hindi
    "नहीं",
    "ना",
    "गलत",
    // Marathi
    "नाही",
    "चुकीचे",
    // Tamil
    "இல்லை",
    // Telugu
    "కాదు",
    // Bengali
    "না",
    // Romanized
    "nahi",
    "naa",
    "galat",
  ];

  return negatives.some((a) => lower.includes(a));
}
