/**
 * Gemini API client — fetch-based, no dependencies.
 *
 * Uses VITE_GEMINI_API_KEY from environment.
 * Falls back gracefully when key is missing (caller should catch).
 *
 * ponytail: client-side key exposure is acceptable for this demo.
 * Production should proxy through a server route.
 */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Fast model for routing (cheap, low latency)
const ROUTER_MODEL = "gemini-2.0-flash-lite";
// Stronger model for agent responses
const AGENT_MODEL = "gemini-2.0-flash";

function getApiKey(): string | null {
  try {
    return (import.meta as Record<string, Record<string, string>>).env
      ?.VITE_GEMINI_API_KEY ?? null;
  } catch {
    return null;
  }
}

/** Check if Gemini is configured (key present and non-placeholder) */
export function isGeminiConfigured(): boolean {
  const key = getApiKey();
  return Boolean(key && key !== "your_api_key_here" && key.length > 10);
}

/**
 * Raw Gemini generateContent call.
 * Throws on any error — callers must handle.
 */
async function callGemini(
  prompt: string,
  systemInstruction: string,
  model: string,
  temperature = 0.7,
  maxTokens = 1024,
  signal?: AbortSignal,
): Promise<string> {
  const key = getApiKey();
  if (!key || key === "your_api_key_here") {
    throw new Error("NO_API_KEY");
  }

  const res = await fetch(`${API_BASE}/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
    signal,
  });

  if (!res.ok) {
    const status = res.status;
    if (status === 429) throw new Error("RATE_LIMITED");
    if (status === 401 || status === 403) throw new Error("BAD_API_KEY");
    throw new Error(`API_ERROR_${status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("EMPTY_RESPONSE");
  return text;
}

// ─── Routing Classifier ────────────────────────────────────────────

const ROUTER_SYSTEM = `You classify messages from rural Indian farmers into exactly one category.
Reply with ONLY one word — no explanation, no punctuation:
EMERGENCY — distress, immediate danger, accidents, injuries, severe health crises, needing police/ambulance/fire
AGRICULTURE — anything about crops, soil, pests, irrigation, fertilizer, seeds, harvest, weather for farming
GOVERNMENT — anything about schemes, subsidies, loans, insurance, documents, eligibility, applications
GENERAL — anything else (health, education, market prices, stories, greetings)`;

export type AgentCategory = "agriculture" | "government" | "general" | "emergency";

export async function classifyIntent(message: string, signal?: AbortSignal): Promise<AgentCategory> {
  const result = await callGemini(message, ROUTER_SYSTEM, ROUTER_MODEL, 0.1, 10, signal);
  const lower = result.trim().toLowerCase();
  if (lower.includes("emergency")) return "emergency";
  if (lower.includes("agriculture")) return "agriculture";
  if (lower.includes("government")) return "government";
  return "general";
}

// ─── Agent Response ────────────────────────────────────────────────

const AGENT_SYSTEMS: Record<AgentCategory, string> = {
  agriculture: `You are Krishi Mitra (कृषि मित्र), an expert agricultural advisor for rural Indian farmers.

Your expertise: crop diseases, pest ID & treatment, soil health, fertilizers (organic & chemical), irrigation timing, sowing schedules, seed selection, harvest timing, post-harvest storage, weather decisions.

Guidelines:
- Give specific, practical advice (exact quantities, timing, methods)
- Mention affordable solutions (neem oil, vermicompost, local KVK resources)
- Always mention Krishi Vigyan Kendra (KVK) for serious/complex issues
- Kisan Call Centre: 1800-180-1551 (toll-free)
- Keep responses concise but complete — actionable info, not lectures
- Use bullet points for steps
- If you need more info to give good advice, ask ONE clarifying question at the end`,

  government: `You are Yojana Sahayak (योजना सहायक), an expert on Indian government welfare schemes for rural citizens.

Your expertise: PM-KISAN, PMFBY (crop insurance), Kisan Credit Card (KCC), PM Awas Yojana (rural housing), Ayushman Bharat / PM-JAY (health insurance), MGNREGA, and state-specific schemes.

For each scheme explain: benefit amount, eligibility, documents needed, how/where to apply, deadlines.

Guidelines:
- Always mention nearest Common Service Centre (CSC) for application help
- Give specific document lists
- Include relevant helpline numbers
- Be encouraging — many eligible people don't apply because they think it's complicated
- If unsure which scheme the user needs, list 2-3 relevant options briefly`,

  general: `You are a helpful AI assistant for rural Indian communities.

You can help with general questions, health guidance (always recommend seeing a doctor for medical issues), education resources (DIKSHA app, Swayam Prabha), market information (direct to Kisan Call Centre 1800-180-1551 or eNAM app for prices), and conversation.

Guidelines:
- For health emergencies: 108 (ambulance), 104 (health helpline)
- For crop/farming questions, be helpful but mention you can give better advice if they ask specifically about farming
- Keep responses warm, practical, and respectful`,
};

export async function getAgentResponse(
  message: string,
  agent: AgentCategory,
  language: string,
  signal?: AbortSignal,
): Promise<string> {
  const langInstruction = `\n\nCRITICAL LANGUAGE RULE: You MUST respond in ${language}. If the user writes in Hindi, respond in Hindi. If Marathi, respond in Marathi. If English, respond in English. Match the user's language exactly. Never switch to English unless the user wrote in English.`;

  const system = AGENT_SYSTEMS[agent] + langInstruction;
  return callGemini(message, system, AGENT_MODEL, 0.7, 1024, signal);
}

// ─── Full Pipeline ─────────────────────────────────────────────────

export interface GeminiResponse {
  answer: string;
  agent: AgentCategory;
  confidence: "high" | "medium" | "low";
}

/**
 * Full Gemini pipeline: classify → route → respond.
 * Two API calls: one fast (router), one full (agent).
 */
export async function processWithGemini(
  message: string,
  language: string,
  signal?: AbortSignal,
): Promise<GeminiResponse> {
  const agent = await classifyIntent(message, signal);

  // If it's an emergency, short-circuit and don't call the full agent
  if (agent === "emergency") {
    return {
      answer: "EMERGENCY_TRIGGER",
      agent,
      confidence: "high",
    };
  }

  const answer = await getAgentResponse(message, agent, language, signal);

  return {
    answer,
    agent,
    confidence: "high",
  };
}

// ─── Vision (Crop Disease Detection) ───────────────────────────────

const VISION_SYSTEM = `You are an expert agricultural advisor. Identify any disease, pest, or nutrient deficiency visible in this crop photo.

Rules:
- Be specific: name the disease/pest/deficiency
- Give a confidence level (high/medium/low)
- List locally available, affordable remedies (exact quantities)
- Include one organic alternative
- If the image is unclear or not a crop, say so honestly and ask the user to describe the problem instead
- Keep it short — bullet points, no jargon`;

export interface VisionResponse {
  answer: string;
  agent: "agriculture";
  confidence: "high" | "medium" | "low";
}

/**
 * Send a crop photo to Gemini Vision for disease detection.
 * imageBase64 should be the raw base64 string (without the data:image/... prefix).
 */
export async function askNexusVision(
  imageBase64: string,
  mimeType: string,
  language: string,
  signal?: AbortSignal,
): Promise<VisionResponse> {
  const key = getApiKey();
  if (!key || key === "your_api_key_here") {
    throw new Error("NO_API_KEY");
  }

  const langInstruction = `\n\nCRITICAL: Respond ONLY in ${language}. Never switch to English unless the user's language is English.`;

  const res = await fetch(`${API_BASE}/${AGENT_MODEL}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: VISION_SYSTEM + langInstruction }] },
      contents: [{
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: "Identify what's wrong with this crop and suggest treatment." },
        ],
      }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
    }),
    signal,
  });

  if (!res.ok) {
    const status = res.status;
    if (status === 429) throw new Error("RATE_LIMITED");
    if (status === 401 || status === 403) throw new Error("BAD_API_KEY");
    throw new Error(`API_ERROR_${status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("EMPTY_RESPONSE");

  return { answer: text, agent: "agriculture", confidence: "high" };
}

// ─── Localized Error Messages ──────────────────────────────────────

const ERROR_MESSAGES: Record<string, Record<string, string>> = {
  NO_API_KEY: {
    hi: "AI सेवा अभी उपलब्ध नहीं है। कृपया बाद में फिर से कोशिश करें।",
    mr: "AI सेवा सध्या उपलब्ध नाही. कृपया नंतर पुन्हा प्रयत्न करा.",
    en: "AI service is not available right now. Please try again later.",
  },
  RATE_LIMITED: {
    hi: "बहुत सारे सवाल एक साथ आ रहे हैं। कृपया कुछ सेकंड बाद फिर से पूछें।",
    mr: "एकाच वेळी खूप प्रश्न येत आहेत. कृपया काही सेकंदांनी पुन्हा विचारा.",
    en: "Too many questions at once. Please ask again in a few seconds.",
  },
  BAD_API_KEY: {
    hi: "AI सेवा का कनेक्शन ठीक नहीं है। कृपया बाद में कोशिश करें।",
    mr: "AI सेवेचे कनेक्शन ठीक नाही. कृपया नंतर प्रयत्न करा.",
    en: "AI service connection issue. Please try again later.",
  },
  DEFAULT: {
    hi: "मुझे जवाब देने में समस्या हो रही है, फिर से कोशिश करें।",
    mr: "मला उत्तर देण्यात समस्या येत आहे, पुन्हा प्रयत्न करा.",
    en: "I'm having trouble responding. Please try again.",
  },
};

export function getErrorMessage(errorCode: string, langCode: string): string {
  const msgs = ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.DEFAULT;
  return msgs[langCode] ?? msgs.hi ?? msgs.en;
}
