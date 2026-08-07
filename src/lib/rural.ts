export type Greeting = {
  text: string;
  lang: string;
  /** polar position */
  angle: number;
  radius: number;
};

const raw: Array<[string, string]> = [
  ["Speak", "English"],
  ["बोलिए", "Hindi"],
  ["बोला", "Marathi"],
  ["બોલો", "Gujarati"],
  ["ਬੋਲੋ", "Punjabi"],
  ["பேசுங்கள்", "Tamil"],
  ["మాట్లాడండి", "Telugu"],
  ["സംസാരിക്കൂ", "Malayalam"],
  ["ಮಾತನಾಡಿ", "Kannada"],
  ["বলুন", "Bengali"],
  ["କୁହନ୍ତୁ", "Odia"],
  ["بولیے", "Urdu"],
  ["नमस्ते", "Hindi"],
  ["नमस्कार", "Marathi"],
  ["કેમ છો", "Gujarati"],
  ["ਸਤ ਸ੍ਰੀ ਅਕਾਲ", "Punjabi"],
  ["வணக்கம்", "Tamil"],
  ["నమస్కారం", "Telugu"],
  ["നമസ്കാരം", "Malayalam"],
  ["ನಮಸ್ಕಾರ", "Kannada"],
  ["স্বাগতম", "Bengali"],
  ["ନମସ୍କାର", "Odia"],
  ["آداب", "Urdu"],
  ["Welcome", "English"],
  ["Kem Cho", "Gujarati"],
  ["Vanakkam", "Tamil"],
  ["Namaskara", "Kannada"],
  ["Sat Sri Akal", "Punjabi"],
  ["Boliye", "Hindi"],
];

export const greetings: Greeting[] = raw.map(([text, lang], i) => {
  const golden = 2.399963;
  const angle = i * golden;
  const radius = 0.62 + 0.38 * Math.sqrt((i + 2) / (raw.length + 2));
  return { text: text as string, lang: lang as string, angle, radius };
});

export type Feature = {
  slug: string;
  emoji: string;
  title: string;
  desc: string;
  tint: string;
};

/**
 * Specialist cards for the home screen.
 * Agriculture and Govt Schemes are fully functional.
 * Others route to "coming soon" responses via the General agent.
 */
export const features: Feature[] = [
  {
    slug: "agriculture",
    emoji: "🌾",
    title: "Agriculture",
    desc: "Crop disease, soil & irrigation advice",
    tint: "oklch(0.94 0.06 145)",
  },
  {
    slug: "schemes",
    emoji: "🏛",
    title: "Govt Schemes",
    desc: "Find schemes you are eligible for",
    tint: "oklch(0.94 0.05 265)",
  },
  {
    slug: "documents",
    emoji: "📄",
    title: "Documents",
    desc: "Understand any official paper",
    tint: "oklch(0.95 0.03 90)",
  },
  {
    slug: "health",
    emoji: "❤️",
    title: "Health",
    desc: "Symptoms, care & first aid",
    tint: "oklch(0.94 0.05 20)",
  },
  {
    slug: "market",
    emoji: "💰",
    title: "Market Prices",
    desc: "Mandi rates & selling advice",
    tint: "oklch(0.95 0.06 95)",
  },
  {
    slug: "education",
    emoji: "📚",
    title: "Education",
    desc: "Homework help & learning",
    tint: "oklch(0.94 0.05 300)",
  },
];

export const suggestedPrompts = [
  "Why are my crop leaves yellow?",
  "What schemes can I apply for?",
  "What documents do I need for KCC?",
  "When should I water my tomatoes?",
  "Tell me a story",
];
