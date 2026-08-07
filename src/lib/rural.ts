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
  ["কওক", "Assamese"],
  ["କୁହନ୍ତୁ", "Odia"],
  ["بولیے", "Urdu"],
  ["उलय", "Konkani"],
  ["बाजू", "Maithili"],
  ["वदतु", "Sanskrit"],
  ["ؤنیو", "Kashmiri"],
  ["नमस्ते", "Hindi"],
  ["नमस्कार", "Marathi"],
  ["કેમ છો", "Gujarati"],
  ["ਸਤ ਸ੍ਰੀ ਅਕਾਲ", "Punjabi"],
  ["வணக்கம்", "Tamil"],
  ["నమస్కారం", "Telugu"],
  ["നമസ്കാരം", "Malayalam"],
  ["ನಮಸ್ಕಾರ", "Kannada"],
  ["স্বাগতম", "Bengali"],
  ["নমস্কাৰ", "Assamese"],
  ["ନମସ୍କାର", "Odia"],
  ["آداب", "Urdu"],
  ["स्वागतम्", "Sanskrit"],
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
  {
    slug: "livestock",
    emoji: "🐄",
    title: "Livestock",
    desc: "Animal health & feed guidance",
    tint: "oklch(0.95 0.04 60)",
  },
  {
    slug: "emergency",
    emoji: "🚨",
    title: "Emergency",
    desc: "Helplines & urgent guidance",
    tint: "oklch(0.93 0.07 25)",
  },
];

export const suggestedPrompts = [
  "Why are my crop leaves yellow?",
  "What schemes can I apply for?",
  "Explain this document",
  "Help my child study",
  "Tell me a story",
];

type Reply = { agent: string; text: string };

const rules: Array<{ match: RegExp; reply: Reply }> = [
  {
    match: /leaf|leaves|crop|wheat|tomato|pest|fertil|soil|irrigat|yellow/i,
    reply: {
      agent: "Agriculture Agent",
      text: "This looks like a nitrogen deficiency with early leaf blight.\n\n• Spray 2% urea solution in the evening for 3 days\n• Remove and burn badly spotted leaves\n• Avoid watering the leaves — water at the roots\n• Organic option: neem oil 5 ml per litre, twice a week\n\nIf spots spread after 5 days, share a fresh photo with me.",
    },
  },
  {
    match: /scheme|subsid|pension|yojana|govern|apply|loan/i,
    reply: {
      agent: "Government Agent",
      text: "Based on what you told me, three schemes look useful:\n\n1. PM-KISAN — ₹6,000 a year, paid in 3 parts. Need: Aadhaar, land record, bank passbook.\n2. PM Fasal Bima Yojana — crop insurance at ~2% premium. Apply before the sowing deadline.\n3. Kisan Credit Card — low interest crop loan up to ₹3 lakh.\n\nShall I explain the documents for the first one?",
    },
  },
  {
    match: /document|paper|letter|notice|bill|aadhaar/i,
    reply: {
      agent: "Document Agent",
      text: "I read the paper. In simple words:\n\nThis is a land record correction notice from the tehsil office. It asks you to visit with your original land papers.\n\n📅 Important date: 12th of next month\n📎 Carry: Aadhaar, old khasra copy, one photo\n⚠️ Missing: your signature on page 2.",
    },
  },
  {
    match: /fever|pain|health|doctor|medicine|pregnan|child|vaccin/i,
    reply: {
      agent: "Health Agent",
      text: "This is general guidance, not a diagnosis.\n\n• Drink warm water often and rest\n• Light food — khichdi, curd, fruits\n• Check temperature twice a day\n\nSee a doctor today if there is difficulty breathing, chest pain, or fever above 102°F for 2 days. Nearest PHC is about 4 km away and opens at 9 AM.",
    },
  },
  {
    match: /price|mandi|sell|market|rate/i,
    reply: {
      agent: "Market Agent",
      text: "Today's nearby mandi rates:\n\n• Wheat — ₹2,340 / quintal (▲ 3% this week)\n• Onion — ₹1,180 / quintal (▼ 2%)\n• Soybean — ₹4,620 / quintal (▲ 1%)\n\nAdvice: hold wheat for 4–6 days, prices are rising with steady demand.",
    },
  },
  {
    match: /study|homework|school|explain|exam|maths|scholar/i,
    reply: {
      agent: "Education Agent",
      text: "Let me explain it simply.\n\nRain happens because the sun heats water in rivers and fields. That water becomes vapour and rises. High in the sky it gets cold, joins into droplets, forms clouds, and finally falls back as rain.\n\nWant me to give your child 3 practice questions on this?",
    },
  },
  {
    match: /cow|buffalo|goat|milk|animal|cattle|livestock/i,
    reply: {
      agent: "Livestock Agent",
      text: "The signs suggest a mild case of foot-and-mouth risk.\n\n• Keep the animal separate from the herd\n• Clean the hooves with warm salt water twice a day\n• Soft green fodder + clean water\n• Call the veterinary officer for the FMD vaccine — it is free at the block centre.",
    },
  },
  {
    match: /emergency|fire|flood|accident|ambulance|help me now|police/i,
    reply: {
      agent: "Emergency Agent",
      text: "Stay calm. Do this now:\n\n📞 Ambulance 108 · Police 100 · Disaster 1077 · Women 181\n\n• Move to higher, open ground\n• Keep Aadhaar and medicines in one bag\n• Do not walk through moving water above the knee.",
    },
  },
];

export function mockReply(input: string): Reply {
  const rule = rules.find((r) => r.match.test(input));
  if (rule) return rule.reply;
  return {
    agent: "General AI",
    text: "I understood you. Here is my answer in simple words — I can also read it aloud in your language.\n\nAsk me anything: about your crops, a government paper, your child's homework, prices in the mandi, or your family's health. You can just speak, no need to type.",
  };
}
