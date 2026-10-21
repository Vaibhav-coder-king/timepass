/**
 * COGNIVA — MIRA AI Voice & Memory Companion Service
 *
 * Grounded in the platform's core mission:
 * AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in NER
 *
 * Integrates:
 * 1. Google Gemini API with specialised Dementia & NER Cognitive Memory Assistance System Prompt.
 * 2. Multi-tier comprehensive Offline Dementia Care Knowledge Engine (English, Assamese, Hindi, Bengali).
 * 3. Speech synthesis for voice output with Female/Male voice switching and elderly speed adjustments.
 */

import type { VoiceGender } from '../types/types';

export interface MiraContextData {
  patientName?: string;
  languageCode?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  currentScreen?: string;
  voiceSpeed?: 'slow' | 'normal' | 'fast';
  voiceGender?: VoiceGender;
}

export interface MiraChatResult {
  responseText: string;
  source: 'gemini' | 'offline_engine';
  suggestedAction?: 'play_memory' | 'play_sequence' | 'view_reminders' | 'view_family' | 'contact_caregiver' | null;
}

// ── Storage Keys ─────────────────────────────────────────────────────────────
const STORAGE_KEY_GEMINI_API_KEY = 'cogniva_gemini_api_key';
const STORAGE_KEY_GEMINI_MODEL = 'cogniva_gemini_model';
const STORAGE_KEY_PATIENT_PROFILE = 'cogniva_patient_profile';

export const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash';

// ── API Key & Model Configuration ────────────────────────────────────────────

export function getGeminiApiKey(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_GEMINI_API_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // ignore
  }
  return (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || '';
}

export function setGeminiApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY_GEMINI_API_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_GEMINI_API_KEY);
    }
  } catch {
    // ignore
  }
}

export function getGeminiModel(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_GEMINI_MODEL);
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // ignore
  }
  return DEFAULT_GEMINI_MODEL;
}

export function setGeminiModel(model: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_GEMINI_MODEL, model.trim());
  } catch {
    // ignore
  }
}

export function getPatientProfile(): { name: string; caregiverName: string; caregiverPhone: string } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PATIENT_PROFILE);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return {
    name: 'Arun',
    caregiverName: 'Priya',
    caregiverPhone: '+91 98765 43210',
  };
}

export function savePatientProfile(profile: { name: string; caregiverName: string; caregiverPhone: string }): void {
  try {
    localStorage.setItem(STORAGE_KEY_PATIENT_PROFILE, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

// ── System Prompt for Gemini ─────────────────────────────────────────────────

const LANG_NAME_MAP: Record<string, string> = {
  en: 'English',
  as: 'Assamese (অসমীয়া)',
  hi: 'Hindi (हिंदी)',
  bn: 'Bengali (বাংলা)',
};

function buildSystemPrompt(context: MiraContextData): string {
  const patient = getPatientProfile();
  const name = context.patientName || patient.name || 'dear friend';
  const langCode = context.languageCode || 'en';
  const langName = LANG_NAME_MAP[langCode] || 'English';
  const time = context.timeOfDay || 'day';
  const gender = context.voiceGender || 'female';

  return `You are ${gender === 'female' ? 'MIRA' : 'MIRO'}, a warm, patient, and compassionate AI memory companion on the COGNIVA platform.
COGNIVA is an AI-based cognitive gaming and memory assistance platform built specially for elderly dementia and memory-decline patients in the North-Eastern Region (NER) of India (Assam, Meghalaya, Arunachal Pradesh, Manipur, Nagaland, Mizoram, Tripura, Sikkim).

PATIENT CONTEXT:
- Patient Name: ${name}
- Caregiver: ${patient.caregiverName} (${patient.caregiverPhone})
- Current Time of Day: ${time}
- Preferred Language: ${langName} (${langCode})

CRITICAL MANDATORY RULES:
1. STRICT LANGUAGE REQUIREMENT:
   You MUST respond 100% in ${langName}.
   - If languageCode is 'as', reply ONLY in Assamese (অসমীয়া) script.
   - If languageCode is 'hi', reply ONLY in Hindi (हिंदी) Devanagari script.
   - If languageCode is 'bn', reply ONLY in Bengali (বাংলা) script.
   - If languageCode is 'en', reply in warm English.
   Do NOT reply in English when Assamese, Hindi, or Bengali is requested.

2. MEMORY ASSISTANCE & REALITY ORIENTATION:
   - Provide gentle, reassuring orientation. Ground the elder if they feel disoriented or confused.
   - Remind them of daily habits: morning tea, gentle walk, hydration, medicine at 12:30 PM, afternoon rest, family check-in.
   - Never say "You forgot" or "I already told you that". Always validate and comfort.

3. COGNITIVE ENGAGEMENT & GAMES:
   - Encourage them to play our cognitive games:
     * "Memory Match": matching cards with familiar North-Eastern symbols like Kaziranga rhino 🦏, traditional gamusa 🧣, bamboo 🎋, Assam tea ☕, wild orchids 🌸, and noble elephants 🐘.
     * "Daily Sequence": putting familiar daily routine steps in order to stimulate memory and executive function.
   - Keep encouragement gentle, warm, and zero-stress.

4. NORTH-EAST REGIONAL CULTURAL REMINISCENCE:
   - Bring up soothing North-Eastern cultural touches when reminiscing: fresh morning mist on the Brahmaputra, warm cups of Assam tea, sweet Bihu folk melodies, quiet green pine hills of Meghalaya.

5. DEMENTIA COMMUNICATION GUIDELINES:
   - Keep your response SHORT: between 1 and 3 short, calming sentences (maximum 35 words).
   - Use simple words, soothing tone, and unconditional positive regard.`;
}

// ── Multi-Intent Offline Dementia Knowledge Engine ───────────────────────────

type Intent =
  | 'game_memory'
  | 'game_sequence'
  | 'medicine'
  | 'time_date'
  | 'family'
  | 'anxiety_lost'
  | 'tea_culture'
  | 'morning'
  | 'night_sleep'
  | 'food_nutrition'
  | 'doctor_pain'
  | 'who_is_mira'
  | 'greeting_general';

function detectIntent(q: string): Intent {
  // Game - Memory match
  if (
    q.includes('memory') || q.includes('match') || q.includes('card') || q.includes('rhino') ||
    q.includes('খেলা') || q.includes('মেম’ৰী') || q.includes('গঁড়') ||
    q.includes('खेल') || q.includes('मेमोरी') || q.includes('गैंडा') ||
    q.includes('ম্যাচ') || q.includes('জোড়া')
  ) {
    return 'game_memory';
  }

  // Game - Daily sequence
  if (
    q.includes('sequence') || q.includes('routine') || q.includes('order') || q.includes('step') ||
    q.includes('ক্ৰম') || q.includes('ৰুটিন') ||
    q.includes('क्रम') || q.includes('दिनचर्या') ||
    q.includes('পর্যায়') || q.includes('সাজানো')
  ) {
    return 'game_sequence';
  }

  // Medicine & hydration
  if (
    q.includes('medicine') || q.includes('pill') || q.includes('dose') || q.includes('remind') || q.includes('water') ||
    q.includes('ঔষধ') || q.includes('দৰব') || q.includes('পানী') ||
    q.includes('दवा') || q.includes('गोली') || q.includes('पानी') ||
    q.includes('ওষুধ') || q.includes('জল')
  ) {
    return 'medicine';
  }

  // Time & Date
  if (
    q.includes('time') || q.includes('clock') || q.includes('day') || q.includes('today') || q.includes('date') ||
    q.includes('সময়') || q.includes('আজি') || q.includes('তাৰিখ') || q.includes('বাৰ') ||
    q.includes('वक्त') || q.includes('तारीख') || q.includes('दिन') ||
    q.includes('কয়টা') || q.includes('আজকে')
  ) {
    return 'time_date';
  }

  // Anxiety, disorientation, feeling lost
  if (
    q.includes('where am i') || q.includes('lost') || q.includes('scared') || q.includes('help') || q.includes('confused') || q.includes('afraid') || q.includes('anxious') ||
    q.includes('ক’ত আছোঁ') || q.includes('ভয়') || q.includes('সহায়') || q.includes('অসহায়') ||
    q.includes('कहाँ हूँ') || q.includes('डर') || q.includes('मदद') || q.includes('घबराहट') ||
    q.includes('কোথায় আছি') || q.includes('আতঙ্ক')
  ) {
    return 'anxiety_lost';
  }

  // North-Eastern Tea & Culture
  if (
    q.includes('tea') || q.includes('assam') || q.includes('bihu') || q.includes('brahmaputra') || q.includes('kaziranga') || q.includes('gamusa') || q.includes('shillong') || q.includes('meghalaya') ||
    q.includes('চাহ') || q.includes('অসম') || q.includes('বিহু') || q.includes('ব্ৰহ্মপুত্ৰ') || q.includes('গামোচা') ||
    q.includes('चाय') || q.includes('असम') || q.includes('बिहू') || q.includes('ब्रह्मपुत्र') ||
    q.includes('চা') || q.includes('শিলং')
  ) {
    return 'tea_culture';
  }

  // Family & loved ones
  if (
    q.includes('family') || q.includes('daughter') || q.includes('son') || q.includes('priya') || q.includes('children') || q.includes('wife') || q.includes('husband') ||
    q.includes('পৰিয়াল') || q.includes('ছোৱালী') || q.includes('ল’ৰা') || q.includes('প্ৰিয়া') ||
    q.includes('परिवार') || q.includes('बेटी') || q.includes('बेटा') || q.includes('प्रिया') ||
    q.includes('পরিবার') || q.includes('মেয়ে') || q.includes('ছেলে')
  ) {
    return 'family';
  }

  // Morning orientation
  if (
    q.includes('morning') || q.includes('wake') || q.includes('sunrise') ||
    q.includes('ৰাতিপুৱা') || q.includes('সুপ্ৰভাত') ||
    q.includes('सुबह') || q.includes('प्रभात') ||
    q.includes('সকাল')
  ) {
    return 'morning';
  }

  // Night & Sleep
  if (
    q.includes('night') || q.includes('sleep') || q.includes('bed') || q.includes('tired') ||
    q.includes('ৰাতি') || q.includes('টোপনি') ||
    q.includes('रात') || q.includes('नींद') || q.includes('सोना') ||
    q.includes('ঘুম') || q.includes('রাত')
  ) {
    return 'night_sleep';
  }

  // Food & meals
  if (
    q.includes('eat') || q.includes('food') || q.includes('breakfast') || q.includes('lunch') || q.includes('dinner') || q.includes('meal') ||
    q.includes('ভাত') || q.includes('খাদ্য') || q.includes('জলপান') ||
    q.includes('खाना') || q.includes('भोजन') || q.includes('नाश्ता') ||
    q.includes('খাবার')
  ) {
    return 'food_nutrition';
  }

  // Doctor / Pain / Unwell
  if (
    q.includes('doctor') || q.includes('hospital') || q.includes('pain') || q.includes('headache') || q.includes('sick') || q.includes('unwell') ||
    q.includes('ডাক্তৰ') || q.includes('বিষ') || q.includes('গা বেয়া') ||
    q.includes('डॉक्टर') || q.includes('अस्पताल') || q.includes('दर्द') || q.includes('बीमार') ||
    q.includes('যন্ত্রণা') || q.includes('অসুস্থ')
  ) {
    return 'doctor_pain';
  }

  // Who is MIRA
  if (
    q.includes('who are you') || q.includes('your name') || q.includes('what are you') ||
    q.includes('আপুনি কোন') || q.includes('তোমাৰ নাম') ||
    q.includes('आप कौन हैं') || q.includes('तुम्हारा नाम') ||
    q.includes('তুমি কে') || q.includes('আপনার নাম')
  ) {
    return 'who_is_mira';
  }

  return 'greeting_general';
}

function getOfflineDementiaResponse(query: string, context: MiraContextData): MiraChatResult {
  const q = query.toLowerCase().trim();
  const patient = getPatientProfile();
  const name = context.patientName || patient.name || 'Arun';
  const lang = context.languageCode || 'en';
  const intent = detectIntent(q);

  const now = new Date();
  const dateEn = now.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeEn = now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

  // ── Assamese (অসমীয়া) ────────────────────────────────────────────────────────
  if (lang === 'as') {
    switch (intent) {
      case 'game_memory':
        return {
          responseText: `নমস্কাৰ ${name}! আহক আমি মেম’ৰী মেচ (Memory Match) খেলোঁ। কাজিৰঙাৰ গঁড় 🦏 আৰু গামোচাৰ 🧣 কাৰ্ডবোৰ মিলালে মনটো সজীৱ হৈ থাকিব।`,
          source: 'offline_engine',
          suggestedAction: 'play_memory',
        };
      case 'game_sequence':
        return {
          responseText: `${name}, দৈনিক ক্ৰম (Daily Sequence) খেলটো খেলোঁ আহক। ৰাতিপুৱাৰ নিয়মবোৰ সঠিকভাৱে সজালে স্মৃতিশক্তি সবল হয়।`,
          source: 'offline_engine',
          suggestedAction: 'play_sequence',
        };
      case 'medicine':
        return {
          responseText: `${name}, আপোনাৰ দুপৰীয়া ১২:৩০ বজাত ঔষধ খোৱাৰ সময়। এতিয়া এগিলাচ পৰিষ্কাৰ পানী খাই অলপ জিৰণি লওক।`,
          source: 'offline_engine',
          suggestedAction: 'view_reminders',
        };
      case 'time_date':
        return {
          responseText: `আজিৰ দিনটো অতি শান্ত আৰু সুন্দৰ, ${name}। সময় হৈছে ${timeEn}। একো খৰখেদা নাই, আপুনি আৰামত থাকক।`,
          source: 'offline_engine',
          suggestedAction: null,
        };
      case 'anxiety_lost':
        return {
          responseText: `আপুনি নিজৰ মৰমৰ ঘৰতেই সম্পূৰ্ণ সুৰক্ষিতভাৱে আছে, ${name}। মই মীৰা, আপোনাৰ কাষতেই আছোঁ। একো চিন্তা নকৰিব।`,
          source: 'offline_engine',
          suggestedAction: 'contact_caregiver',
        };
      case 'tea_culture':
        return {
          responseText: `অসমৰ সেউজীয়া চাহ বাগিচা আৰু ব্ৰহ্মপুত্ৰৰ শীতল বতাহে মনলৈ শান্তি আনে, ${name}। এটুপি সুগন্ধি গৰম চাহ খাবনে?`,
          source: 'offline_engine',
          suggestedAction: 'play_memory',
        };
      case 'family':
        return {
          responseText: `আপোনাৰ পৰিয়ালে আপোনাক বৰ মৰম কৰে, ${name}। প্ৰিয়াই আপোনাৰ যত্ন লৈ আছে। স্মৃতিত আপোনাৰ পুৰণি ফটো চাব পাৰে।`,
          source: 'offline_engine',
          suggestedAction: 'view_family',
        };
      case 'morning':
        return {
          responseText: `সুপ্ৰভাত ${name}! এটা নতুন সুন্দৰ দিনৰ আৰম্ভণি হৈছে। মনটো প্ৰশান্ত ৰাখক আৰু অলপ খোজ কাঢ়ক।`,
          source: 'offline_engine',
          suggestedAction: 'play_sequence',
        };
      case 'night_sleep':
        return {
          responseText: `শুভ ৰাত্ৰি ${name}। দিনটোৰ ব্যস্ততাৰ অন্তত এতিয়া শান্তভাৱে টোপনি যাওক। আপুনি সম্পূৰ্ণ সুৰক্ষিত।`,
          source: 'offline_engine',
          suggestedAction: null,
        };
      case 'food_nutrition':
        return {
          responseText: `সময়মতে লঘু আৰু স্বাস্থ্যকৰ আহাৰ গ্ৰহণ কৰাটো স্বাস্থ্যৰ বাবে বৰ ভাল, ${name}। অলপ গৰম পানী খাই জিৰণি লওক।`,
          source: 'offline_engine',
          suggestedAction: null,
        };
      case 'doctor_pain':
        return {
          responseText: `যদি আপোনাৰ গা বেয়া লাগিছে, তেন্তে মই প্ৰিয়াক খবৰ দিওঁনে, ${name}? আপুনি অলপ সময় শুই থাকক।`,
          source: 'offline_engine',
          suggestedAction: 'contact_caregiver',
        };
      case 'who_is_mira':
        return {
          responseText: `মই মীৰা, আপোনাৰ মৰমৰ সংগী। আপোনাক কথা মনত পেলাই দিয়া আৰু মগজুৰ খেলত সহায় কৰাই মোৰ কাম।`,
          source: 'offline_engine',
          suggestedAction: 'play_memory',
        };
      default:
        return {
          responseText: `নমস্কাৰ ${name}! আজি আপোনাক কেনেদৰে সহায় কৰিব পাৰোঁ? মনটো সতেজ কৰিবলৈ এটা খেল খেলোঁ আহক।`,
          source: 'offline_engine',
          suggestedAction: 'play_memory',
        };
    }
  }

  // ── Hindi (हिंदी) ─────────────────────────────────────────────────────────────
  if (lang === 'hi') {
    switch (intent) {
      case 'game_memory':
        return {
          responseText: `नमस्ते ${name}! चलिए मेमोरी मैच खेलते हैं। असम के गैंडे 🦏 और चाय ☕ वाले सुंदर कार्ड मिलाते हैं।`,
          source: 'offline_engine',
          suggestedAction: 'play_memory',
        };
      case 'game_sequence':
        return {
          responseText: `${name} जी, चलिए दैनिक क्रम (Daily Sequence) का खेल खेलते हैं। सुबह की दिनचर्या सही क्रम में जमाने से दिमाग चुस्त रहता है।`,
          source: 'offline_engine',
          suggestedAction: 'play_sequence',
        };
      case 'medicine':
        return {
          responseText: `${name} जी, आपकी दोपहर की दवा का समय 12:30 बजे है। अभी आप थोड़ा ताजा पानी पीकर आराम कीजिए।`,
          source: 'offline_engine',
          suggestedAction: 'view_reminders',
        };
      case 'time_date':
        return {
          responseText: `आज का दिन बहुत शांत और सुखद है, ${name} जी। अभी समय ${timeEn} हुआ है। सब कुछ बहुत अच्छा चल रहा है।`,
          source: 'offline_engine',
          suggestedAction: null,
        };
      case 'anxiety_lost':
        return {
          responseText: `आप अपने प्यारे घर में पूरी तरह सुरक्षित हैं, ${name} जी। मैं आपकी साथी मीरा हूँ, चिंता की कोई बात नहीं।`,
          source: 'offline_engine',
          suggestedAction: 'contact_caregiver',
        };
      case 'tea_culture':
        return {
          responseText: `असम के चाय बागानों की भीनी खुशबू और ब्रह्मपुत्र की ठंडी हवा मन को बहुत सुकून देती है। क्या आप एक कप चाय लेंगे?`,
          source: 'offline_engine',
          suggestedAction: 'play_memory',
        };
      case 'family':
        return {
          responseText: `आपका परिवार आपसे बहुत प्यार करता है, ${name} जी। प्रिया आपका पूरा ख्याल रख रही हैं। आप यादों में तस्वीरें देख सकते हैं।`,
          source: 'offline_engine',
          suggestedAction: 'view_family',
        };
      case 'morning':
        return {
          responseText: `शुभ प्रभात ${name} जी! आज का सवेरा बहुत सुहाना है। चलिए थोड़ा ताज़ा हवा में सांस लेते हैं।`,
          source: 'offline_engine',
          suggestedAction: 'play_sequence',
        };
      case 'night_sleep':
        return {
          responseText: `शुभ रात्रि ${name} जी। अब आप आराम से सो जाइए, घर में सब सुरक्षित और शांत है।`,
          source: 'offline_engine',
          suggestedAction: null,
        };
      case 'food_nutrition':
        return {
          responseText: `पौष्टिक भोजन और पर्याप्त पानी पीना स्वास्थ्य के लिए बहुत आवश्यक है। आराम से भोजन कीजिए।`,
          source: 'offline_engine',
          suggestedAction: null,
        };
      case 'doctor_pain':
        return {
          responseText: `अगर आपको कोई तकलीफ है तो मैं प्रिया को सूचित करती हूँ, ${name} जी। आप बिल्कुल परेशान न हों।`,
          source: 'offline_engine',
          suggestedAction: 'contact_caregiver',
        };
      case 'who_is_mira':
        return {
          responseText: `मैं मीरा हूँ, आपकी डिजिटल सहेली। मैं आपको जरूरी बातें याद दिलाने और दिमागी खेलों में मदद करने के लिए यहाँ हूँ।`,
          source: 'offline_engine',
          suggestedAction: 'play_memory',
        };
      default:
        return {
          responseText: `नमस्ते ${name} जी! आज मैं आपकी क्या सेवा कर सकती हूँ? क्या आप कोई दिमागी खेल खेलना चाहेंगे?`,
          source: 'offline_engine',
          suggestedAction: 'play_memory',
        };
    }
  }

  // ── Bengali (বাংলা) ────────────────────────────────────────────────────────────
  if (lang === 'bn') {
    switch (intent) {
      case 'game_memory':
        return {
          responseText: `নমস্কার ${name}! আসুন আমরা মেমোরি ম্যাচ খেলি। গণ্ডার 🦏 এবং চায়ের ☕ সুন্দর কার্ডগুলো মেলালে মন ভালো থাকবে।`,
          source: 'offline_engine',
          suggestedAction: 'play_memory',
        };
      case 'game_sequence':
        return {
          responseText: `${name}, আসুন ডেইলি সিকোয়েন্স খেলা খেলি। সকালের কাজগুলো ধাপে ধাপে সাজালে স্মৃতিশক্তি সতেজ থাকে।`,
          source: 'offline_engine',
          suggestedAction: 'play_sequence',
        };
      case 'medicine':
        return {
          responseText: `${name}, আপনার দুপুর ১২:৩০ মিনিটে ওষুধ খাওয়ার সময়। এখন একটু জল খেয়ে বিশ্রাম নিন।`,
          source: 'offline_engine',
          suggestedAction: 'view_reminders',
        };
      case 'time_date':
        return {
          responseText: `আজকের দিনটি খুব শান্ত, ${name}। এখন সময় ${timeEn}। আপনি নিশ্চিন্তে থাকুন।`,
          source: 'offline_engine',
          suggestedAction: null,
        };
      case 'anxiety_lost':
        return {
          responseText: `আপনি নিজের ভালোবাসার বাড়িতে সম্পূর্ণ নিরাপদে আছেন, ${name}। আমি মীরা, আপনার সঙ্গেই আছি। ভয় পাবেন না।`,
          source: 'offline_engine',
          suggestedAction: 'contact_caregiver',
        };
      case 'tea_culture':
        return {
          responseText: `আসামের চা বাগান আর শান্ত নদীর স্নিগ্ধ হাওয়া মনকে জুড়িয়ে দেয়। এক কাপ গরম চা খাবেন কি?`,
          source: 'offline_engine',
          suggestedAction: 'play_memory',
        };
      case 'family':
        return {
          responseText: `আপনার পরিবার আপনাকে খুব ভালোবাসে, ${name}। প্রিয়া আপনার যত্ন নিচ্ছে। স্মৃতির পাতায় ছবি দেখতে পারেন।`,
          source: 'offline_engine',
          suggestedAction: 'view_family',
        };
      case 'morning':
        return {
          responseText: `সুপ্রভাত ${name}! একটি সুন্দর নতুন দিন শুরু হয়েছে। গভীর শ্বাস নিন এবং দিনটি উপভোগ করুন।`,
          source: 'offline_engine',
          suggestedAction: 'play_sequence',
        };
      case 'night_sleep':
        return {
          responseText: `শুভ রাত্রি ${name}। এখন পরম শান্তিতে ঘুমিয়ে পড়ুন। সব কিছু নিরাপদ আছে।`,
          source: 'offline_engine',
          suggestedAction: null,
        };
      case 'food_nutrition':
        return {
          responseText: `সময়মতো স্বাস্থ্যকর খাবার খাওয়া শরীরের জন্য খুব উপকারী। একটু জল খেয়ে নিন।`,
          source: 'offline_engine',
          suggestedAction: null,
        };
      case 'doctor_pain':
        return {
          responseText: `আপনার শরীর খারাপ লাগলে আমি প্রিয়াকে জানাচ্ছি, ${name}। আপনি একটু শুয়ে বিশ্রাম নিন।`,
          source: 'offline_engine',
          suggestedAction: 'contact_caregiver',
        };
      case 'who_is_mira':
        return {
          responseText: `আমি মীরা, আপনার যত্নশীল স্মৃতি ও বুদ্ধির সঙ্গী। আপনাকে সঙ্গ দিতেই আমি এখানে আছি।`,
          source: 'offline_engine',
          suggestedAction: 'play_memory',
        };
      default:
        return {
          responseText: `নমস্কার ${name}! আজ আপনার দিনটি শুভ হোক। আসুন একটি শান্ত স্মৃতি ম্যাচ খেলা খেলি।`,
          source: 'offline_engine',
          suggestedAction: 'play_memory',
        };
    }
  }

  // ── English (Universal Default) ──────────────────────────────────────────────
  switch (intent) {
    case 'game_memory':
      return {
        responseText: `Hello ${name}! Playing our Memory Match game is a wonderful way to keep your mind sharp. Shall we match the rhino 🦏 and tea ☕ cards together?`,
        source: 'offline_engine',
        suggestedAction: 'play_memory',
      };
    case 'game_sequence':
      return {
        responseText: `Good day ${name}! Let's try the Daily Sequence game. Arranging your morning routine helps the mind feel refreshed and organised.`,
        source: 'offline_engine',
        suggestedAction: 'play_sequence',
      };
    case 'medicine':
      return {
        responseText: `${name}, your next medicine reminder is at 12:30 PM after lunch. Remember to take a sip of fresh water right now.`,
        source: 'offline_engine',
        suggestedAction: 'view_reminders',
      };
    case 'time_date':
      return {
        responseText: `Today is ${dateEn}, and it is ${timeEn}. Everything is calm and peaceful, ${name}. Take a nice deep breath.`,
        source: 'offline_engine',
        suggestedAction: null,
      };
    case 'anxiety_lost':
      return {
        responseText: `You are safe at home, ${name}. Everything is alright and you are surrounded by care. I am Mira, your friendly companion, right here with you.`,
        source: 'offline_engine',
        suggestedAction: 'contact_caregiver',
      };
    case 'tea_culture':
      return {
        responseText: `Ah, the beauty of North-East India! The fresh scent of Assam tea gardens and gentle morning river breeze always bring calm to the mind. Would you like a warm cup?`,
        source: 'offline_engine',
        suggestedAction: 'play_memory',
      };
    case 'family':
      return {
        responseText: `Your family loves you dearly, ${name}. ${patient.caregiverName} is taking wonderful care of you, and you can see family photos anytime in the Memories tab.`,
        source: 'offline_engine',
        suggestedAction: 'view_family',
      };
    case 'morning':
      return {
        responseText: `Good morning, ${name}! The sun is rising over the hills. It is a lovely new day to stretch gently and enjoy your morning tea.`,
        source: 'offline_engine',
        suggestedAction: 'play_sequence',
      };
    case 'night_sleep':
      return {
        responseText: `Good night, ${name}. The day is complete, and your home is quiet and secure. Close your eyes and have peaceful dreams.`,
        source: 'offline_engine',
        suggestedAction: null,
      };
    case 'food_nutrition':
      return {
        responseText: `Eating nourishing meals and drinking clean water keeps the body energized, ${name}. Enjoy your meal peacefully.`,
        source: 'offline_engine',
        suggestedAction: null,
      };
    case 'doctor_pain':
      return {
        responseText: `If you are feeling unwell or in pain, ${name}, please rest comfortably while I alert ${patient.caregiverName} to help you.`,
        source: 'offline_engine',
        suggestedAction: 'contact_caregiver',
      };
    case 'who_is_mira':
      return {
        responseText: `I am MIRA, your friendly cognitive companion created specially for you. I am here to help you remember, play gentle games, and bring a smile to your day.`,
        source: 'offline_engine',
        suggestedAction: 'play_memory',
      };
    default:
      return {
        responseText: `Hello ${name}, I am MIRA. I am here to help you remember your day, enjoy gentle cognitive games, and keep you company. How can I brighten your day?`,
        source: 'offline_engine',
        suggestedAction: 'play_memory',
      };
  }
}

// ── Main Gemini Interaction Function ─────────────────────────────────────────

export async function askMira(
  userQuery: string,
  context: MiraContextData = {}
): Promise<MiraChatResult> {
  const trimmed = userQuery.trim();
  if (!trimmed) {
    return getOfflineDementiaResponse('hello', context);
  }

  const apiKey = getGeminiApiKey();
  const model = getGeminiModel();

  // If no API key provided, seamlessly use the offline dementia engine
  if (!apiKey) {
    return getOfflineDementiaResponse(trimmed, context);
  }

  const systemInstruction = buildSystemPrompt(context);
  const langName = LANG_NAME_MAP[context.languageCode || 'en'] || 'English';

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemInstruction}\n\nSTRICT: Answer in ${langName} only.\nPatient asks or says: "${trimmed}"\nMIRA response (1-3 sentences max in ${langName}):`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.6,
        topP: 0.85,
        maxOutputTokens: 120,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[MIRA] Gemini API status ${response.status}. Using offline engine.`);
      return getOfflineDementiaResponse(trimmed, context);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (text) {
      return {
        responseText: text,
        source: 'gemini',
        suggestedAction: text.toLowerCase().includes('game') ? 'play_memory' : null,
      };
    }

    return getOfflineDementiaResponse(trimmed, context);
  } catch (err) {
    console.warn('[MIRA] Gemini API request failed. Using offline engine.', err);
    return getOfflineDementiaResponse(trimmed, context);
  }
}

// ── Speech Synthesis (Female/Male TTS with Dementia Speed) ────────────────────

export function speakMira(
  text: string,
  options: {
    languageCode?: string;
    speed?: 'slow' | 'normal' | 'fast';
    gender?: VoiceGender;
    soundEnabled?: boolean;
  } = {}
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (options.soundEnabled === false) return;

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const cleanText = text
      .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
      .replace(/[*_#`~]/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Voice speed: slow (0.8x for dementia patients), normal (0.95x), fast (1.1x)
    const rateMap = { slow: 0.8, normal: 0.95, fast: 1.1 };
    utterance.rate = rateMap[options.speed || 'normal'] || 0.95;

    const gender = options.gender || 'female';

    // Pitch adjustment for female vs male
    if (gender === 'female') {
      utterance.pitch = 1.15; // Natural warm feminine tone
    } else {
      utterance.pitch = 0.88; // Calm masculine tone
    }

    const lang = options.languageCode || 'en';
    const langMap: Record<string, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      as: 'as-IN',
      bn: 'bn-IN',
    };
    const targetLang = langMap[lang] || 'en-IN';
    utterance.lang = targetLang;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const femaleKeywords = ['female', 'zira', 'samantha', 'victoria', 'karen', 'veena', 'priya', 'heera', 'swara', 'kalpana', 'aditi', 'lekha'];
      const maleKeywords = ['male', 'david', 'george', 'mark', 'ravi', 'neel', 'madhav', 'guy', 'alex', 'daniel'];
      const keywords = gender === 'female' ? femaleKeywords : maleKeywords;

      // Match language prefix + gender keyword
      let bestVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith(targetLang.split('-')[0].toLowerCase()) &&
          keywords.some((kw) => v.name.toLowerCase().includes(kw))
      );

      // Match gender keyword in any language
      if (!bestVoice) {
        bestVoice = voices.find((v) => keywords.some((kw) => v.name.toLowerCase().includes(kw)));
      }

      // Match language prefix
      if (!bestVoice) {
        bestVoice = voices.find((v) => v.lang.toLowerCase().startsWith(targetLang.split('-')[0].toLowerCase()));
      }

      if (bestVoice) {
        utterance.voice = bestVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[MIRA] Speech synthesis error:', err);
  }
}
