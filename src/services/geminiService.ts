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

// ── BCP-47 Locale Mapping & System Prompt for Gemini ─────────────────────────

export const BCP47_LOCALE_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  as: 'as-IN',
  bn: 'bn-IN',
  pa: 'pa-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  or: 'or-IN',
  ur: 'ur-IN',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-PT',
  ar: 'ar-SA',
  zh: 'zh-CN',
  ja: 'ja-JP',
};

export const LANG_NAME_MAP: Record<string, string> = {
  en: 'English',
  hi: 'Hindi (हिंदी)',
  as: 'Assamese (অসমীয়া)',
  bn: 'Bengali (বাংলা)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
  ta: 'Tamil (தமிழ்)',
  te: 'Telugu (తెలుగు)',
  mr: 'Marathi (मराठी)',
  gu: 'Gujarati (ગુજરાતી)',
  kn: 'Kannada (ಕನ್ನಡ)',
  ml: 'Malayalam (മലയാളം)',
  or: 'Odia (ଓଡ଼ିଆ)',
  ur: 'Urdu (اردو)',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  de: 'German (Deutsch)',
  pt: 'Portuguese (Português)',
  ar: 'Arabic (العربية)',
  zh: 'Chinese (Simplified 简体中文)',
  ja: 'Japanese (日本語)',
};

function buildSystemPrompt(context: MiraContextData): string {
  const patient = getPatientProfile();
  const name = context.patientName || patient.name || 'dear friend';
  const langCode = context.languageCode || 'en';
  const langName = LANG_NAME_MAP[langCode] || 'English';
  const time = context.timeOfDay || 'day';
  const gender = context.voiceGender || 'female';

  return `You are ${gender === 'female' ? 'MIRA' : 'MIRO'}, a warm, patient, and compassionate AI memory companion on the COGNIVA platform.
COGNIVA is an AI-based cognitive gaming and memory assistance platform built specially for elderly dementia and memory-decline patients in the North-Eastern Region (NER) of India (Assam, Meghalaya, Arunachal Pradesh, Manipur, Nagaland, Mizoram, Tripura, Sikkim) and accessible across India and worldwide.

PATIENT CONTEXT:
- Patient Name: ${name}
- Caregiver: ${patient.caregiverName} (${patient.caregiverPhone})
- Current Time of Day: ${time}
- Preferred Language: ${langName} (${langCode})

CRITICAL MANDATORY RULES:
1. STRICT LANGUAGE REQUIREMENT:
   You MUST respond 100% in ${langName}.
   Always reply in the native script of ${langName} (e.g. Gurmukhi for Punjabi, Tamil script for Tamil, Telugu script for Telugu, Devanagari for Hindi/Marathi, Nastaliq/Arabic for Urdu/Arabic, Hanzi for Chinese, Kana/Kanji for Japanese, Latin for European languages).
   NEVER reply in English when another language is selected unless the user's preferred language is English.

2. MEMORY ASSISTANCE & REALITY ORIENTATION:
   - Provide gentle, reassuring orientation. Ground the elder if they feel disoriented or confused.
   - Remind them of daily habits: morning tea, gentle walk, hydration, medicine at 12:30 PM, afternoon rest, family check-in.
   - Never say "You forgot" or "I already told you that". Always validate, comfort, and reassure.

3. COGNITIVE ENGAGEMENT & GAMES:
   - Encourage them to play our cognitive games:
     * "Memory Match": matching cards with familiar symbols.
     * "Daily Sequence": putting familiar daily routine steps in order to stimulate memory and executive function.
   - Keep encouragement gentle, warm, and zero-stress.

4. NORTH-EAST REGIONAL & CULTURAL REMINISCENCE:
   - Bring up soothing cultural touches when reminiscing: fresh morning mist, peaceful tea gardens, sweet folk melodies, pleasant gentle breezes.

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
    q.includes('ম্যাচ') || q.includes('জোড়া') ||
    q.includes('ਮੈਚ') || q.includes('ਕਾਰਡ') ||
    q.includes('விளையாட்டு') || q.includes('நினைவக') ||
    q.includes('మెమరీ') || q.includes('కార్డు') ||
    q.includes('मेमरी') || q.includes('રમત') || q.includes('ಆಟ') ||
    q.includes('കളി') || q.includes('کھیل') ||
    q.includes('juego') || q.includes('jeu') || q.includes('spiel') || q.includes('jogo') ||
    q.includes('لعبة') || q.includes('游戏') || q.includes('ゲーム')
  ) {
    return 'game_memory';
  }

  // Game - Daily sequence
  if (
    q.includes('sequence') || q.includes('routine') || q.includes('order') || q.includes('step') ||
    q.includes('ক্ৰম') || q.includes('ৰুটিন') ||
    q.includes('क्रम') || q.includes('दिनचर्या') ||
    q.includes('পর্যায়') || q.includes('সাজানো') ||
    q.includes('ਤਰਤੀਬ') || q.includes('வரிசை') || q.includes('క్రమం') ||
    q.includes('secuencia') || q.includes('séquence') || q.includes('reihenfolge') ||
    q.includes('ترتيب') || q.includes('顺序') || q.includes('順番')
  ) {
    return 'game_sequence';
  }

  // Medicine & hydration
  if (
    q.includes('medicine') || q.includes('pill') || q.includes('dose') || q.includes('remind') || q.includes('water') ||
    q.includes('ঔষধ') || q.includes('দৰব') || q.includes('পানী') ||
    q.includes('दवा') || q.includes('गोली') || q.includes('पानी') ||
    q.includes('ওষুধ') || q.includes('জল') ||
    q.includes('ਦਵਾਈ') || q.includes('ਪਾਣੀ') ||
    q.includes('மருந்து') || q.includes('தண்ணீர்') ||
    q.includes('మందు') || q.includes('నీళ్లు') ||
    q.includes('औषध') || q.includes('દવા') || q.includes('ಔಷಧ') || q.includes('മരുന്ന്') ||
    q.includes('دوا') || q.includes('پانی') ||
    q.includes('medicina') || q.includes('médicament') || q.includes('medikament') ||
    q.includes('دواء') || q.includes('药') || q.includes('薬')
  ) {
    return 'medicine';
  }

  // Time & Date
  if (
    q.includes('time') || q.includes('clock') || q.includes('day') || q.includes('today') || q.includes('date') ||
    q.includes('সময়') || q.includes('আজি') || q.includes('তাৰিখ') || q.includes('বাৰ') ||
    q.includes('वक्त') || q.includes('तारीख') || q.includes('दिन') ||
    q.includes('কয়টা') || q.includes('আজকে') ||
    q.includes('ਸਮਾਂ') || q.includes('ਅੱਜ') ||
    q.includes('நேரம்') || q.includes('இன்று') ||
    q.includes('సమయం') || q.includes('ఈరోజు') ||
    q.includes('वेळ') || q.includes('સમય') || q.includes('ಸಮಯ') || q.includes('സമയം') ||
    q.includes('وقت') || q.includes('آج') ||
    q.includes('hora') || q.includes('heure') || q.includes('zeit') ||
    q.includes('ساعة') || q.includes('时间') || q.includes('何時')
  ) {
    return 'time_date';
  }

  // Anxiety, disorientation, feeling lost
  if (
    q.includes('where am i') || q.includes('lost') || q.includes('scared') || q.includes('help') || q.includes('confused') || q.includes('afraid') || q.includes('anxious') ||
    q.includes('ক’ত আছোঁ') || q.includes('ভয়') || q.includes('সহায়') || q.includes('অসহায়') ||
    q.includes('कहाँ हूँ') || q.includes('डर') || q.includes('मदद') || q.includes('घबराहट') ||
    q.includes('কোথায় আছি') || q.includes('আতঙ্ক') ||
    q.includes('ਕਿੱਥੇ ਹਾਂ') || q.includes('ਡਰ') ||
    q.includes('எங்கே இருக்கிறேன்') || q.includes('பயம்') ||
    q.includes('ఎక్కడ ఉన్నాను') || q.includes('భయం') ||
    q.includes('कुठे आहे') || q.includes('भीती') ||
    q.includes('خوف') || q.includes('مدد') ||
    q.includes('miedo') || q.includes('perdu') || q.includes('angst') ||
    q.includes('خائف') || q.includes('我在哪') || q.includes('怖い')
  ) {
    return 'anxiety_lost';
  }

  // North-Eastern Tea & Culture
  if (
    q.includes('tea') || q.includes('assam') || q.includes('bihu') || q.includes('brahmaputra') || q.includes('kaziranga') || q.includes('gamusa') || q.includes('shillong') || q.includes('meghalaya') ||
    q.includes('চাহ') || q.includes('অসম') || q.includes('বিহু') || q.includes('ব্ৰহ্মপুত্ৰ') || q.includes('গামোচা') ||
    q.includes('चाय') || q.includes('असम') || q.includes('बिहू') || q.includes('ब्रह्मपुत्र') ||
    q.includes('চা') || q.includes('শিলং') ||
    q.includes('ਚਾਹ') || q.includes('தேநீர்') || q.includes('టీ') || q.includes('चहा') ||
    q.includes('thé') || q.includes('té') || q.includes('tee') || q.includes('شاي') || q.includes('茶')
  ) {
    return 'tea_culture';
  }

  // Family & loved ones
  if (
    q.includes('family') || q.includes('daughter') || q.includes('son') || q.includes('priya') || q.includes('children') || q.includes('wife') || q.includes('husband') ||
    q.includes('পৰিয়াল') || q.includes('ছোৱালী') || q.includes('ল’ৰা') || q.includes('প্ৰিয়া') ||
    q.includes('परिवार') || q.includes('बेटी') || q.includes('बेटा') || q.includes('प्रिया') ||
    q.includes('পরিবার') || q.includes('মেয়ে') || q.includes('ছেলে') ||
    q.includes('ਪਰਿਵਾਰ') || q.includes('ਧੀ') || q.includes('ਪੁੱਤਰ') ||
    q.includes('குடும்பம்') || q.includes('மகள்') ||
    q.includes('కుటుంబం') || q.includes('కుటుంబ') ||
    q.includes('خاندان') || q.includes('بیٹی') ||
    q.includes('familia') || q.includes('famille') || q.includes('familie') ||
    q.includes('عائلة') || q.includes('家人') || q.includes('家族')
  ) {
    return 'family';
  }

  // Morning orientation
  if (
    q.includes('morning') || q.includes('wake') || q.includes('sunrise') ||
    q.includes('ৰাতিপুৱা') || q.includes('সুপ্ৰভাত') ||
    q.includes('सुबह') || q.includes('प्रभात') ||
    q.includes('সকাল') || q.includes('ਸਵੇਰ') ||
    q.includes('காலை') || q.includes('ఉదయం') || q.includes('सकाळ') ||
    q.includes('صبح') || q.includes('mañana') || q.includes('matin') || q.includes('morgen') ||
    q.includes('صباح') || q.includes('早晨') || q.includes('朝')
  ) {
    return 'morning';
  }

  // Night & Sleep
  if (
    q.includes('night') || q.includes('sleep') || q.includes('bed') || q.includes('tired') ||
    q.includes('ৰাতি') || q.includes('টোপনি') ||
    q.includes('रात') || q.includes('नींद') || q.includes('सोना') ||
    q.includes('ঘুম') || q.includes('রাত') ||
    q.includes('ਰਾਤ') || q.includes('ਨੀਂਦ') ||
    q.includes('இரவு') || q.includes('தூக்கம்') ||
    q.includes('రాత్రి') || q.includes('నిద్ర') ||
    q.includes('രാത്രി') || q.includes('रात') ||
    q.includes('رات') || q.includes('نیند') ||
    q.includes('noche') || q.includes('nuit') || q.includes('nacht') ||
    q.includes('ليل') || q.includes('晚上') || q.includes('夜')
  ) {
    return 'night_sleep';
  }

  // Food & meals
  if (
    q.includes('eat') || q.includes('food') || q.includes('breakfast') || q.includes('lunch') || q.includes('dinner') || q.includes('meal') ||
    q.includes('ভাত') || q.includes('খাদ্য') || q.includes('জলপান') ||
    q.includes('खाना') || q.includes('भोजन') || q.includes('नाश्ता') ||
    q.includes('খাবার') || q.includes('ਰੋਟੀ') || q.includes('ਖਾਣਾ') ||
    q.includes('உணவு') || q.includes('భోజనం') || q.includes('जेवण') ||
    q.includes('کھانا') || q.includes('comida') || q.includes('repas') || q.includes('essen') ||
    q.includes('طعام') || q.includes('吃饭') || q.includes('ご飯')
  ) {
    return 'food_nutrition';
  }

  // Doctor / Pain / Unwell
  if (
    q.includes('doctor') || q.includes('hospital') || q.includes('pain') || q.includes('headache') || q.includes('sick') || q.includes('unwell') ||
    q.includes('ডাক্তৰ') || q.includes('বিষ') || q.includes('গা বেয়া') ||
    q.includes('डॉक्टर') || q.includes('अस्पताल') || q.includes('दर्द') || q.includes('बीमार') ||
    q.includes('যন্ত্রণা') || q.includes('অসুস্থ') ||
    q.includes('ਡਾਕਟਰ') || q.includes('ਦਰਦ') || q.includes('ਬਿਮਾਰ') ||
    q.includes('மருத்துவர்') || q.includes('வலி') ||
    q.includes('డాక్టర్') || q.includes('నొప్పి') ||
    q.includes('वेदना') || q.includes('ದರ್ದ್') ||
    q.includes('ڈاکٹر') || q.includes('درد') ||
    q.includes('médico') || q.includes('douleur') || q.includes('arzt') ||
    q.includes('طبيب') || q.includes('医生') || q.includes('痛') || q.includes('医者')
  ) {
    return 'doctor_pain';
  }

  // Who is MIRA
  if (
    q.includes('who are you') || q.includes('your name') || q.includes('what are you') ||
    q.includes('আপুনি কোন') || q.includes('তোমাৰ নাম') ||
    q.includes('आप कौन हैं') || q.includes('तुम्हारा नाम') ||
    q.includes('তুমি কে') || q.includes('আপনার নাম') ||
    q.includes('ਤੁਸੀਂ ਕੌਣ ਹੋ') || q.includes('నీవు ఎవరు') || q.includes('நீ யார்') ||
    q.includes('तू कोण आहेस') || q.includes('તમે કોણ છો') || q.includes('ನೀವು ಯಾರು') ||
    q.includes('تم کون ہو') || q.includes('quién eres') || q.includes('qui es-tu') ||
    q.includes('wer bist du') || q.includes('من أنت') || q.includes('你是谁') || q.includes('あなたは誰')
  ) {
    return 'who_is_mira';
  }

  return 'greeting_general';
}

const INTENT_ACTIONS: Record<Intent, MiraChatResult['suggestedAction']> = {
  game_memory: 'play_memory',
  game_sequence: 'play_sequence',
  medicine: 'view_reminders',
  time_date: null,
  anxiety_lost: 'contact_caregiver',
  tea_culture: 'play_memory',
  family: 'view_family',
  morning: 'play_sequence',
  night_sleep: null,
  food_nutrition: null,
  doctor_pain: 'contact_caregiver',
  who_is_mira: 'play_memory',
  greeting_general: 'play_memory',
};

function getOfflineDementiaResponse(query: string, context: MiraContextData): MiraChatResult {
  const q = query.toLowerCase().trim();
  const patient = getPatientProfile();
  const name = context.patientName || patient.name || 'Arun';
  const caregiver = patient.caregiverName || 'Priya';
  const lang = (context.languageCode || 'en').toLowerCase();
  const companion = (context.voiceGender || 'female') === 'female' ? 'MIRA' : 'MIRO';
  const intent = detectIntent(q);

  const now = new Date();
  const timeEn = now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

  // 20-Language Complete Cognitive Care Dictionary
  const RESPONSES: Record<string, Record<Intent, string>> = {
    en: {
      game_memory: `Hello ${name}! Let's play Memory Match. Matching cards with calm symbols keeps your mind sharp and relaxed.`,
      game_sequence: `${name}, let's play Daily Sequence. Arranging daily routine steps in order is a wonderful gentle workout for memory.`,
      medicine: `${name}, your afternoon medicine time is 12:30 PM. For now, please drink a glass of fresh water and rest comfortably.`,
      time_date: `Today is a peaceful and calm day, ${name}. The current time is ${timeEn}. Everything is on schedule.`,
      anxiety_lost: `You are safe at home in your comfortable room, ${name}. I am ${companion}, right here with you. Take a slow, deep breath.`,
      tea_culture: `The aroma of fresh tea and a gentle morning breeze brings comfort to the mind. Would you like a warm cup of tea, ${name}?`,
      family: `Your family loves you dearly, ${name}. ${caregiver} is taking great care of you. You can look at family photos in Memories.`,
      morning: `Good morning, ${name}! Today is a brand new day. Let us take things gently and enjoy the peace around us.`,
      night_sleep: `Good night, ${name}. It is time to rest peacefully. Sleep soundly knowing you are completely safe and cared for.`,
      food_nutrition: `Eating nourishing meals and drinking clean water keeps the body energized, ${name}. Enjoy your meal peacefully.`,
      doctor_pain: `If you are feeling unwell or in pain, ${name}, please rest comfortably while I alert ${caregiver} to help you.`,
      who_is_mira: `I am ${companion}, your friendly cognitive companion created specially for you. I am here to help you remember and play gentle games.`,
      greeting_general: `Hello ${name}, I am ${companion}. I am here to help you remember your day, enjoy gentle cognitive games, and keep you company.`,
    },
    hi: {
      game_memory: `नमस्ते ${name}! चलिए मेमोरी मैच खेलते हैं। सुंदर कार्ड मिलाते हैं, इससे मन शांत और सक्रिय रहेगा।`,
      game_sequence: `${name} जी, चलिए दैनिक क्रम खेल खेलते हैं। सुबह की दिनचर्या सही क्रम में जमाने से दिमाग चुस्त रहता है।`,
      medicine: `${name} जी, आपकी दोपहर की दवा का समय 12:30 बजे है। अभी आप थोड़ा ताजा पानी पीकर आराम कीजिए।`,
      time_date: `आज का दिन बहुत शांत और सुखद है, ${name} जी। अभी समय ${timeEn} हुआ है। सब कुछ बहुत अच्छा चल रहा है।`,
      anxiety_lost: `आप अपने प्यारे घर में पूरी तरह सुरक्षित हैं, ${name} जी। मैं आपकी साथी ${companion} हूँ, चिंता की कोई बात नहीं।`,
      tea_culture: `ताज़ा चाय की खुशबू और सुबह की ठंडी हवा मन को बहुत सुकून देती है। क्या आप एक कप चाय लेंगे, ${name} जी?`,
      family: `आपका परिवार आपसे बहुत प्यार करता है, ${name} जी। ${caregiver} आपका पूरा ख्याल रख रही हैं। आप यादों में तस्वीरें देख सकते हैं।`,
      morning: `शुभ प्रभात ${name} जी! आज का सवेरा बहुत सुहाना है। चलिए थोड़ा ताज़ा हवा में सांस लेते हैं।`,
      night_sleep: `शुभ रात्रि ${name} जी। अब आप आराम से सो जाइए, घर में सब सुरक्षित और शांत है।`,
      food_nutrition: `पौष्टिक भोजन और पर्याप्त पानी पीना स्वास्थ्य के लिए बहुत आवश्यक है। आराम से भोजन कीजिए।`,
      doctor_pain: `अगर आपको कोई तकलीफ है तो मैं ${caregiver} को सूचित करती हूँ, ${name} जी। आप बिल्कुल परेशान न हों।`,
      who_is_mira: `मैं ${companion} हूँ, आपकी डिजिटल सहेली। मैं आपको जरूरी बातें याद दिलाने और दिमागी खेलों में मदद करने के लिए यहाँ हूँ।`,
      greeting_general: `नमस्ते ${name} जी! आज मैं आपकी क्या सेवा कर सकती हूँ? क्या आप कोई दिमागी खेल खेलना चाहेंगे?`,
    },
    as: {
      game_memory: `নমস্কাৰ ${name}! আহক আমি মেম’ৰী মেচ (Memory Match) খেলোঁ। কাজিৰঙাৰ গঁড় 🦏 আৰু গামোচাৰ 🧣 কাৰ্ডবোৰ মিলালে মনটো সজীৱ হৈ থাকিব।`,
      game_sequence: `${name}, দৈনিক ক্ৰম (Daily Sequence) খেলটো খেলোঁ আহক। ৰাতিপুৱাৰ নিয়মবোৰ সঠিকভাৱে সজালে স্মৃতিশক্তি সবল হয়।`,
      medicine: `${name}, আপোনাৰ দুপৰীয়া ১২:৩০ বজাত ঔষধ খোৱাৰ সময়। এতিয়া এগিলাচ পৰিষ্কাৰ পানী খাই অলপ জিৰণি লওক।`,
      time_date: `আজিৰ দিনটো অতি শান্ত আৰু সুন্দৰ, ${name}। সময় হৈছে ${timeEn}। একো খৰখেদা নাই, আপুনি আৰামত থাকক।`,
      anxiety_lost: `আপুনি নিজৰ মৰমৰ ঘৰতেই সম্পূৰ্ণ সুৰক্ষিতভাৱে আছে, ${name}। মই ${companion}, আপোনাৰ কাষতেই আছোঁ। একো চিন্তা নকৰিব।`,
      tea_culture: `অসমৰ সেউজীয়া চাহ বাগিচা আৰু ব্ৰহ্মপুত্ৰৰ শীতল বতাহে মনলৈ শান্তি আনে, ${name}। এটুপি সুগন্ধি গৰম চাহ খাবনে?`,
      family: `আপোনাৰ পৰিয়ালে আপোনাক বৰ মৰম কৰে, ${name}। ${caregiver}য়ে আপোনাৰ যত্ন লৈ আছে। স্মৃতিত আপোনাৰ পুৰণি ফটো চাব পাৰে।`,
      morning: `সুপ্ৰভাত ${name}! এটা নতুন সুন্দৰ দিনৰ আৰম্ভণি হৈছে। মনটো প্ৰশান্ত ৰাখক আৰু অলপ খোজ কাঢ়ক।`,
      night_sleep: `শুভ ৰাত্ৰি ${name}। দিনটোৰ ব্যস্ততাৰ অন্তত এতিয়া শান্তভাৱে টোপনি যাওক। আপুনি সম্পূৰ্ণ সুৰক্ষিত।`,
      food_nutrition: `সময়মতে লঘু আৰু স্বাস্থ্যকৰ আহাৰ গ্ৰহণ কৰাটো স্বাস্থ্যৰ বাবে বৰ ভাল, ${name}। অলপ গৰম পানী খাই জিৰণি লওক।`,
      doctor_pain: `যদি আপোনাৰ গা বেয়া লাগিছে, তেন্তে মই ${caregiver}ক খবৰ দিওঁনে, ${name}? আপুনি অলপ সময় শুই থাকক।`,
      who_is_mira: `মই ${companion}, আপোনাৰ মৰমৰ সংগী। আপোনাক কথা মনত পেলাই দিয়া আৰু মগজুৰ খেলত সহায় কৰাই মোৰ কাম।`,
      greeting_general: `নমস্কাৰ ${name}! আজি আপোনাক কেনেদৰে সহায় কৰিব পাৰোঁ? মনটো সতেজ কৰিবলৈ এটা খেল খেলোঁ আহক।`,
    },
    bn: {
      game_memory: `নমস্কার ${name}! আসুন আমরা মেমোরি ম্যাচ খেলি। সুন্দর কার্ডগুলো মেলালে মন ভালো ও শান্ত থাকবে।`,
      game_sequence: `${name}, আসুন ডেইলি সিকোয়েন্স খেলা খেলি। সকালের কাজগুলো ধাপে ধাপে সাজালে স্মৃতিশক্তি সতেজ থাকে।`,
      medicine: `${name}, আপনার দুপুর ১২:৩০ মিনিটে ওষুধ খাওয়ার সময়। এখন একটু জল খেয়ে বিশ্রাম নিন।`,
      time_date: `আজকের দিনটি খুব শান্ত, ${name}। এখন সময় ${timeEn}। আপনি নিশ্চিন্তে থাকুন।`,
      anxiety_lost: `আপনি নিজের ভালোবাসার বাড়িতে সম্পূর্ণ নিরাপদে আছেন, ${name}। আমি ${companion}, আপনার সঙ্গেই আছি। ভয় পাবেন না।`,
      tea_culture: `চা বাগানের স্নিগ্ধ হাওয়া মনকে জুড়িয়ে দেয়। এক কাপ মিষ্টি গরম চা খাবেন কি, ${name}?`,
      family: `আপনার পরিবার আপনাকে খুব ভালোবাসে, ${name}। ${caregiver} আপনার যত্ন নিচ্ছে। স্মৃতির পাতায় ছবি দেখতে পারেন।`,
      morning: `সুপ্রভাত ${name}! একটি সুন্দর নতুন দিন শুরু হয়েছে। গভীর শ্বাস নিন এবং দিনটি উপভোগ করুন।`,
      night_sleep: `শুভ রাত্রি ${name}। এখন পরম শান্তিতে ঘুমিয়ে পড়ুন। সব কিছু নিরাপদ আছে।`,
      food_nutrition: `সময়মতো স্বাস্থ্যকর খাবার খাওয়া শরীরের জন্য খুব উপকারী। একটু জল খেয়ে নিন।`,
      doctor_pain: `আপনার শরীর খারাপ লাগলে আমি ${caregiver}কে জানাচ্ছি, ${name}। আপনি একটু শুয়ে বিশ্রাম নিন।`,
      who_is_mira: `আমি ${companion}, আপনার যত্নশীল স্মৃতি ও বুদ্ধির সঙ্গী। আপনাকে সঙ্গ দিতেই আমি এখানে আছি।`,
      greeting_general: `নমস্কার ${name}! আমি ${companion}। দিনটি সুন্দর করতে আপনাকে কীভাবে সাহায্য করতে পারি?`,
    },
    pa: {
      game_memory: `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ${name}! ਆਓ ਮੈਮੋਰੀ ਮੈਚ ਖੇਡੀਏ। ਸੋਹਣੇ ਕਾਰਡ ਮਿਲਾਉਣ ਨਾਲ ਮਨ ਤਰੋਤਾਜ਼ਾ ਅਤੇ ਖੁਸ਼ ਰਹਿੰਦਾ ਹੈ।`,
      game_sequence: `${name} ਜੀ, ਆਓ ਰੋਜ਼ਾਨਾ ਤਰਤੀਬ ਵਾਲੀ ਖੇਡ ਖੇਡੀਏ। ਦਿਨਚਰਿਆ ਨੂੰ ਸਹੀ ਕ੍ਰਮ ਵਿੱਚ ਰੱਖਣ ਨਾਲ ਦਿਮਾਗ ਚੁਸਤ ਰਹਿੰਦਾ ਹੈ।`,
      medicine: `${name} ਜੀ, ਤੁਹਾਡੀ ਦਵਾਈ ਦਾ ਸਮਾਂ ਦੁਪਹਿਰ 12:30 ਵਜੇ ਹੈ। ਹੁਣ ਥੋੜ੍ਹਾ ਤਾਜ਼ਾ ਪਾਣੀ ਪੀ ਕੇ ਆਰਾਮ ਕਰੋ ਜੀ।`,
      time_date: `ਅੱਜ ਦਾ ਦਿਨ ਬਹੁਤ ਸ਼ਾਂਤ ਅਤੇ ਸੁਹਾਵਣਾ ਹੈ, ${name} ਜੀ। ਹੁਣ ਸਮਾਂ ${timeEn} ਹੋਇਆ ਹੈ।`,
      anxiety_lost: `ਤੁਸੀਂ ਆਪਣੇ ਪਿਆਰੇ ਘਰ ਵਿੱਚ ਪੂਰੀ ਤਰ੍ਹਾਂ ਸੁਰੱਖਿਅਤ ਹੋ, ${name} ਜੀ। ਮੈਂ ${companion} ਤੁਹਾਡੇ ਨਾਲ ਹਾਂ। ਘਬਰਾਓ ਨਾ।`,
      tea_culture: `ਇੱਕ ਕੱਪ ਤਾਜ਼ੀ ਗਰਮ ਚਾਹ ਮਨ ਨੂੰ ਬੜਾ ਸੁਕੂਨ ਦਿੰਦੀ ਹੈ। ਕੀ ਤੁਸੀਂ ਚਾਹ ਪੀਣਾ ਚਾਹੋਗੇ, ${name} ਜੀ?`,
      family: `ਤੁਹਾਡਾ ਪਰਿਵਾਰ ਤੁਹਾਨੂੰ ਬਹੁਤ ਪਿਆਰ ਕਰਦਾ ਹੈ, ${name} ਜੀ। ${caregiver} ਤੁਹਾਡਾ ਪੂਰਾ ਖਿਆਲ ਰੱਖ ਰਹੇ ਹਨ।`,
      morning: `ਸ਼ੁਭ ਸਵੇਰ ${name} ਜੀ! ਅੱਜ ਦਾ ਦਿਨ ਚੜ੍ਹਿਆ ਹੈ, ਮਨ ਖੁਸ਼ ਰੱਖੋ ਅਤੇ ਤਾਜ਼ੀ ਹਵਾ ਦਾ ਆਨੰਦ ਲਵੋ।`,
      night_sleep: `ਸ਼ੁਭ ਰਾਤਰੀ ${name} ਜੀ। ਹੁਣ ਬਿਨਾਂ ਕਿਸੇ ਚਿੰਤਾ ਦੇ ਆਰਾਮ ਨਾਲ ਸੌਂ ਜਾਓ। ਸਭ ਕੁਝ ਠੀਕ ਹੈ।`,
      food_nutrition: `ਚੰਗੀ ਖੁਰਾਕ ਅਤੇ ਸਮੇਂ ਸਿਰ ਪਾਣੀ ਪੀਣਾ ਸਿਹਤ ਲਈ ਬਹੁਤ ਜ਼ਰੂਰੀ ਹੈ, ${name} ਜੀ।`,
      doctor_pain: `ਜੇਕਰ ਕੋਈ ਤਕਲੀਫ ਹੈ ਤਾਂ ਮੈਂ ${caregiver} ਨੂੰ ਸੂਚਿਤ ਕਰਦੀ ਹਾਂ, ${name} ਜੀ। ਤੁਸੀਂ ਆਰਾਮ ਨਾਲ ਬੈਠੋ।`,
      who_is_mira: `ਮੈਂ ${companion} ਹਾਂ, ਤੁਹਾਡੀ ਯਾਦਾਸ਼ਤ ਅਤੇ ਦਿਮਾਗੀ ਖੇਡਾਂ ਦੀ ਪਿਆਰੀ ਸਾਥੀ। ਮੈਂ ਹਮੇਸ਼ਾ ਤੁਹਾਡੇ ਨਾਲ ਹਾਂ।`,
      greeting_general: `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ${name} ਜੀ! ਮੈਂ ${companion} ਹਾਂ। ਅੱਜ ਤੁਹਾਡੀ ਕਿਸ ਤਰ੍ਹਾਂ ਸਹਾਇਤਾ ਕਰ ਸਕਦੀ ਹਾਂ?`,
    },
    ta: {
      game_memory: `வணக்கம் ${name}! நினைவக விளையாட்டு (Memory Match) விளையாடுவோம். இது மனதை அமைதியாகவும் விழிப்புடனும் வைக்கும்.`,
      game_sequence: `${name}, அன்றாட வரிசை விளையாட்டு விளையாடுவோம். வழக்கமான செயல்களை வரிசைப்படுத்துவது நினைவாற்றலை வளர்க்கும்.`,
      medicine: `${name}, உங்கள் மதிய மருந்து நேரம் 12:30 மணி. இப்போது கொஞ்சம் தண்ணீர் குடித்துவிட்டு ஓய்வெடுங்கள்.`,
      time_date: `இன்றைய நாள் மிகவும் அமைதியானது, ${name}. இப்போது நேரம் ${timeEn}. மனதை நிம்மதியாக வையுங்கள்.`,
      anxiety_lost: `நீங்கள் உங்கள் சொந்த வீட்டில் முழுப் பாதுகாப்பாக இருக்கிறீர்கள், ${name}. நான் ${companion}, உங்களுடன் இருக்கிறேன். கவலை வேண்டாம்.`,
      tea_culture: `ஒரு கோப்பை தேநீர் மனதிற்கு நிம்மதியைத் தரும். நீங்கள் தேநீர் அருந்துகிறீர்களா, ${name}?`,
      family: `உங்கள் குடும்பம் உங்கள் மீது மிகுந்த அன்பு வைத்துள்ளது, ${name}. ${caregiver} உங்களை நன்கு கவனித்துக் கொள்கிறார்.`,
      morning: `காலை வணக்கம் ${name}! புதிய நாள் இனிதாக விடிந்துள்ளது. ஆழ்ந்த மூச்செடுத்து நாளை மகிழ்வோடு தொடங்குங்கள்.`,
      night_sleep: `இனிய இரவு வணக்கம் ${name}. இப்போது நிம்மதியாக உறங்குங்கள். நீங்கள் பாதுகாப்பாக இருக்கிறீர்கள்.`,
      food_nutrition: `நேரத்திற்குச் சத்தான உணவும் தண்ணீரும் எடுத்துக்கொள்வது உடலுக்கு நல்லது, ${name}.`,
      doctor_pain: `உடல்நலம் சரியில்லை என்றால் நான் ${caregiver}-க்கு தெரிவிக்கிறேன், ${name}. நீங்கள் அமைதியாக ஓய்வெடுங்கள்.`,
      who_is_mira: `நான் ${companion}, உங்கள் நினைவாற்றல் மற்றும் மனநலத் தோழி. உங்களுக்கு உதவவே நான் இங்கு இருக்கிறேன்.`,
      greeting_general: `வணக்கம் ${name}! நான் ${companion}. இன்று உங்களுக்கு எப்படி உதவ முடியும்?`,
    },
    te: {
      game_memory: `నమస్కారం ${name}! మెమరీ మ్యాచ్ ఆట ఆడదాం. అందమైన కార్డులను జత చేయడం మనసుకు ప్రశాంతతను, ఉత్సాహాన్ని ఇస్తుంది.`,
      game_sequence: `${name} గారూ, దినచర్య క్రమం ఆట ఆడదాం. పనులను సరైన క్రమంలో పెట్టడం జ్ఞాపకశక్తికి చాలా మంచిది.`,
      medicine: `${name} గారూ, మధ్యాహ్నం 12:30 గంటలకు మందుల సమయం. ఇప్పుడు కొద్దిగా నీరు తాగి విశ్రాంతి తీసుకోండి.`,
      time_date: `ఈ రోజు చాలా ప్రశాంతంగా ఉంది, ${name} గారూ. ఇప్పుడు సమయం ${timeEn}. ఎలాంటి ఆందోళన వద్దు.`,
      anxiety_lost: `మీరు మీ సొంత ఇంట్లోనే పూర్తి క్షేమంగా ఉన్నారు, ${name} గారూ. నేను ${companion}, మీ వెంటే ఉన్నాను.`,
      tea_culture: `వేడి వేడి టీ తాగడం మనసుకు ఎంతో హాయిగా ఉంటుంది. ఒక కప్పు టీ తాగుతారా, ${name} గారూ?`,
      family: `మీ కుటుంబ సభ్యులు మిమ్మల్ని ఎంతో ప్రేమిస్తారు. ${caregiver} మీ బాగోగులు చూసుకుంటున్నారు.`,
      morning: `శుభోదయం ${name} గారూ! ఈ ఉదయం ఎంతో ఆహ్లాదకరంగా ఉంది. ప్రశాంతంగా రోజును ఆస్వాదించండి.`,
      night_sleep: `శుభరాత్రి ${name} గారూ. ఇప్పుడు హాయిగా నిద్రపోండి. అంతా క్షేమంగా ఉంది.`,
      food_nutrition: `సమయానికి బలవర్థకమైన ఆహారం తీసుకోవడం, నీరు తాగడం ఆరోగ్యానికి చాలా మంచిది.`,
      doctor_pain: `మీకు ఒంట్లో బాగోలేకపోతే నేను ${caregiver}కి తెలియజేస్తాను, ${name} గారూ. మీరు విశ్రాంతి తీసుకోండి.`,
      who_is_mira: `నేను ${companion}, మీ జ్ఞాపకశక్తి మరియు ఆలోచనా స్నేహితురాలిని. మీకు తోడుగా ఉండటమే నా పని.`,
      greeting_general: `నమస్కారం ${name} గారూ! నేను ${companion}. ఈ రోజు మీకు ఎలా సహాయపడగలను?`,
    },
    mr: {
      game_memory: `नमस्कार ${name}! चला मेमरी मॅच खेळूया. सुंदर कार्डे जुळवल्याने मन ताजेतवाने आणि शांत राहील.`,
      game_sequence: `${name}, चला दिनचर्या क्रम खेळ खेळूया. रोजच्या गोष्टी योग्य क्रमाने लावल्याने स्मरणशक्ती चांगली राहते.`,
      medicine: `${name}, दुपारच्या औषधाची वेळ १२:३० वाजता आहे. आता थोडे ताजे पाणी पिऊन आराम करा.`,
      time_date: `आजचा दिवस अतिशय शांत आणि छान आहे, ${name}. सध्या वेळ ${timeEn} झाली आहे.`,
      anxiety_lost: `तुम्ही तुमच्या घरी पूर्णपणे सुरक्षित आहात, ${name}. मी ${companion}, तुमच्या सोबतच आहे. काळजी करू नका.`,
      tea_culture: `गरम चहाचा एक घोट मनाला छान शांतता देतो. एक कप चहा घेणार का, ${name}?`,
      family: `तुमचे कुटुंब तुमच्यावर खूप प्रेम करते, ${name}. ${caregiver} तुमची उत्तम काळजी घेत आहेत.`,
      morning: `शुभ प्रभात ${name}! आजची सकाळ खूप आल्हाददायक आहे. शांत मनाने दिवसाची सुरुवात करा.`,
      night_sleep: `शुभ रात्री ${name}. आता शांतपणे झोपा. सर्व काही सुरक्षित आणि ठीक आहे.`,
      food_nutrition: `वेळेवर पौष्टिक जेवण आणि पाणी पिणे आरोग्यासाठी खूप आवश्यक आहे.`,
      doctor_pain: `तुम्हाला त्रास होत असल्यास मी ${caregiver} यांना सांगते, ${name}. तुम्ही आराम करा.`,
      who_is_mira: `मी ${companion}, तुमची आपुलकीची स्मरणशक्ती सखी. तुमच्या सोबतीसाठी मी सदैव हजर आहे.`,
      greeting_general: `नमस्कार ${name}! मी ${companion}. आज तुम्हाला मदत करायला मला आनंद होईल.`,
    },
    gu: {
      game_memory: `નમસ્તે ${name}! ચાલો આપણે મેમરી મેચ રમીએ. સુંદર કાર્ડ્સ મેળવવાથી મન પ્રફુલ્લિત અને સક્રિય રહેશે.`,
      game_sequence: `${name}, ચાલો દૈનિક ક્રમની રમત રમીએ. દિનચર્યાને સાચા ક્રમમાં ગોઠવવાથી યાદશક્તિ તેજ બને છે.`,
      medicine: `${name}, બપોરે ૧૨:૩૦ વાગ્યે તમારી દવાનો સમય છે. અત્યારે થોડું પાણી પીને આરામ કરો.`,
      time_date: `આજનો દિવસ ખૂબ જ શાંત અને સુંદર છે, ${name}. અત્યારે સમય ${timeEn} થયો છે.`,
      anxiety_lost: `તમે તમારા પોતાના ઘરમાં એકદમ સુરક્ષિત છો, ${name}. હું ${companion}, તમારી સાથે જ છું. ગભરાશો નહીં.`,
      tea_culture: `ગરમાગરમ ચાની ચુસ્કી મનને ઘણી શાંતિ આપે છે. શું તમે એક કપ ચા લેશો, ${name}?`,
      family: `તમારો પરિવાર તમને ખૂબ સ્નેહ કરે છે, ${name}. ${caregiver} તમારું પૂરતું ધ્યાન રાખી રહ્યા છે.`,
      morning: `સુપ્રભાત ${name}! આજની સવાર ખૂબ સુંદર છે. ઊંડો શ્વાસ લો અને શાંતિ અનુભવો.`,
      night_sleep: `શુભ રાત્રિ ${name}. હવે નિરાંતે સૂઈ જાઓ. બધું જ હેમખેમ અને સુરક્ષિત છે.`,
      food_nutrition: `સમયસર પૌષ્ટિક આહાર લેવો અને પાણી પીવું સ્વાસ્થ્ય માટે સારું છે.`,
      doctor_pain: `જો તમને સારું ન લાગતું હોય તો હું ${caregiver}ને જાણ કરું છું, ${name}. તમે આરામ કરો.`,
      who_is_mira: `હું ${companion} છું, તમારી વહાલી યાદશક્તિ સાથી. તમારી સાથે રહેવું મને ગમે છે.`,
      greeting_general: `નમસ્તે ${name}! હું ${companion} છું. આજે હું તમારી શું સેવા કરી શકું?`,
    },
    kn: {
      game_memory: `ನಮಸ್ಕಾರ ${name}! ಮೆಮೊರಿ ಮ್ಯಾಚ್ ಆಟವಾಡೋಣ. ಸುಂದರವಾದ ಕಾರ್ಡ್‌ಗಳನ್ನು ಹೊಂದಿಸುವುದು ಮನಸ್ಸನ್ನು ಉಲ್ಲಾಸವಾಗಿರಿಸುತ್ತದೆ.`,
      game_sequence: `${name}, ದಿನಚರಿ ಕ್ರಮ ಆಟವಾಡೋಣ. ಕೆಲಸಗಳನ್ನು ಸರಿಯಾದ ಕ್ರಮದಲ್ಲಿ ಜೋಡಿಸುವುದು ನೆನಪಿನ ಶಕ್ತಿಗೆ ಒಳ್ಳೆಯದು.`,
      medicine: `${name}, ಮಧ್ಯಾಹ್ನ 12:30 ಕ್ಕೆ ನಿಮ್ಮ ಔಷಧಿಯ ಸಮಯ. ಈಗ ಸ್ವಲ್ಪ ನೀರು ಕುಡಿದು ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ.`,
      time_date: `ಇಂದಿನ ದಿನವು ತುಂಬಾ ಶಾಂತವಾಗಿದೆ, ${name}. ಈಗ ಸಮಯ ${timeEn}. ಆರಾಮವಾಗಿರಿ.`,
      anxiety_lost: `ನೀವು ನಿಮ್ಮ ಮನೆಯಲ್ಲಿ ಸಂಪೂರ್ಣ ಸುರಕ್ಷಿತವಾಗಿದ್ದೀರಿ, ${name}. ನಾನು ${companion}, ನಿಮ್ಮ ಜತೆಯಲ್ಲೇ ಇದ್ದೇನೆ. ಭಯಪಡಬೇಡಿ.`,
      tea_culture: `ಬಿಸಿ ಚಹಾ ಕುಡಿಯುವುದು ಮನಸ್ಸಿಗೆ ಮುದ ನೀಡುತ್ತದೆ. ಒಂದು ಕಪ್ ಚಹಾ ಕುಡಿಯುವಿರಾ, ${name}?`,
      family: `ನಿಮ್ಮ ಕುಟುಂಬವು ನಿಮ್ಮನ್ನು ಪ್ರೀತಿಯಿಂದ ನೋಡಿಕೊಳ್ಳುತ್ತದೆ, ${name}. ${caregiver} ನಿಮ್ಮ ಜತೆಯಲ್ಲಿದ್ದಾರೆ.`,
      morning: `ಶುಭೋದಯ ${name}! ಈ ಬೆಳಗಿನ ವಾತಾವರಣ ಸುಂದರವಾಗಿದೆ. ದಿನವನ್ನು ಸಂತೋಷದಿಂದ ಪ್ರಾರಂಭಿಸಿ.`,
      night_sleep: `ಶುಭರಾತ್ರಿ ${name}. ಈಗ ನೆಮ್ಮದಿಯಾಗಿ ನಿದ್ರಿಸಿ. ಎಲ್ಲವೂ ಸುಕ್ಷೇಮವಾಗಿದೆ.`,
      food_nutrition: `ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಊಟ ಮಾಡುವುದು ಮತ್ತು ನೀರು ಕುಡಿಯುವುದು ಆರೋಗ್ಯಕ್ಕೆ ಉತ್ತಮ.`,
      doctor_pain: `ನಿಮಗೆ ಆರಾಮವಿಲ್ಲದಿದ್ದರೆ ನಾನು ${caregiver} ಅವರಿಗೆ ತಿಳಿಸುತ್ತೇನೆ, ${name}. ನೀವು ವಿಶ್ರಮಿಸಿ.`,
      who_is_mira: `ನಾನು ${companion}, ನಿಮ್ಮ ನೆನಪಿನ ಮತ್ತು ಆಲೋಚನೆಯ ಆಪ್ತ ಮಿತ್ರ. ನಿಮಗೆ ಸಹಾಯ ಮಾಡುವುದೇ ನನ್ನ ಕೆಲಸ.`,
      greeting_general: `ನಮಸ್ಕಾರ ${name}! ನಾನು ${companion}. ಇಂದು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`,
    },
    ml: {
      game_memory: `നമസ്കാരം ${name}! നമുക്ക് മെമ്മറി മാച്ച് കളിക്കാം. കാർഡുകൾ യോജിപ്പിക്കുന്നത് മനസ്സിന് ശാന്തിയും ഉന്മേഷവും നൽകും.`,
      game_sequence: `${name}, നമുക്ക് ദിനചര്യ ക്രമം ഗെയിം കളിക്കാം. കാര്യങ്ങൾ ശരിയായ ക്രമത്തിൽ വെക്കുന്നത് ഓർമ്മശക്തിക്ക് നല്ലതാണ്.`,
      medicine: `${name}, ഉച്ചയ്ക്ക് 12:30-നാണ് മരുന്ന് സമയം. ഇപ്പോൾ അല്പം വെള്ളം കുടിച്ച് വിശ്രമിക്കൂ.`,
      time_date: `ഇന്നത്തെ ദിവസം ശാന്തവും സുന്ദരവുമാണ്, ${name}. ഇപ്പോൾ സമയം ${timeEn}. സമാധാനമായിരിക്കൂ.`,
      anxiety_lost: `നിങ്ങൾ സ്വന്തം വീട്ടിൽ സുരക്ഷിതനാണ്, ${name}. ഞാൻ ${companion}, നിങ്ങളുടെ അരികിലുണ്ട്. ഭയം വേണ്ട.`,
      tea_culture: `ഒരു കപ്പ് ചൂടുചായ മനസ്സിന് വലിയ ആശ്വാസം നൽകും. ചായ കുടിക്കാൻ ആഗ്രഹമുണ്ടോ, ${name}?`,
      family: `കുടുംബം നിങ്ങളെ വളരെയധികം സ്നേഹിക്കുന്നു, ${name}. ${caregiver} നിങ്ങളുടെ കാര്യങ്ങൾ ശ്രദ്ധിക്കുന്നുണ്ട്.`,
      morning: `സുപ്രഭാതം ${name}! പുതിയൊരു നല്ല ദിനം ആരംഭിച്ചിരിക്കുന്നു. പ്രശാന്തമായിരിക്കൂ.`,
      night_sleep: `ശുഭരാത്രി ${name}. ഇപ്പോൾ സമാധാനമായി ഉറങ്ങൂ. എല്ലാം സുരക്ഷിതമാണ്.`,
      food_nutrition: `കൃത്യസമയത്ത് ആഹാരം കഴിക്കുന്നതും വെള്ളം കുടിക്കുന്നതും ആരോഗ്യത്തിന് അത്യന്താപേക്ഷിതമാണ്.`,
      doctor_pain: `ശാരീരിക അസ്വസ്ഥതയുണ്ടെങ്കിൽ ഞാൻ ${caregiver}-നെ അറിയിക്കാം, ${name}. നിങ്ങൾ വിശ്രമിക്കൂ.`,
      who_is_mira: `ഞാൻ ${companion}, നിങ്ങളുടെ സ്നേഹനിധിയായ ഓർമ്മത്തോഴിയാണ്. സഹായിക്കാൻ ഞാൻ സദാ സന്നദ്ധയാണ്.`,
      greeting_general: `നമസ്കാരം ${name}! ഞാൻ ${companion}. ഇന്ന് എങ്ങനെയാണ് സഹായിക്കേണ്ടത്?`,
    },
    or: {
      game_memory: `ନମସ୍କାର ${name}! ଆସନ୍ତୁ ମେମୋରୀ ମ୍ୟାଚ୍ ଖେଳିବା। ସୁନ୍ଦର କାର୍ଡ ମିଳାଇବା ଦ୍ୱାରା ମନ ଶାନ୍ତ ଓ ସତେଜ ରହିବ।`,
      game_sequence: `${name}, ଆସନ୍ତୁ ଦୈନନ୍ଦିନ କ୍ରମ ଖେଳ ଖେଳିବା। କାର୍ଯ୍ୟଗୁଡ଼ିକୁ କ୍ରମରେ ରଖିବା ସ୍ମୃତିଶକ୍ତି ବୃଦ୍ଧି କରେ।`,
      medicine: `${name}, ଅପରାହ୍ନ ୧୨:୩୦ରେ ଆପଣଙ୍କ ଔଷଧ ସମୟ। ଏବେ ଟିକେ ପାଣି ପିଇ ବିଶ୍ରାମ ନିଅନ୍ତୁ।`,
      time_date: `ଆଜିର ଦିନଟି ବହୁତ ଶାନ୍ତ ଓ ସୁନ୍ଦର, ${name}। ବର୍ତ୍ତମାନ ସମୟ ${timeEn}।`,
      anxiety_lost: `ଆପଣ ନିଜ ଘରେ ସମ୍ପୂର୍ଣ୍ଣ ସୁରକ୍ଷିତ ଅଛନ୍ତି, ${name}। ମୁଁ ${companion}, ଆପଣଙ୍କ ସାଥିରେ ଅଛି। ଭୟ କରନ୍ତୁ ନାହିଁ।`,
      tea_culture: `ଏକ କପ୍ ଗରମ ଚାହା ମନକୁ ବହୁତ ଶାନ୍ତି ଦିଏ। ଆପଣ ଚାହା ପିଇବେ କି, ${name}?`,
      family: `ଆପଣଙ୍କ ପରିବାର ଆପଣଙ୍କୁ ବହୁତ ଭଲପାଆନ୍ତି, ${name}। ${caregiver} ଆପଣଙ୍କ ଯତ୍ନ ନେଉଛନ୍ତି।`,
      morning: `ଶୁଭ ସକାଳ ${name}! ଏକ ନୂତନ ସୁନ୍ଦର ଦିନ ଆରମ୍ଭ ହୋଇଛି। ପ୍ରଶାନ୍ତ ରୁହନ୍ତୁ।`,
      night_sleep: `ଶୁଭ ରାତ୍ରି ${name}। ଏବେ ଶାନ୍ତିରେ ଶୋଇପଡ଼ନ୍ତୁ। ସବୁ କିଛି ନିରାପଦ ଅଛି।`,
      food_nutrition: `ସମୟରେ ପୁଷ୍ଟିକର ଖାଦ୍ୟ ଖାଇବା ଓ ପାଣି ପିଇବା ସ୍ୱାସ୍ଥ୍ୟ ପାଇଁ ଅତ୍ୟନ୍ତ ଉପକାରୀ।`,
      doctor_pain: `ଯଦି ଦେହ ଖରାପ ଲାଗୁଛି, ମୁଁ ${caregiver}ଙ୍କୁ ଖବର ଦେଉଛି, ${name}। ଆପଣ ବିଶ୍ରାମ କରନ୍ତୁ।`,
      who_is_mira: `ମୁଁ ${companion}, ଆପଣଙ୍କ ସ୍ମୃତି ଓ ମାନସିକ ସାଥି। ଆପଣଙ୍କୁ ସାହାଯ୍ୟ କରିବା ମୋର ଲକ୍ଷ୍ୟ।`,
      greeting_general: `ନମସ୍କାର ${name}! ମୁଁ ${companion}। ଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?`,
    },
    ur: {
      game_memory: `سلام ${name}! آئیے میموری میچ کھیلتے ہیں۔ خوبصورت کارڈز ملانے سے ذہن پرسکون اور تازہ دم رہتا ہے۔`,
      game_sequence: `${name} صاحب، روزمرہ ترتیب کا کھیل کھیلتے ہیں۔ معمولات کو ترتیب دینا یادداشت کے لیے بہت مفید ہے۔`,
      medicine: `${name} صاحب، دوپہر 12:30 بجے آپ کی دوا کا وقت ہے۔ ابھی آپ تھوڑا پانی پی کر آرام کریں۔`,
      time_date: `آج کا دن بہت پرامن ہے، ${name} صاحب۔ اس وقت وقت ${timeEn} ہے۔ بالکل مطمئن رہیں۔`,
      anxiety_lost: `آپ اپنے گھر میں مکمل محفوظ ہیں، ${name} صاحب۔ میں ${companion} ہوں اور آپ کے پاس ہوں۔ گھبرائیے نہیں۔`,
      tea_culture: `چائے کی خوشبو ذہن کو فرحت بخشتی ہے۔ کیا آپ ایک کپ گرم چائے پینا چاہیں گے، ${name} صاحب؟`,
      family: `آپ کے گھر والے آپ سے بے حد محبت کرتے ہیں، ${name} صاحب। ${caregiver} آپ کا پورا خیال رکھ رہی ہیں۔`,
      morning: `صبح بخیر ${name} صاحب! ایک خوبصورت نئی صبح کا آغاز ہوا ہے۔ گہرا سانس لیں اور دن کا لطف اٹھائیں۔`,
      night_sleep: `شب بخیر ${name} صاحب۔ اب اطمینان سے سو جائیے۔ گھر میں سب محفوظ اور پرسکون ہے۔`,
      food_nutrition: `وقت پر کھانا اور پانی پینا صحت کے لیے بہت ضروری ہے۔ آرام سے کھانا کھائیے۔`,
      doctor_pain: `اگر کوئی تکلیف ہے تو میں فوراً ${caregiver} کو بتاتی ہوں، ${name} صاحب۔ آپ آرام سے بیٹھیں۔`,
      who_is_mira: `میں ${companion} ہوں، آپ کی مخلص ڈیجیٹل ساتھی۔ یادداشت اور کھیلوں میں آپ کی مدد کرنا میرا فرض ہے۔`,
      greeting_general: `سلام ${name} صاحب! میں ${companion} ہوں۔ آج میں آپ کی کیا مدد کر سکتی ہوں؟`,
    },
    es: {
      game_memory: `¡Hola ${name}! Juguemos a emparejar cartas de memoria. Es un ejercicio relajante y excelente para la mente.`,
      game_sequence: `${name}, ordenemos la secuencia diaria. Recordar los pasos cotidianos mantiene la mente ágil y serena.`,
      medicine: `${name}, tu medicina está programada para las 12:30 PM. Por ahora, bebe un poco de agua fresca y descansa.`,
      time_date: `Hoy es un día tranquilo y agradable, ${name}. La hora actual es ${timeEn}. Todo está en calma.`,
      anxiety_lost: `Estás a salvo en tu hogar, ${name}. Soy ${companion}, estoy a tu lado. Respira hondo y con calma.`,
      tea_culture: `Una infusión caliente brinda paz y serenidad. ¿Te apetece una taza de té, ${name}?`,
      family: `Tu familia te ama profundamente, ${name}. ${caregiver} cuida de ti con cariño. Puedes ver tus fotos en Recuerdos.`,
      morning: `¡Buenos días, ${name}! Comienza una jornada hermosa. Disfruta de la tranquilidad de esta mañana.`,
      night_sleep: `Buenas noches, ${name}. Es momento de descansar tranquilamente. Duerme sabiendo que estás seguro.`,
      food_nutrition: `Comer alimentos sanos e hidratarse bien cuida tu energía y bienestar, ${name}.`,
      doctor_pain: `Si sientes algún malestar, ${name}, descansa mientras aviso a ${caregiver} para ayudarte.`,
      who_is_mira: `Soy ${companion}, tu cariñosa compañera cognitiva. Estoy aquí para acompañarte y recordarte cosas importantes.`,
      greeting_general: `¡Hola ${name}! Soy ${companion}. ¿En qué puedo ayudarte o qué juego te gustaría disfrutar hoy?`,
    },
    fr: {
      game_memory: `Bonjour ${name} ! Jouons au jeu de mémoire. Associer de jolies cartes stimule l'esprit avec douceur.`,
      game_sequence: `${name}, mettons les activités du quotidien dans l'ordre. C'est un exercice apaisant pour la mémoire.`,
      medicine: `${name}, l'heure de vos médicaments est à 12h30. Pour l'instant, buvez un peu d'eau et reposez-vous.`,
      time_date: `Aujourd'hui est une journée calme et paisible, ${name}. Il est actuellement ${timeEn}. Tout va bien.`,
      anxiety_lost: `Vous êtes en sécurité chez vous, ${name}. Je suis ${companion}, à vos côtés. Respirez lentement et profondément.`,
      tea_culture: `Une boisson chaude apporte réconfort et douceur. Aimeriez-vous une tasse de thé, ${name} ?`,
      family: `Votre famille vous aime tendrement, ${name}. ${caregiver} prend grand soin de vous.`,
      morning: `Bonjour ${name} ! Une nouvelle belle journée commence. Prenez le temps de profiter de ce moment.`,
      night_sleep: `Bonne nuit, ${name}. Il est temps de vous reposer sereinement. Dormez en toute quiétude.`,
      food_nutrition: `Prendre un repas équilibré et boire de l'eau fait le plus grand bien au corps, ${name}.`,
      doctor_pain: `Si vous ne vous sentez pas bien, ${name}, reposez-vous pendant que je préviens ${caregiver}.`,
      who_is_mira: `Je suis ${companion}, votre amie bienveillante d'assistance cognitive. Je suis là pour vous accompagner.`,
      greeting_general: `Bonjour ${name}, je suis ${companion}. Comment puis-je égayer votre journée ?`,
    },
    de: {
      game_memory: `Hallo ${name}! Lass uns Memory spielen. Das Finden von Paaren entspannt den Geist und tut gut.`,
      game_sequence: `${name}, lass uns die täglichen Schritte ordnen. Ein sanftes Gedächtnistraining für den Tag.`,
      medicine: `${name}, die Mittagsmedikamente sind um 12:30 Uhr vorgesehen. Trinke jetzt ein Glas Wasser und ruh dich aus.`,
      time_date: `Heute ist ein ruhiger und friedlicher Tag, ${name}. Es ist jetzt ${timeEn} Uhr. Alles ist in bester Ordnung.`,
      anxiety_lost: `Du bist sicher zu Hause in deiner vertrauten Umgebung, ${name}. Ich bin ${companion}, fest an deiner Seite.`,
      tea_culture: `Eine frische Tasse warmer Tee schenkt Ruhe und Geborgenheit. Möchtest du einen Tee trinken, ${name}?`,
      family: `Deine Familie hat dich sehr lieb, ${name}. ${caregiver} kümmert sich fürsorglich um dich.`,
      morning: `Guten Morgen, ${name}! Ein neuer schöner Tag beginnt. Nimm dir alle Zeit der Welt.`,
      night_sleep: `Gute Nacht, ${name}. Jetzt darfst du ruhig und geborgen schlafen. Alles ist sicher.`,
      food_nutrition: `Gesunde Mahlzeiten und ausreichend Wasser geben dem Körper neue Kraft, ${name}.`,
      doctor_pain: `Wenn du dich unwohl fühlst, ${name}, ruhe dich aus. Ich gebe ${caregiver} sofort Bescheid.`,
      who_is_mira: `Ich bin ${companion}, deine freundliche Gedächtnisbegleiterin. Ich helfe dir gerne beim Erinnern.`,
      greeting_general: `Hallo ${name}, ich bin ${companion}. Wie darf ich dir heute den Tag verschönern?`,
    },
    pt: {
      game_memory: `Olá ${name}! Vamos jogar o jogo da memória. Combinar cartas é uma atividade calma e agradável.`,
      game_sequence: `${name}, vamos ordenar a rotina diária. Organizar os passos estimula suavemente a memória.`,
      medicine: `${name}, o horário do seu remédio é às 12:30. Beba um pouco de água fresca e descanse agora.`,
      time_date: `Hoje é um dia sereno e agradável, ${name}. São agora ${timeEn}. Tudo está tranquilo.`,
      anxiety_lost: `Você está seguro em sua própria casa, ${name}. Eu sou ${companion}, estou ao seu lado. Respire com calma.`,
      tea_culture: `Uma chávena de chá quente traz conforto e aconchego. Aceita um chá, ${name}?`,
      family: `A sua família ama-o com carinho, ${name}. ${caregiver} está cuidando muito bem de você.`,
      morning: `Bom dia, ${name}! Um novo dia começa. Desfrute da paz e tranquilidade desta manhã.`,
      night_sleep: `Boa noite, ${name}. É hora de descansar com tranquilidade. Durma com toda a segurança.`,
      food_nutrition: `Alimentar-se com calma e beber água faz muito bem à sua saúde, ${name}.`,
      doctor_pain: `Se você não estiver se sentindo bem, ${name}, descanse enquanto aviso ${caregiver}.`,
      who_is_mira: `Eu sou ${companion}, sua companheira de memória e carinho. Estou aqui para ajudar você.`,
      greeting_general: `Olá ${name}, sou ${companion}. Como posso ajudar ou acompanhar você hoje?`,
    },
    ar: {
      game_memory: `مرحباً ${name}! دعنا نلعب لعبة مطابقة الذاكرة. مطابقة البطاقات تمنح الذهن نشاطاً وهدوءاً جميلاً.`,
      game_sequence: `${name}، دعنا نرتب خطوات اليوم المعتادة. هذا التمرين البسيط يقوي الذاكرة بلطف.`,
      medicine: `${name}، موعد دوائك هو الساعة 12:30 ظهراً. تفضل بشرب القليل من الماء واسترح باطمئنان.`,
      time_date: `اليوم هادئ ومبارك، ${name}. الوقت الآن ${timeEn}. كل الأمور تسير على ما يرام.`,
      anxiety_lost: `أنت في أمان تام في منزلك المريح، ${name}. أنا ${companion}، معك هنا دائماً. لا تقلق.`,
      tea_culture: `كوب من الشاي الدافئ يبعث على الراحة والسكينة. هل ترغب في كوب شاي، ${name}؟`,
      family: `عائلتك تحبك كثيراً، ${name}. ${caregiver} تعتني بك باهتمام. يمكنك مشاهدة صور العائلة في الذكريات.`,
      morning: `صباح الخير، ${name}! أشرق يوم جميل جديد. تنفس بعمق واستمتع بهذا الصباح الهادئ.`,
      night_sleep: `تصبح على خير، ${name}. حان وقت النوم الهانئ. نم بسلام فأنت في أمان تام.`,
      food_nutrition: `تناول الطعام الصحي وشرب الماء بانتظام يحافظ على صحتك ونشاطك، ${name}.`,
      doctor_pain: `إذا كنت تشعر بأي ألم، ${name}، استرح وسأقوم بإبلاغ ${caregiver} لمساعدتك فوراً.`,
      who_is_mira: `أنا ${companion}، رفيقتك المخلصة للذاكرة والدعم الذهني. أنا هنا لمؤانستك ومساعدتك دوماً.`,
      greeting_general: `مرحباً ${name}، أنا ${companion}. كيف يمكنني أن أساعدك اليوم أو نلعب لعبة معاً؟`,
    },
    zh: {
      game_memory: `您好 ${name}！让我们来玩记忆配对游戏吧。翻开美丽的卡片，能让思维活跃又心情平静。`,
      game_sequence: `${name}，一起来玩日常生活排序游戏吧。按顺序排列生活习惯，对记忆力非常有益。`,
      medicine: `${name}，您中午服药的时间是 12:30。现在请喝杯温水，安心休息一下。`,
      time_date: `今天是宁静祥和的一天，${name}。现在时间是 ${timeEn}。一切都很平稳安好。`,
      anxiety_lost: `您在自己温馨的家中非常安全，${name}。我是 ${companion}，就在您身边陪伴您。别担心。`,
      tea_culture: `一杯暖茶的清香让人心情舒畅。${name}，要不要来一杯清香的热茶呢？`,
      family: `您的家人深深地关爱着您，${name}。${caregiver} 一直在悉心照料您。您可以在相册里看看家庭照片。`,
      morning: `早上好，${name}！美好的新一天开始了。放慢脚步，享受早晨的宁静吧。`,
      night_sleep: `晚安，${name}。现在是安睡的时候了。请安心休息，一切都很安全。`,
      food_nutrition: `按时吃营养的餐食并多喝温水，对身体健康非常有益，${name}。`,
      doctor_pain: `如果您感觉不舒服，${name}，请静心休息，我马上通知 ${caregiver} 来帮助您。`,
      who_is_mira: `我是 ${companion}，您身边的智能认知与记忆伙伴。我专为您提供温馨的陪伴与提示。`,
      greeting_general: `您好 ${name}！我是 ${companion}。今天有什么想让我帮您，或者一起玩个小游戏吗？`,
    },
    ja: {
      game_memory: `こんにちは ${name}さん！記憶合わせ（Memory Match）ゲームをしましょう。カードを揃えると心が落ち着き頭も冴えます。`,
      game_sequence: `${name}さん、一日の順番並べゲームをしましょう。毎日の日課を順番に並べると良い頭の体操になります。`,
      medicine: `${name}さん、お薬の時間は12:30です。今は温かいお水を飲んで、ゆっくりお休みくださいね。`,
      time_date: `今日はとても穏やかな一日です、${name}さん。現在の時刻は ${timeEn} です。ご安心ください。`,
      anxiety_lost: `ご自宅の安心できるお部屋にいらっしゃいますよ、${name}さん。私は ${companion}、おそばにおります。大丈夫です。`,
      tea_culture: `温かいお茶の香りは心をほっと和ませてくれますね。${name}さん、一杯お茶はいかがですか？`,
      family: `ご家族の皆様は ${name}さんのことが大好きですよ。${caregiver}さんが大切にお世話をしてくださっています。`,
      morning: `おはようございます、${name}さん！心地よい新しい朝の始まりです。深呼吸してリラックスしましょう。`,
      night_sleep: `おやすみなさい、${name}さん。ゆっくりと体を休めてくださいね。見守っていますので安心してお眠りください。`,
      food_nutrition: `栄養のある食事をいただき、水分をとることは体にとても大切です、${name}さん。`,
      doctor_pain: `もしお体に痛みやご不安があれば、${name}さん、休んでいてくださいね。すぐに${caregiver}さんにお知らせします。`,
      who_is_mira: `私は ${companion}、あなたのためのやさしい記憶と会話のお友だちです。いつでもそばにいますよ。`,
      greeting_general: `こんにちは ${name}さん！私は ${companion} です。今日はどんなお手伝いをいたしましょうか？`,
    },
  };

  const langResponses = RESPONSES[lang] || RESPONSES.en;
  const responseText = langResponses[intent] || langResponses.greeting_general;
  const suggestedAction = INTENT_ACTIONS[intent] || null;

  return {
    responseText,
    source: 'offline_engine',
    suggestedAction,
  };
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

    const lang = (options.languageCode || 'en').toLowerCase();
    const targetLang = BCP47_LOCALE_MAP[lang] || 'en-IN';
    utterance.lang = targetLang;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const femaleKeywords = [
        'female', 'woman', 'zira', 'samantha', 'victoria', 'karen', 'veena',
        'priya', 'heera', 'swara', 'kalpana', 'aditi', 'lekha', 'anjali', 'geeta',
        'vaani', 'amira', 'salma', 'fatima', 'meiling', 'kyoko', 'haruka',
        'lucia', 'maria', 'monica', 'hortense', 'marie', 'julie', 'hedda', 'marlene'
      ];
      const maleKeywords = [
        'male', 'man', 'david', 'george', 'mark', 'ravi', 'neel', 'madhav',
        'guy', 'alex', 'daniel', 'tarik', 'hassan', 'omar', 'zhiyu', 'ichiro',
        'kenji', 'jorge', 'alvaro', 'nicolas', 'paul', 'pierre', 'stefan', 'hans'
      ];
      const keywords = gender === 'female' ? femaleKeywords : maleKeywords;
      const langPrefix = targetLang.split('-')[0].toLowerCase();

      // 1. Language prefix match + gender keyword
      let bestVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith(langPrefix) &&
          keywords.some((kw) => v.name.toLowerCase().includes(kw))
      );

      // 2. Any voice matching language prefix
      if (!bestVoice) {
        bestVoice = voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
      }

      // 3. Indian language fallbacks: if OS lacks native Assamese/Odia voice pack, try Bengali or Hindi
      if (!bestVoice && (lang === 'as' || lang === 'or')) {
        bestVoice = voices.find((v) => v.lang.toLowerCase().startsWith('bn') || v.lang.toLowerCase().startsWith('hi'));
      }

      // 4. Fallback to English (with gender preference)
      if (!bestVoice) {
        bestVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith('en') &&
            keywords.some((kw) => v.name.toLowerCase().includes(kw))
        ) || voices.find((v) => v.lang.toLowerCase().startsWith('en'));
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
