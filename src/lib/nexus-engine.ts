/**
 * Nexus Engine — Core routing + specialist agent functions.
 *
 * All classification and response logic is local (no API key required).
 * Function signatures are designed so swapping in real LLM calls later
 * requires minimal changes.
 *
 * Supports Hindi, Marathi, and English keywords for routing.
 * Responses are localized for Hindi, Marathi, and English.
 */

// ─── Types ──────────────────────────────────────────────────────────

export type AgentCategory = "AGRICULTURE" | "GOVERNMENT" | "GENERAL";
export type AgentId = "agriculture" | "government" | "general";
export type Confidence = "high" | "medium" | "low";

export interface AgentResponse {
  answer: string;
  needsClarification: boolean;
  clarifyingQuestion: string | null;
  confidence: Confidence;
  agent: AgentId;
}

// ─── Localization Helper ────────────────────────────────────────────

type LangKey = "en" | "hi" | "mr";

function langKeyFromName(language: string): LangKey {
  const l = language.toLowerCase();
  if (l === "hindi" || l === "hi") return "hi";
  if (l === "marathi" || l === "mr") return "mr";
  return "en";
}

function pick(lang: LangKey, en: string, hi: string, mr?: string): string {
  if (lang === "hi") return hi;
  if (lang === "mr") return mr ?? hi; // Marathi fallback to Hindi
  return en;
}

// ─── Route Query (Intent Classification) ────────────────────────────
// Patterns use \b for English words and raw Unicode for Devanagari/Indic
// (\b doesn't work with non-ASCII scripts)

const AGRICULTURE_KEYWORDS: Array<[RegExp, number]> = [
  // English
  [/\b(crop|crops)\b/i, 3],
  [/\b(wheat|rice|paddy|maize|bajra|jowar|ragi|sugarcane|cotton|soybean|mustard|groundnut|sunflower)\b/i, 4],
  [/\b(tomato|onion|potato|brinjal|chilli|okra|cauliflower|cabbage|pea|bean|lentil|dal)\b/i, 3],
  [/\b(leaf|leaves|yellow|brown|spots?|wilt|rot|blight|rust|mildew)\b/i, 3],
  [/\b(pest|insect|worm|caterpillar|aphid|whitefly|borer|mite|fungus|fungi)\b/i, 4],
  [/\b(fertili[sz]er|urea|dap|npk|potash|compost|manure|vermicompost)\b/i, 4],
  [/\b(irrigat|water(ing)?|drip|sprinkler|canal|borewell|tube\s?well)\b/i, 3],
  [/\b(soil|ph|salinity|sandy|clay|loam|acidic|alkaline)\b/i, 3],
  [/\b(sow(ing)?|plant(ing)?|transplant|seed|seedling|nursery)\b/i, 3],
  [/\b(harvest|yield|production|quintal|acre|hectare|bigha)\b/i, 2],
  [/\b(organic|neem|bio|pesticide|herbicide|insecticide|fungicide|spray)\b/i, 3],
  [/\b(disease|deficiency|nitrogen|phosphorus|potassium|zinc|iron)\b/i, 3],
  [/\b(weather|rain|monsoon|drought|frost|hail|flood)\b/i, 2],
  [/\b(farm|farming|khet|kheti|fasal)\b/i, 3],
  [/\b(mandi|market\s*price|rate)\b/i, 1],
  [/\b(mulch|prune|pruning|grafting|trellis)\b/i, 3],
  // Hindi (Devanagari)
  [/फसल|खेती|खेत/, 4],
  [/गेहूं|गेहूँ|धान|चावल|मक्का|बाजरा|ज्वार|गन्ना|कपास|सोयाबीन|सरसों/, 4],
  [/टमाटर|प्याज|आलू|बैंगन|मिर्च|भिंडी|गोभी|मटर|दाल/, 3],
  [/पत्ते|पत्ती|पत्तियां|पत्तियाँ|पीले|पीला|पीली|भूरे|धब्बे|सूख|मुरझा|गल/, 3],
  [/कीड़ा|कीड़े|कीट|इल्ली|माहू|सफेद मक्खी/, 4],
  [/खाद|यूरिया|डीएपी|उर्वरक|गोबर|कम्पोस्ट|वर्मी/, 4],
  [/सिंचाई|पानी\s*दे|पानी\s*कब|बोरवेल|नहर|ड्रिप/, 3],
  [/मिट्टी|जमीन|ज़मीन/, 3],
  [/बुवाई|बीज|पौध|रोपाई/, 3],
  [/कटाई|उपज|पैदावार|बीघा|एकड़/, 2],
  [/रोग|बीमारी|फफूंद|कीटनाशक|छिड़काव|नीम/, 3],
  [/बारिश|मानसून|सूखा|पाला/, 2],
  // Marathi
  [/पीक|शेती|शेत/, 4],
  [/गहू|भात|मका|ऊस|कापूस|सोयाबीन|मोहरी/, 4],
  [/टोमॅटो|कांदा|बटाटा|वांगे|मिरची|भेंडी|कोबी|मटार|डाळ/, 3],
  [/पाने|पिवळे|पिवळी|तपकिरी|डाग|सुक|कोमेज/, 3],
  [/कीड|किडे|अळी/, 4],
  [/खत|युरिया|कंपोस्ट|शेणखत/, 4],
  [/पाणी\s*द्या|पाणी\s*कधी|सिंचन|ठिबक/, 3],
  [/माती|जमीन/, 3],
  [/पेरणी|बियाणे|रोपे/, 3],
  [/काढणी|उत्पादन|उत्पन्न/, 2],
];

const GOVERNMENT_KEYWORDS: Array<[RegExp, number]> = [
  // English
  [/\b(scheme|schemes|yojana|yojna)\b/i, 5],
  [/\b(subsid|pension|benefit|grant|stipend)\b/i, 4],
  [/\b(govern|government|sarkari|sarkar)\b/i, 4],
  [/\b(pm[\s-]?kisan|pmkisan)\b/i, 6],
  [/\b(fasal\s*bima|pmfby|crop\s*insurance)\b/i, 6],
  [/\b(kisan\s*credit|kcc)\b/i, 6],
  [/\b(awas\s*yojana|pmay|housing\s*scheme)\b/i, 6],
  [/\b(ayushman|health\s*card|jan\s*arogya)\b/i, 6],
  [/\b(nrega|mnrega|mgnrega|employment\s*guarantee)\b/i, 6],
  [/\b(aadhaar|aadhar|pan\s*card|ration\s*card|voter\s*id)\b/i, 3],
  [/\b(eligib|apply|applicat|registr|enrol)\b/i, 3],
  [/\b(document|papers?\s*needed|what\s*documents?)\b/i, 3],
  [/\b(loan|credit|interest\s*rate)\b/i, 2],
  [/\b(csc|common\s*service|e[\s-]?mitra|jan\s*seva)\b/i, 4],
  [/\b(deadline|last\s*date|due\s*date)\b/i, 2],
  [/\b(bpl|below\s*poverty|small\s*farmer|marginal\s*farmer)\b/i, 3],
  // Hindi (Devanagari)
  [/योजना|योजनाएं|योजनाओं/, 5],
  [/सरकारी|सरकार|सब्सिडी|पेंशन|अनुदान/, 4],
  [/पीएम[\s-]?किसान|प्रधानमंत्री\s*किसान|किसान\s*सम्मान/, 6],
  [/फसल\s*बीमा|प्रधानमंत्री\s*फसल/, 6],
  [/किसान\s*क्रेडिट|केसीसी/, 6],
  [/आवास\s*योजना|पीएम\s*आवास|घर\s*बनाने/, 6],
  [/आयुष्मान|स्वास्थ्य\s*कार्ड|जन\s*आरोग्य/, 6],
  [/नरेगा|मनरेगा|रोज़गार\s*गारंटी|रोजगार\s*गारंटी/, 6],
  [/आधार|पैन\s*कार्ड|राशन\s*कार्ड/, 3],
  [/पात्रता|आवेदन|अर्ज|दस्तावेज|दस्तावेज़|कागज|कागज़ात/, 3],
  [/ऋण|लोन|कर्ज|ब्याज/, 2],
  [/छोटा\s*किसान|छोटे\s*किसान|गरीब/, 3],
  // Marathi
  [/योजना|सरकारी|सरकार/, 5],
  [/अनुदान|पेन्शन|सबसिडी/, 4],
  [/कागदपत्रे|कागद|दस्तऐवज/, 3],
  [/अर्ज|पात्रता|नोंदणी/, 3],
  [/शेतकरी\s*क्रेडिट|शेतकरी\s*कर्ज/, 6],
  [/विमा|पीक\s*विमा/, 6],
];

/**
 * Classify the user's message into AGRICULTURE, GOVERNMENT, or GENERAL.
 * Supports English, Hindi (Devanagari), and Marathi keywords.
 */
export function routeQuery(
  userMessage: string,
  _language?: string,
): { category: AgentCategory; agentId: AgentId; confidence: Confidence } {
  try {
    let agriScore = 0;
    let govtScore = 0;

    for (const [pattern, weight] of AGRICULTURE_KEYWORDS) {
      if (pattern.test(userMessage)) agriScore += weight;
    }
    for (const [pattern, weight] of GOVERNMENT_KEYWORDS) {
      if (pattern.test(userMessage)) govtScore += weight;
    }

    const maxScore = Math.max(agriScore, govtScore);

    if (maxScore === 0) {
      return { category: "GENERAL", agentId: "general", confidence: "medium" };
    }

    const diff = Math.abs(agriScore - govtScore);
    const confidence: Confidence = diff >= 4 ? "high" : diff >= 2 ? "medium" : "low";

    if (agriScore > govtScore) {
      return { category: "AGRICULTURE", agentId: "agriculture", confidence };
    }
    if (govtScore > agriScore) {
      return { category: "GOVERNMENT", agentId: "government", confidence };
    }

    return { category: "GENERAL", agentId: "general", confidence: "low" };
  } catch {
    return { category: "GENERAL", agentId: "general", confidence: "low" };
  }
}

// ─── Government Schemes Dataset ─────────────────────────────────────

export const SCHEMES_DATA = [
  {
    name: "PM-KISAN",
    fullName: "Pradhan Mantri Kisan Samman Nidhi",
    fullNameHi: "प्रधानमंत्री किसान सम्मान निधि",
    benefit: "₹6,000 per year, paid in 3 instalments of ₹2,000 directly to bank account",
    benefitHi: "साल में ₹6,000, 3 किस्तों में ₹2,000 सीधे बैंक खाते में",
    eligibility: "All landholding farmer families (subject to certain exclusion criteria). Both small and marginal farmers eligible.",
    eligibilityHi: "सभी जमीन वाले किसान परिवार (कुछ अपवाद हैं)। छोटे और सीमांत किसान भी पात्र।",
    documents: "Aadhaar card, land ownership records (khasra/khatauni), bank account passbook, mobile number",
    documentsHi: "आधार कार्ड, जमीन के कागज (खसरा/खतौनी), बैंक पासबुक, मोबाइल नंबर",
    howToApply: "Visit your local Common Service Centre (CSC), or apply online at pmkisan.gov.in. Your village patwari or lekhpal can help with land records.",
    howToApplyHi: "नज़दीकी जन सेवा केंद्र (CSC) जाएं, या pmkisan.gov.in पर ऑनलाइन करें। गांव के पटवारी या लेखपाल जमीन के कागज में मदद कर सकते हैं।",
    keywords: ["pm kisan", "pmkisan", "6000", "income support", "kisan samman", "instalment", "किसान सम्मान", "पीएम किसान"],
  },
  {
    name: "PMFBY",
    fullName: "Pradhan Mantri Fasal Bima Yojana (Crop Insurance)",
    fullNameHi: "प्रधानमंत्री फसल बीमा योजना",
    benefit: "Crop insurance at low premium — 2% for kharif, 1.5% for rabi, 5% for commercial/horticultural crops",
    benefitHi: "कम प्रीमियम पर फसल बीमा — खरीफ 2%, रबी 1.5%, बागवानी 5%",
    eligibility: "All farmers growing notified crops in notified areas. Both loanee and non-loanee farmers.",
    eligibilityHi: "अधिसूचित क्षेत्र में अधिसूचित फसल उगाने वाले सभी किसान। कर्ज लेने वाले और बिना कर्ज वाले दोनों।",
    documents: "Aadhaar card, bank passbook, land records, sowing certificate from patwari or village officer",
    documentsHi: "आधार कार्ड, बैंक पासबुक, जमीन के कागज, पटवारी या ग्राम अधिकारी से बुवाई प्रमाण पत्र",
    howToApply: "Apply through your bank (if you have a crop loan, it may be automatic), or at CSC centre, or online at pmfby.gov.in. Apply before the sowing deadline for your season.",
    howToApplyHi: "अपने बैंक से करें (अगर फसल कर्ज है तो अपने आप हो सकता है), या CSC केंद्र पर, या pmfby.gov.in पर। बुवाई की आखिरी तारीख से पहले करें।",
    keywords: ["fasal bima", "crop insurance", "pmfby", "insurance", "premium", "crop loss", "flood", "drought", "फसल बीमा", "बीमा"],
  },
  {
    name: "Kisan Credit Card (KCC)",
    fullName: "Kisan Credit Card Scheme",
    fullNameHi: "किसान क्रेडिट कार्ड योजना",
    benefit: "Crop loan up to ₹3 lakh at 4% effective interest (7% with 3% subvention for timely repayment)",
    benefitHi: "₹3 लाख तक फसल ऋण, समय पर चुकाने पर 4% ब्याज (7% में से 3% सरकार देती है)",
    eligibility: "All farmers — individual or joint borrowers, tenant farmers, sharecroppers, and SHGs of farmers",
    eligibilityHi: "सभी किसान — अकेले या संयुक्त, बटाईदार, किरायेदार किसान, और किसान स्वयं सहायता समूह",
    documents: "Aadhaar card, land papers (ownership or tenancy proof), two passport-size photographs, bank account",
    documentsHi: "आधार कार्ड, जमीन के कागज (मालिकाना हक या किरायेदारी प्रमाण), दो पासपोर्ट फोटो, बैंक खाता",
    howToApply: "Apply at your nearest bank branch (any commercial, cooperative, or regional rural bank). PM-KISAN beneficiaries can apply with a simplified one-page form.",
    howToApplyHi: "नज़दीकी बैंक शाखा में आवेदन करें (कोई भी वाणिज्य, सहकारी या ग्रामीण बैंक)। PM-KISAN लाभार्थी एक पेज के फॉर्म से कर सकते हैं।",
    keywords: ["kisan credit", "kcc", "crop loan", "loan", "credit card", "interest", "bank loan", "किसान क्रेडिट", "केसीसी", "कर्ज", "ऋण"],
  },
  {
    name: "PM Awas Yojana – Gramin",
    fullName: "Pradhan Mantri Awas Yojana – Gramin (Rural Housing)",
    fullNameHi: "प्रधानमंत्री आवास योजना – ग्रामीण",
    benefit: "₹1.20 lakh (plain areas) or ₹1.30 lakh (hilly/difficult areas) for building a pucca house, plus ₹12,000 for toilet under Swachh Bharat",
    benefitHi: "₹1.20 लाख (मैदानी) या ₹1.30 लाख (पहाड़ी) पक्का घर बनाने के लिए, साथ में ₹12,000 शौचालय के लिए",
    eligibility: "Houseless families or those living in kutcha/dilapidated houses. Selected from SECC 2011 data, verified by Gram Sabha.",
    eligibilityHi: "बेघर परिवार या कच्चे/जर्जर घर में रहने वाले। SECC 2011 डेटा से चयन, ग्राम सभा द्वारा सत्यापित।",
    documents: "Aadhaar card, SECC data inclusion proof, bank account, job card (MGNREGA), photograph of existing house",
    documentsHi: "आधार कार्ड, SECC डेटा में नाम का प्रमाण, बैंक खाता, जॉब कार्ड (मनरेगा), मौजूदा घर की फोटो",
    howToApply: "Beneficiaries are identified from SECC data. Check with your Gram Panchayat or Block Development Office. You can also check your name at pmayg.nic.in.",
    howToApplyHi: "लाभार्थी SECC डेटा से चुने जाते हैं। अपनी ग्राम पंचायत या ब्लॉक विकास कार्यालय से पता करें। pmayg.nic.in पर भी नाम देख सकते हैं।",
    keywords: ["awas", "housing", "house", "pmay", "ghar", "pucca", "kutcha", "आवास", "घर", "मकान"],
  },
  {
    name: "Ayushman Bharat (PM-JAY)",
    fullName: "Ayushman Bharat – Pradhan Mantri Jan Arogya Yojana",
    fullNameHi: "आयुष्मान भारत – प्रधानमंत्री जन आरोग्य योजना",
    benefit: "Free health insurance cover of ₹5 lakh per family per year for secondary and tertiary hospitalisation",
    benefitHi: "हर परिवार को ₹5 लाख तक का मुफ्त इलाज, हर साल, सरकारी और प्राइवेट अस्पतालों में",
    eligibility: "Families identified in SECC 2011 (deprived categories) and all families with NFSA ration cards. No age, family size, or pre-existing disease limit.",
    eligibilityHi: "SECC 2011 में शामिल परिवार और NFSA राशन कार्ड वाले सभी परिवार। उम्र, परिवार के आकार या पुरानी बीमारी की कोई सीमा नहीं।",
    documents: "Aadhaar card, ration card, any government ID. You can check eligibility by calling 14555 or visiting mera.pmjay.gov.in.",
    documentsHi: "आधार कार्ड, राशन कार्ड, कोई भी सरकारी पहचान पत्र। पात्रता जांचने के लिए 14555 पर कॉल करें या mera.pmjay.gov.in देखें।",
    howToApply: "Visit any empanelled hospital or Ayushman Mitra at a government hospital. You can also visit your nearest CSC to get your Ayushman card made.",
    howToApplyHi: "किसी भी सूचीबद्ध अस्पताल में जाएं या सरकारी अस्पताल में आयुष्मान मित्र से मिलें। नज़दीकी CSC में आयुष्मान कार्ड बनवा सकते हैं।",
    keywords: ["ayushman", "health insurance", "hospital", "jan arogya", "medical", "health card", "pmjay", "5 lakh", "आयुष्मान", "इलाज"],
  },
  {
    name: "MGNREGA",
    fullName: "Mahatma Gandhi National Rural Employment Guarantee Act",
    fullNameHi: "महात्मा गांधी राष्ट्रीय ग्रामीण रोज़गार गारंटी अधिनियम (मनरेगा)",
    benefit: "100 days of guaranteed wage employment per year per rural household. Daily wage varies by state (₹230–350 approx).",
    benefitHi: "हर ग्रामीण परिवार को साल में 100 दिन का रोज़गार गारंटी। दैनिक मज़दूरी राज्य के अनुसार (लगभग ₹230–350)।",
    eligibility: "Any adult member of a rural household willing to do unskilled manual work. No income or land criteria.",
    eligibilityHi: "गांव के किसी भी वयस्क सदस्य के लिए जो मज़दूरी करना चाहता है। आय या जमीन की कोई शर्त नहीं।",
    documents: "Job card (apply at Gram Panchayat with Aadhaar, photograph, and address proof). If you don't have a job card, apply for one first.",
    documentsHi: "जॉब कार्ड (ग्राम पंचायत में आधार, फोटो और पते के प्रमाण से बनवाएं)। अगर जॉब कार्ड नहीं है तो पहले वो बनवाएं।",
    howToApply: "Submit a written application to the Gram Panchayat demanding work. They must provide work within 15 days or pay unemployment allowance.",
    howToApplyHi: "ग्राम पंचायत में काम की मांग का लिखित आवेदन दें। उन्हें 15 दिन में काम देना होगा या बेरोज़गारी भत्ता देना होगा।",
    keywords: ["nrega", "mgnrega", "mnrega", "job card", "employment guarantee", "100 days", "wage", "manual work", "rozgar", "नरेगा", "मनरेगा", "रोज़गार", "मज़दूरी", "जॉब कार्ड"],
  },
];

// ─── Agriculture Agent ──────────────────────────────────────────────

interface AgriRule {
  key: string;
  match: RegExp;
  clarifyEn?: string;
  clarifyHi?: string;
  clarifyMr?: string;
}

const AGRI_RULES: AgriRule[] = [
  {
    key: "yellow-leaves",
    match: /yellow\s*(leaf|leaves)|leaf.*yellow|leaves.*yellow|turn.*yellow|पत्ते.*पीले|पीले.*पत्ते|पत्ती.*पीली|पत्तियां.*पीली|पत्तियाँ.*पीली|पीला\s*पड़|पीले\s*हो|पिवळे.*पाने|पाने.*पिवळे/i,
  },
  {
    key: "pest",
    match: /pest|insect|worm|caterpillar|borer|aphid|whitefly|mite|कीड़ा|कीड़े|कीट|इल्ली|माहू|सफेद\s*मक्खी|कीड|किडे|अळी/i,
    clarifyEn: "Which crop is affected and what do the insects look like?",
    clarifyHi: "कौन सी फसल में कीड़े लगे हैं और कीड़े कैसे दिखते हैं?",
    clarifyMr: "कोणत्या पिकावर किडे आहेत आणि किडे कसे दिसतात?",
  },
  {
    key: "irrigation",
    match: /water(ing)?|irrigat|when\s*(to|should)\s*water|how\s*much\s*water|सिंचाई|पानी\s*दे|पानी\s*कब|पानी\s*कितना|पाणी\s*द्या|पाणी\s*कधी|सिंचन/i,
    clarifyEn: "What crop are you growing and what is your irrigation method?",
    clarifyHi: "आप कौन सी फसल उगा रहे हैं और पानी कैसे देते हैं?",
    clarifyMr: "तुम्ही कोणते पीक घेत आहात आणि पाणी कसे देता?",
  },
  {
    key: "fertilizer",
    match: /fertili[sz]|urea|dap|npk|compost|manure|nutrient|खाद|यूरिया|डीएपी|उर्वरक|गोबर|कम्पोस्ट|खत|युरिया|कंपोस्ट|शेणखत/i,
  },
  {
    key: "soil",
    match: /\bsoil\b|\bph\b|salinity|\btest\b|मिट्टी|जमीन|ज़मीन|माती/i,
  },
  {
    key: "disease",
    match: /disease|blight|rust|wilt|rot|mildew|fungus|fungi|रोग|बीमारी|फफूंद|करपा|बुरशी/i,
    clarifyEn: "Can you describe the symptoms — colour of spots, which part of the plant, how fast it is spreading?",
    clarifyHi: "लक्षण बताइए — धब्बों का रंग, पौधे का कौन सा हिस्सा, और कितनी तेजी से फैल रहा है?",
    clarifyMr: "लक्षणे सांगा — डागांचा रंग, रोपाचा कोणता भाग, आणि किती वेगाने पसरत आहे?",
  },
  {
    key: "sowing",
    match: /sow|plant|seed|nursery|transplant|when\s*to\s*(sow|plant)|season|बुवाई|बीज|पौध|रोपाई|पेरणी|बियाणे|रोपे/i,
    clarifyEn: "Which crop and in which season?",
    clarifyHi: "कौन सी फसल और किस मौसम में?",
    clarifyMr: "कोणते पीक आणि कोणत्या हंगामात?",
  },
  {
    key: "harvest",
    match: /harvest|yield|production|when\s*to\s*harvest|कटाई|उपज|पैदावार|काढणी|उत्पादन|उत्पन्न/i,
  },
];

// Localized responses for each agriculture rule key
const AGRI_RESPONSES: Record<string, { en: string; hi: string; mr: string }> = {
  "yellow-leaves": {
    en:
      "This looks like nitrogen deficiency with possible early leaf blight.\n\n" +
      "• Spray 2% urea solution in the evening for 3 days\n" +
      "• Remove and burn badly spotted leaves\n" +
      "• Avoid watering the leaves — water at the roots\n" +
      "• Organic option: neem oil 5 ml per litre, twice a week\n\n" +
      "If spots spread after 5 days, visit your nearest Krishi Vigyan Kendra for a lab test.",
    hi:
      "यह देखकर लगता है कि नाइट्रोजन की कमी है और शुरुआती पत्ती अंगमारी (ब्लाइट) हो सकती है।\n\n" +
      "• शाम को 2% यूरिया का घोल छिड़कें, 3 दिन तक\n" +
      "• बुरी तरह धब्बेदार पत्तों को तोड़कर जला दें\n" +
      "• पत्तों पर पानी न डालें — जड़ों में पानी दें\n" +
      "• जैविक विकल्प: नीम का तेल 5 मिली प्रति लीटर, हफ्ते में दो बार\n\n" +
      "अगर 5 दिन बाद भी धब्बे बढ़ रहे हैं तो नज़दीकी कृषि विज्ञान केंद्र (KVK) में जांच कराएं।",
    mr:
      "हे पाहून असे वाटते की नायट्रोजनची कमतरता आहे आणि सुरुवातीचा पानांचा करपा रोग असू शकतो.\n\n" +
      "• संध्याकाळी 2% युरियाचे द्रावण फवारा, 3 दिवस\n" +
      "• खराब झालेली पाने तोडून जाळून टाका\n" +
      "• पानांवर पाणी देऊ नका — मुळांना पाणी द्या\n" +
      "• सेंद्रिय पर्याय: कडुनिंबाचे तेल 5 मिली प्रति लिटर, आठवड्यातून दोनदा\n\n" +
      "5 दिवसांनंतरही डाग वाढत असतील तर जवळच्या कृषी विज्ञान केंद्रात (KVK) तपासणी करा.",
  },
  "pest": {
    en:
      "For general pest issues on crops:\n\n" +
      "• First try neem oil spray (5 ml per litre water) — safe and organic\n" +
      "• For borers: use pheromone traps + Trichogramma cards (available at KVK)\n" +
      "• For sucking pests (aphids, whiteflies): yellow sticky traps help\n" +
      "• Avoid spraying during flowering — it harms pollinators\n\n" +
      "Can you tell me which crop and what the insects look like? I can give more specific advice.",
    hi:
      "फसल में कीड़ों की समस्या के लिए:\n\n" +
      "• पहले नीम का तेल (5 मिली प्रति लीटर पानी) छिड़कें — सुरक्षित और जैविक\n" +
      "• तना छेदक के लिए: फेरोमोन ट्रैप + ट्राइकोग्रामा कार्ड (KVK में मिलते हैं)\n" +
      "• रस चूसने वाले कीड़ों (माहू, सफेद मक्खी) के लिए: पीले चिपचिपे ट्रैप\n" +
      "• फूल आने के समय छिड़काव न करें — परागण करने वाले कीड़ों को नुकसान होता है\n\n" +
      "कौन सी फसल में कीड़े लगे हैं और कैसे दिखते हैं? बताइए तो ज़्यादा सही सलाह दे सकता हूँ।",
    mr:
      "पिकावर किडींच्या समस्येसाठी:\n\n" +
      "• प्रथम कडुनिंबाचे तेल (5 मिली प्रति लिटर पाणी) फवारा — सुरक्षित आणि सेंद्रिय\n" +
      "• खोड किडीसाठी: फेरोमोन ट्रॅप + ट्रायकोग्रामा कार्ड (KVK मध्ये मिळतात)\n" +
      "• रस शोषक किडींसाठी (मावा, पांढरी माशी): पिवळे चिकट ट्रॅप\n" +
      "• फुलोरा आल्यावर फवारणी करू नका\n\n" +
      "कोणत्या पिकावर किडे आहेत आणि कसे दिसतात ते सांगा.",
  },
  "irrigation": {
    en:
      "General irrigation tips for Indian conditions:\n\n" +
      "• Water early morning (before 8 AM) or late evening — less evaporation\n" +
      "• Most vegetables need water every 3–4 days in summer, weekly in winter\n" +
      "• Tomatoes prefer consistent moisture — 2–3 cm per week\n" +
      "• Wheat needs 4–5 irrigations total: crown root, tillering, jointing, flowering, grain filling\n" +
      "• Drip irrigation saves 40–60% water compared to flood irrigation\n\n" +
      "What crop are you growing? I can give specific timing advice.",
    hi:
      "भारतीय परिस्थितियों के लिए सिंचाई के सुझाव:\n\n" +
      "• सुबह जल्दी (8 बजे से पहले) या शाम को देर से पानी दें — वाष्पीकरण कम होता है\n" +
      "• ज़्यादातर सब्ज़ियों को गर्मी में हर 3-4 दिन, सर्दी में हफ्ते में एक बार\n" +
      "• टमाटर को हर हफ्ते 2-3 सेमी पानी चाहिए, बराबर नमी रखें\n" +
      "• गेहूं को कुल 4-5 सिंचाई: ताजमूल, कल्ले, गांठ, फूल, दाना भरने पर\n" +
      "• ड्रिप सिंचाई से बाढ़ सिंचाई की तुलना में 40-60% पानी बचता है\n\n" +
      "आप कौन सी फसल उगा रहे हैं? बताइए तो सही समय बता सकता हूँ।",
    mr:
      "भारतीय परिस्थितींसाठी सिंचन सल्ले:\n\n" +
      "• सकाळी लवकर (8 पूर्वी) किंवा संध्याकाळी उशिरा पाणी द्या — बाष्पीभवन कमी होते\n" +
      "• बहुतेक भाज्यांना उन्हाळ्यात 3-4 दिवसांनी, हिवाळ्यात आठवड्यातून एकदा\n" +
      "• टोमॅटोला दर आठवड्याला 2-3 सेमी पाणी, सातत्याने ओलावा ठेवा\n" +
      "• गव्हाला एकूण 4-5 पाणी: मुकुट मूळ, फुटवे, गाठ, फुलोरा, दाणा भरणे\n" +
      "• ठिबक सिंचनाने 40-60% पाणी वाचते\n\n" +
      "तुम्ही कोणते पीक घेत आहात?",
  },
  "fertilizer": {
    en:
      "Balanced nutrition is key:\n\n" +
      "• Get a soil test first — your KVK does it for ₹50-100\n" +
      "• General rule: apply DAP at sowing, urea in 2-3 splits during growth\n" +
      "• Never apply urea when soil is dry — irrigate lightly first\n" +
      "• Add 2-3 tonnes of well-decomposed FYM per acre before sowing\n" +
      "• Zinc sulphate (10 kg/acre) helps if leaves show white streaks\n\n" +
      "Organic alternative: vermicompost (2 tonnes/acre) + jeevamrut application every 15 days.",
    hi:
      "संतुलित पोषण सबसे ज़रूरी है:\n\n" +
      "• पहले मिट्टी की जांच कराएं — KVK में ₹50-100 में होती है\n" +
      "• सामान्य नियम: बुवाई पर DAP, बढ़वार के दौरान 2-3 बार यूरिया\n" +
      "• सूखी मिट्टी में कभी यूरिया न डालें — पहले हल्का पानी दें\n" +
      "• बुवाई से पहले 2-3 टन अच्छी सड़ी गोबर की खाद प्रति एकड़\n" +
      "• अगर पत्तों पर सफेद धारियां हैं तो जिंक सल्फेट (10 किलो/एकड़)\n\n" +
      "जैविक विकल्प: वर्मीकम्पोस्ट (2 टन/एकड़) + हर 15 दिन जीवामृत।",
    mr:
      "संतुलित पोषण सर्वात महत्त्वाचे:\n\n" +
      "• प्रथम माती तपासणी करा — KVK मध्ये ₹50-100 ला होते\n" +
      "• सामान्य नियम: पेरणीवेळी DAP, वाढीच्या काळात 2-3 वेळा युरिया\n" +
      "• कोरड्या जमिनीत कधी युरिया टाकू नका — आधी हलके पाणी द्या\n" +
      "• पेरणीपूर्वी एकरी 2-3 टन चांगले कुजलेले शेणखत\n" +
      "• पानांवर पांढरे पट्टे असतील तर जस्त सल्फेट (10 किलो/एकर)\n\n" +
      "सेंद्रिय पर्याय: गांडूळखत (2 टन/एकर) + दर 15 दिवसांनी जीवामृत.",
  },
  "soil": {
    en:
      "Healthy soil is the foundation of good farming:\n\n" +
      "• Get your soil tested at the nearest KVK or soil testing lab — costs ₹50-100\n" +
      "• Ideal pH for most crops: 6.0 to 7.5\n" +
      "• If soil is too acidic: add lime (2-4 quintal per acre)\n" +
      "• If too alkaline: add gypsum (2-4 quintal per acre)\n" +
      "• Add green manure crops (dhaincha, sunhemp) in rotation to improve organic matter\n\n" +
      "Your soil health card should be available at the block agriculture office.",
    hi:
      "अच्छी खेती की नींव स्वस्थ मिट्टी है:\n\n" +
      "• नज़दीकी KVK या मिट्टी जांच प्रयोगशाला में जांच कराएं — ₹50-100 लगती है\n" +
      "• ज़्यादातर फसलों के लिए सही pH: 6.0 से 7.5\n" +
      "• मिट्टी ज़्यादा अम्लीय है: चूना डालें (2-4 क्विंटल प्रति एकड़)\n" +
      "• ज़्यादा क्षारीय है: जिप्सम डालें (2-4 क्विंटल प्रति एकड़)\n" +
      "• हरी खाद फसलें (ढैंचा, सनई) बारी-बारी से उगाएं — जैविक पदार्थ बढ़ता है\n\n" +
      "आपका मृदा स्वास्थ्य कार्ड ब्लॉक कृषि कार्यालय में उपलब्ध होना चाहिए।",
    mr:
      "चांगल्या शेतीचा पाया निरोगी माती आहे:\n\n" +
      "• जवळच्या KVK किंवा माती तपासणी प्रयोगशाळेत तपासणी करा — ₹50-100 खर्च\n" +
      "• बहुतेक पिकांसाठी योग्य pH: 6.0 ते 7.5\n" +
      "• माती जास्त आम्ल असल्यास: चुना टाका (एकरी 2-4 क्विंटल)\n" +
      "• जास्त अल्कली असल्यास: जिप्सम टाका (एकरी 2-4 क्विंटल)\n" +
      "• हिरवळीचे खत पिके (ताग, धैंचा) फेरपालटीत घ्या\n\n" +
      "तुमचे माती आरोग्य कार्ड तालुका कृषी कार्यालयात उपलब्ध असायला हवे.",
  },
  "disease": {
    en:
      "For crop diseases:\n\n" +
      "• Remove and destroy infected plant parts immediately\n" +
      "• Spray Mancozeb (2.5 g/litre) or Copper Oxychloride (3 g/litre) for fungal diseases\n" +
      "• Improve air circulation — don't plant too close together\n" +
      "• Avoid overhead irrigation on infected crops\n" +
      "• Organic: Trichoderma viride (soil application) + Pseudomonas (seed treatment)\n\n" +
      "For accurate diagnosis, visit your nearest Krishi Vigyan Kendra.",
    hi:
      "फसल के रोगों के लिए:\n\n" +
      "• संक्रमित पौधों के हिस्सों को तुरंत तोड़कर नष्ट करें\n" +
      "• फफूंद रोगों के लिए मैंकोज़ेब (2.5 ग्राम/लीटर) या कॉपर ऑक्सीक्लोराइड (3 ग्राम/लीटर) छिड़कें\n" +
      "• हवा का आना-जाना बढ़ाएं — पौधे बहुत पास-पास न लगाएं\n" +
      "• संक्रमित फसल पर ऊपर से पानी न डालें\n" +
      "• जैविक: ट्राइकोडर्मा विरिडी (मिट्टी में) + स्यूडोमोनास (बीज उपचार)\n\n" +
      "सही पहचान के लिए नज़दीकी कृषि विज्ञान केंद्र जाएं।",
    mr:
      "पिकाच्या रोगांसाठी:\n\n" +
      "• रोगग्रस्त भाग लगेच तोडून नष्ट करा\n" +
      "• बुरशी रोगांसाठी मॅन्कोझेब (2.5 ग्रॅम/लिटर) किंवा कॉपर ऑक्सिक्लोराईड (3 ग्रॅम/लिटर) फवारा\n" +
      "• हवा खेळती ठेवा — रोपे जास्त जवळजवळ लावू नका\n" +
      "• रोगग्रस्त पिकावर वरून पाणी देऊ नका\n" +
      "• सेंद्रिय: ट्रायकोडर्मा (मातीत) + स्यूडोमोनास (बीज प्रक्रिया)\n\n" +
      "अचूक ओळखीसाठी जवळच्या KVK ला भेट द्या.",
  },
  "sowing": {
    en:
      "Timing depends on your region and crop:\n\n" +
      "• Kharif (monsoon) sowing: June–July (rice, maize, soybean, cotton)\n" +
      "• Rabi (winter) sowing: October–November (wheat, mustard, gram, peas)\n" +
      "• Zaid (summer): March–April (watermelon, cucumber, moong)\n\n" +
      "Tips:\n" +
      "• Always use certified seeds from a government outlet\n" +
      "• Treat seeds with fungicide (Thiram 2g/kg) before sowing\n" +
      "• For transplanted crops, prepare nursery 20-25 days before\n\n" +
      "Which crop are you planning to grow?",
    hi:
      "समय आपके क्षेत्र और फसल पर निर्भर करता है:\n\n" +
      "• खरीफ (मानसून) बुवाई: जून–जुलाई (धान, मक्का, सोयाबीन, कपास)\n" +
      "• रबी (सर्दी) बुवाई: अक्टूबर–नवंबर (गेहूं, सरसों, चना, मटर)\n" +
      "• ज़ायद (गर्मी): मार्च–अप्रैल (तरबूज, खीरा, मूंग)\n\n" +
      "सुझाव:\n" +
      "• हमेशा सरकारी दुकान से प्रमाणित बीज लें\n" +
      "• बुवाई से पहले बीज को फफूंदनाशक (थीरम 2 ग्राम/किलो) से उपचारित करें\n" +
      "• रोपाई वाली फसलों के लिए 20-25 दिन पहले नर्सरी तैयार करें\n\n" +
      "आप कौन सी फसल उगाना चाहते हैं?",
    mr:
      "वेळ तुमच्या भागावर आणि पिकावर अवलंबून आहे:\n\n" +
      "• खरीप (पावसाळा) पेरणी: जून–जुलै (भात, मका, सोयाबीन, कापूस)\n" +
      "• रब्बी (हिवाळा) पेरणी: ऑक्टोबर–नोव्हेंबर (गहू, मोहरी, हरभरा, वाटाणा)\n" +
      "• उन्हाळी: मार्च–एप्रिल (कलिंगड, काकडी, मूग)\n\n" +
      "सल्ले:\n" +
      "• नेहमी सरकारी दुकानातून प्रमाणित बियाणे घ्या\n" +
      "• पेरणीपूर्वी बियाणे बुरशीनाशक (थिरम 2 ग्रॅम/किलो) ने उपचारित करा\n\n" +
      "तुम्ही कोणते पीक घेणार आहात?",
  },
  "harvest": {
    en:
      "Harvesting at the right time is important for quality and price:\n\n" +
      "• Wheat: when grains become hard and straw turns golden (about 120-150 days)\n" +
      "• Rice: when 80% of grains in the panicle turn golden\n" +
      "• Vegetables: harvest in the morning for freshness\n" +
      "• Check moisture content — grain should be 12-14% for safe storage\n\n" +
      "After harvest:\n" +
      "• Dry grains on a clean platform for 2-3 days\n" +
      "• Store in moisture-proof bags or metal bins\n" +
      "• Check mandi rates before selling — prices vary daily",
    hi:
      "सही समय पर कटाई गुणवत्ता और कीमत दोनों के लिए ज़रूरी है:\n\n" +
      "• गेहूं: जब दाने सख्त हो जाएं और तना सुनहरा हो (लगभग 120-150 दिन)\n" +
      "• धान: जब बाली में 80% दाने सुनहरे हो जाएं\n" +
      "• सब्ज़ियां: ताज़गी के लिए सुबह तोड़ें\n" +
      "• नमी जांचें — सुरक्षित भंडारण के लिए दाने में 12-14% नमी\n\n" +
      "कटाई के बाद:\n" +
      "• साफ जगह पर 2-3 दिन सुखाएं\n" +
      "• नमी-रोधी बोरी या धातु के बर्तन में रखें\n" +
      "• बेचने से पहले मंडी के भाव देखें — रोज़ बदलते हैं",
    mr:
      "योग्य वेळी काढणी गुणवत्ता आणि किमतीसाठी महत्त्वाचे:\n\n" +
      "• गहू: दाणे कडक होतात आणि पेंढा सोनेरी होतो तेव्हा (120-150 दिवस)\n" +
      "• भात: लोंबीतील 80% दाणे सोनेरी झाल्यावर\n" +
      "• भाज्या: ताजेपणासाठी सकाळी तोडा\n" +
      "• ओलावा तपासा — सुरक्षित साठवणुकीसाठी 12-14%\n\n" +
      "काढणीनंतर:\n" +
      "• स्वच्छ जागेवर 2-3 दिवस वाळवा\n" +
      "• ओलावा-प्रतिरोधक पिशव्या किंवा धातूच्या डब्यात ठेवा\n" +
      "• विकण्यापूर्वी बाजारभाव तपासा",
  },
};

const AGRI_GENERIC: { en: string; hi: string; mr: string } = {
  en:
    "I can help with your farming question. Here are some general tips:\n\n" +
    "• For crop problems, a clear photo of the affected part helps me give better advice\n" +
    "• Your local Krishi Vigyan Kendra (KVK) can provide free soil testing and expert advice\n" +
    "• For weather updates, call Kisan Call Centre at 1800-180-1551 (toll free)\n\n" +
    "Can you tell me more about your specific question? What crop are you growing and what problem are you seeing?",
  hi:
    "मैं आपके खेती के सवाल में मदद कर सकता हूँ। कुछ सामान्य सुझाव:\n\n" +
    "• फसल की समस्या में प्रभावित हिस्से की साफ फोटो से बेहतर सलाह दे सकता हूँ\n" +
    "• आपका स्थानीय कृषि विज्ञान केंद्र (KVK) मुफ्त मिट्टी जांच और विशेषज्ञ सलाह देता है\n" +
    "• मौसम की जानकारी के लिए किसान कॉल सेंटर 1800-180-1551 (मुफ्त) पर फोन करें\n\n" +
    "ज़रा और बताइए — कौन सी फसल है और क्या समस्या दिख रही है?",
  mr:
    "मी तुमच्या शेतीच्या प्रश्नात मदत करू शकतो. काही सामान्य सल्ले:\n\n" +
    "• पिकाच्या समस्येत प्रभावित भागाचा स्पष्ट फोटो असल्यास चांगला सल्ला देता येतो\n" +
    "• तुमचे स्थानिक कृषी विज्ञान केंद्र (KVK) मोफत माती तपासणी आणि तज्ञ सल्ला देते\n" +
    "• हवामान अपडेटसाठी किसान कॉल सेंटर 1800-180-1551 (मोफत) वर फोन करा\n\n" +
    "कोणते पीक आहे आणि काय समस्या दिसत आहे ते सांगा.",
};

export function askNexusFarm(
  userMessage: string,
  language: string,
): AgentResponse {
  const lang = langKeyFromName(language);
  const rule = AGRI_RULES.find((r) => r.match.test(userMessage));

  if (rule && AGRI_RESPONSES[rule.key]) {
    const resp = AGRI_RESPONSES[rule.key];
    const clarify = lang === "hi" ? rule.clarifyHi : lang === "mr" ? rule.clarifyMr : rule.clarifyEn;

    return {
      answer: pick(lang, resp.en, resp.hi, resp.mr),
      needsClarification: Boolean(clarify),
      clarifyingQuestion: clarify ?? null,
      confidence: "high",
      agent: "agriculture",
    };
  }

  return {
    answer: pick(lang, AGRI_GENERIC.en, AGRI_GENERIC.hi, AGRI_GENERIC.mr),
    needsClarification: true,
    clarifyingQuestion: pick(
      lang,
      "What crop are you growing and what specific problem are you facing?",
      "कौन सी फसल है और क्या समस्या दिख रही है?",
      "कोणते पीक आहे आणि काय समस्या दिसत आहे?",
    ),
    confidence: "medium",
    agent: "agriculture",
  };
}

// ─── Government Schemes Agent ───────────────────────────────────────

export function askNexusSchemes(
  userMessage: string,
  language: string,
): AgentResponse {
  const lang = langKeyFromName(language);
  const lower = userMessage.toLowerCase();

  // Check if asking about a specific scheme
  const matchedSchemes = SCHEMES_DATA.filter((s) =>
    s.keywords.some((kw) => lower.includes(kw) || userMessage.includes(kw)) ||
    lower.includes(s.name.toLowerCase()),
  );

  if (matchedSchemes.length > 0) {
    const isDocQuestion = /document|paper|what\s*(do\s*i\s*)?need|दस्तावेज|दस्तावेज़|कागज|कागदपत्रे/i.test(userMessage);
    const isEligQuestion = /eligib|can\s*i|qualify|who\s*can|पात्रता|कौन.*पात्र|कोण.*पात्र/i.test(userMessage);
    const isHowQuestion = /how\s*to|apply|where|process|step|कैसे.*करें|अर्ज.*कसा|आवेदन/i.test(userMessage);

    const parts = matchedSchemes.map((s) => {
      const name = lang === "en" ? s.fullName : (s.fullNameHi ?? s.fullName);
      const benefit = pick(lang, s.benefit, s.benefitHi ?? s.benefit);
      const elig = pick(lang, s.eligibility, s.eligibilityHi ?? s.eligibility);
      const docs = pick(lang, s.documents, s.documentsHi ?? s.documents);
      const how = pick(lang, s.howToApply, s.howToApplyHi ?? s.howToApply);

      let response = `**${s.name}** — ${name}\n`;
      response += `💰 ${pick(lang, "Benefit", "लाभ", "लाभ")}: ${benefit}\n\n`;

      if (isDocQuestion) {
        response += `📄 ${pick(lang, "Documents needed", "दस्तावेज़", "कागदपत्रे")}:\n${docs}\n\n`;
        response += `📝 ${pick(lang, "How to apply", "आवेदन कैसे करें", "अर्ज कसा करायचा")}:\n${how}`;
      } else if (isEligQuestion) {
        response += `✅ ${pick(lang, "Eligibility", "पात्रता", "पात्रता")}:\n${elig}\n\n`;
        response += `📄 ${pick(lang, "Documents needed", "दस्तावेज़", "कागदपत्रे")}:\n${docs}`;
      } else if (isHowQuestion) {
        response += `📝 ${pick(lang, "How to apply", "आवेदन कैसे करें", "अर्ज कसा करायचा")}:\n${how}\n\n`;
        response += `📄 ${pick(lang, "Documents needed", "दस्तावेज़", "कागदपत्रे")}:\n${docs}`;
      } else {
        response += `✅ ${pick(lang, "Eligibility", "पात्रता", "पात्रता")}: ${elig}\n\n`;
        response += `📄 ${pick(lang, "Documents", "दस्तावेज़", "कागदपत्रे")}: ${docs}\n\n`;
        response += `📝 ${pick(lang, "How to apply", "आवेदन कैसे करें", "अर्ज कसा करायचा")}: ${how}`;
      }

      return response;
    });

    return {
      answer: parts.join("\n\n---\n\n"),
      needsClarification: false,
      clarifyingQuestion: null,
      confidence: "high",
      agent: "government",
    };
  }

  // General schemes query
  const isSmallFarmer = /small|marginal|poor|little|kam|chhota|छोटा|छोटे|गरीब|लहान|अल्पभूधारक/i.test(userMessage);
  const relevant = isSmallFarmer
    ? SCHEMES_DATA.filter((s) => ["PM-KISAN", "PMFBY", "Kisan Credit Card (KCC)", "MGNREGA"].includes(s.name))
    : SCHEMES_DATA.slice(0, 4);

  const overview = relevant
    .map((s, i) => {
      const benefit = pick(lang, s.benefit, s.benefitHi ?? s.benefit);
      return `${i + 1}. **${s.name}** — ${benefit}`;
    })
    .join("\n");

  const footer = pick(
    lang,
    "Would you like me to explain any of these in detail — eligibility, documents needed, or how to apply?\n\nYou can also visit your nearest Common Service Centre (CSC) for help with applications.",
    "किसी भी योजना की पूरी जानकारी चाहिए तो बताइए — पात्रता, दस्तावेज़, या आवेदन कैसे करें।\n\nआप नज़दीकी जन सेवा केंद्र (CSC) में भी मदद ले सकते हैं।",
    "कोणत्याही योजनेची सविस्तर माहिती हवी असल्यास सांगा — पात्रता, कागदपत्रे, किंवा अर्ज कसा करायचा.\n\nतुम्ही जवळच्या जन सेवा केंद्रात (CSC) मदत घेऊ शकता.",
  );

  const header = pick(
    lang,
    "Based on your question, these schemes may be useful for you:",
    "आपके सवाल के हिसाब से ये योजनाएं काम आ सकती हैं:",
    "तुमच्या प्रश्नानुसार या योजना उपयोगी असू शकतात:",
  );

  return {
    answer: `${header}\n\n${overview}\n\n${footer}`,
    needsClarification: false,
    clarifyingQuestion: null,
    confidence: "high",
    agent: "government",
  };
}

// ─── General Agent ──────────────────────────────────────────────────

export function askNexusGeneral(
  userMessage: string,
  language: string,
): AgentResponse {
  const lang = langKeyFromName(language);

  // "Coming soon" categories
  if (/document|paper|letter|notice|bill|form|दस्तावेज|कागज|कागद|पत्र|नोटिस/i.test(userMessage)) {
    return {
      answer: pick(
        lang,
        "The Document Reading feature is coming soon! I will be able to read and explain official documents, notices, and letters in simple language.\n\nFor now, you can take your document to your nearest Common Service Centre (CSC) or Gram Panchayat office for help understanding it.",
        "दस्तावेज़ पढ़ने की सुविधा जल्द आ रही है! मैं सरकारी कागज़ात, नोटिस और पत्र सरल भाषा में समझा सकूँगा।\n\nअभी के लिए, अपना कागज़ नज़दीकी जन सेवा केंद्र (CSC) या ग्राम पंचायत में ले जाएं।",
        "कागदपत्रे वाचण्याची सुविधा लवकरच येत आहे!\n\nसध्या, तुमचे कागदपत्र जवळच्या जन सेवा केंद्र (CSC) किंवा ग्राम पंचायतीत नेऊ शकता.",
      ),
      needsClarification: false,
      clarifyingQuestion: null,
      confidence: "medium",
      agent: "general",
    };
  }

  if (/health|fever|pain|doctor|medicine|sick|hospital|pregnan|vaccin|स्वास्थ्य|बुखार|दर्द|दवाई|बीमार|अस्पताल|आरोग्य|ताप|वेदना/i.test(userMessage)) {
    return {
      answer: pick(
        lang,
        "The Health Assistant is coming soon!\n\nFor now:\n• Emergency: Call 108 for ambulance\n• Health helpline: Call 104\n• Visit your nearest Primary Health Centre (PHC)\n• If you have an Ayushman Bharat card, treatment at government hospitals is free",
        "स्वास्थ्य सहायक जल्द आ रहा है!\n\nअभी के लिए:\n• आपातकाल: एम्बुलेंस के लिए 108 पर कॉल करें\n• स्वास्थ्य हेल्पलाइन: 104 पर कॉल करें\n• नज़दीकी प्राथमिक स्वास्थ्य केंद्र (PHC) जाएं\n• अगर आयुष्मान भारत कार्ड है तो सरकारी अस्पताल में मुफ्त इलाज",
        "आरोग्य सहाय्यक लवकरच येत आहे!\n\nसध्या:\n• आपत्कालीन: रुग्णवाहिकेसाठी 108 वर कॉल करा\n• आरोग्य हेल्पलाइन: 104 वर कॉल करा\n• जवळच्या प्राथमिक आरोग्य केंद्रात (PHC) जा\n• आयुष्मान भारत कार्ड असल्यास सरकारी रुग्णालयात मोफत उपचार",
      ),
      needsClarification: false,
      clarifyingQuestion: null,
      confidence: "medium",
      agent: "general",
    };
  }

  if (/market|mandi|price|rate|sell|buying|बाज़ार|मंडी|भाव|दाम|बेच|बाजार|विक/i.test(userMessage)) {
    return {
      answer: pick(
        lang,
        "The Market Prices feature is coming soon!\n\nFor now, you can:\n• Call 1800-180-1551 (Kisan Call Centre, toll-free) for current mandi rates\n• Check the Agmarknet website or eNAM app\n• Ask your local mandi samiti for today's rates",
        "मंडी भाव की सुविधा जल्द आ रही है!\n\nअभी के लिए:\n• किसान कॉल सेंटर 1800-180-1551 (मुफ्त) पर आज के भाव पूछें\n• Agmarknet वेबसाइट या eNAM ऐप देखें\n• स्थानीय मंडी समिति से आज के भाव पूछें",
        "बाजारभाव सुविधा लवकरच येत आहे!\n\nसध्या:\n• किसान कॉल सेंटर 1800-180-1551 (मोफत) वर आजचे भाव विचारा\n• Agmarknet वेबसाइट किंवा eNAM अॅप पहा\n• स्थानिक बाजार समितीकडे आजचे भाव विचारा",
      ),
      needsClarification: false,
      clarifyingQuestion: null,
      confidence: "medium",
      agent: "general",
    };
  }

  if (/study|homework|school|exam|math|learn|education|scholar|पढ़ाई|होमवर्क|स्कूल|परीक्षा|शिक्षा|अभ्यास|शाळा/i.test(userMessage)) {
    return {
      answer: pick(
        lang,
        "The Education Helper is coming soon!\n\nFor now, your children can:\n• Use the DIKSHA app (free, by Government of India) for school lessons\n• Watch lessons on Swayam Prabha TV channels\n• Visit the school library for extra study materials",
        "शिक्षा सहायक जल्द आ रहा है!\n\nअभी के लिए, बच्चे:\n• DIKSHA ऐप (मुफ्त, भारत सरकार) से पढ़ सकते हैं\n• स्वयं प्रभा TV चैनल पर पाठ देख सकते हैं\n• स्कूल लाइब्रेरी से अतिरिक्त पढ़ाई की सामग्री ले सकते हैं",
        "शिक्षण सहाय्यक लवकरच येत आहे!\n\nसध्या, मुले:\n• DIKSHA अॅप (मोफत, भारत सरकार) वरून शिकू शकतात\n• स्वयं प्रभा TV वाहिन्यांवर धडे पाहू शकतात\n• शाळेच्या ग्रंथालयातून अतिरिक्त अभ्यास साहित्य घेऊ शकतात",
      ),
      needsClarification: false,
      clarifyingQuestion: null,
      confidence: "medium",
      agent: "general",
    };
  }

  // Story
  if (/story|kahan|kahani|sunao|tell\s*me|कहानी|कथा|सुनाओ|गोष्ट|सांगा/i.test(userMessage)) {
    return {
      answer: pick(
        lang,
        "Here is a short story for you:\n\nA farmer once planted one mango seed. His neighbour laughed — \"One tree? What will you do with just one tree?\"\n\nThe farmer smiled and said, \"One tree gives shade, fruit, and wood. But more importantly, each fruit has a seed, and each seed can become a tree.\"\n\nYears later, the farmer had an orchard from that one seed. The neighbour asked his secret. The farmer said, \"I just started. That was the hardest part.\"\n\nIs there anything I can help you with — about farming, government schemes, or anything else?",
        "आपके लिए एक छोटी कहानी:\n\nएक किसान ने एक आम का बीज लगाया। पड़ोसी ने हंसकर कहा — \"एक पेड़? एक पेड़ से क्या होगा?\"\n\nकिसान मुस्कुराया और बोला, \"एक पेड़ छाया देता है, फल देता है, लकड़ी देता है। और सबसे बड़ी बात, हर फल में बीज होता है, और हर बीज एक पेड़ बन सकता है।\"\n\nकई साल बाद, उस एक बीज से किसान का पूरा बाग तैयार हो गया। पड़ोसी ने पूछा, \"तुम्हारा राज़ क्या है?\" किसान बोला, \"मैंने बस शुरू किया। यही सबसे मुश्किल हिस्सा था।\"\n\nक्या मैं किसी और चीज़ में मदद कर सकता हूँ — खेती, सरकारी योजनाएं, या कुछ और?",
        "तुमच्यासाठी एक छोटी गोष्ट:\n\nएका शेतकऱ्याने एक आंब्याचे बी लावले. शेजाऱ्याने हसून म्हणाला — \"एक झाड? एका झाडाचे काय होणार?\"\n\nशेतकरी हसला आणि म्हणाला, \"एक झाड सावली देते, फळ देते, लाकूड देते. आणि सर्वात मोठी गोष्ट, प्रत्येक फळात बी असते, आणि प्रत्येक बी एक झाड होऊ शकते.\"\n\nअनेक वर्षांनी, त्या एका बीपासून शेतकऱ्याची संपूर्ण बाग तयार झाली. शेजाऱ्याने विचारले, \"तुमचे रहस्य काय?\" शेतकरी म्हणाला, \"मी फक्त सुरुवात केली. तोच सर्वात कठीण भाग होता.\"\n\nमी आणखी कशात मदत करू शकतो — शेती, सरकारी योजना, किंवा इतर काही?",
      ),
      needsClarification: false,
      clarifyingQuestion: null,
      confidence: "high",
      agent: "general",
    };
  }

  // Default conversational response
  return {
    answer: pick(
      lang,
      "I understood your question. I am your Rural AI assistant and I can help you with:\n\n🌾 **Farming** — crop problems, soil, irrigation, fertilizer advice\n🏛 **Government Schemes** — PM-KISAN, crop insurance, housing, health cards, loans\n\nJust ask me in any language — you can speak or type. What would you like to know?",
      "मैं आपका ग्रामीण AI सहायक हूँ और इन विषयों में मदद कर सकता हूँ:\n\n🌾 **खेती** — फसल की समस्या, मिट्टी, सिंचाई, खाद की सलाह\n🏛 **सरकारी योजनाएं** — पीएम-किसान, फसल बीमा, आवास, स्वास्थ्य कार्ड, ऋण\n\nकिसी भी भाषा में पूछिए — बोलकर या लिखकर। क्या जानना चाहेंगे?",
      "मी तुमचा ग्रामीण AI सहाय्यक आहे आणि या विषयांमध्ये मदत करू शकतो:\n\n🌾 **शेती** — पिकाच्या समस्या, माती, सिंचन, खताचा सल्ला\n🏛 **सरकारी योजना** — पीएम-किसान, पीक विमा, आवास, आरोग्य कार्ड, कर्ज\n\nकोणत्याही भाषेत विचारा — बोलून किंवा लिहून. काय जाणून घ्यायचे आहे?",
    ),
    needsClarification: false,
    clarifyingQuestion: null,
    confidence: "medium",
    agent: "general",
  };
}

// ─── Main Dispatch ──────────────────────────────────────────────────

/**
 * Process a user message end-to-end: classify intent → dispatch to agent → return response.
 * The `language` parameter determines the response language.
 */
export function processQuery(
  userMessage: string,
  language: string,
): AgentResponse {
  const { agentId } = routeQuery(userMessage, language);

  switch (agentId) {
    case "agriculture":
      return askNexusFarm(userMessage, language);
    case "government":
      return askNexusSchemes(userMessage, language);
    case "general":
    default:
      return askNexusGeneral(userMessage, language);
  }
}
