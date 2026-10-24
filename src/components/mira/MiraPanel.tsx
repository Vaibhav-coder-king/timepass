import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Send, Volume2, Gamepad2, Sparkles, User, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MiraSessionState } from '../../types/types';
import { MiraAvatarOrb } from './MiraAvatarOrb';
import { MiraTranscriptBubble } from './MiraTranscriptBubble';
import { MiraErrorToast } from './MiraErrorToast';
import { useMira } from '../../context/MiraContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { speakMira, getGeminiApiKey } from '../../services/geminiService';

interface MiraPanelProps {
  isOpen: boolean;
  session: MiraSessionState;
  onClose: () => void;
}

const LOCALIZED_DATA: Record<string, {
  companionName: string;
  welcome: string;
  statusLabels: Record<string, string>;
  prompts: Array<{ label: string; text: string }>;
}> = {
  en: {
    companionName: 'MIRA AI',
    welcome: "Namaste! I am your memory and cognitive companion. You can ask me about your day, your medicines, or we can play a relaxing memory game.",
    statusLabels: {
      idle: "Tap microphone or pick a topic below",
      listening: "Listening… speak whenever you're ready",
      processing: "MIRA is thinking with Gemini AI…",
      speaking: "MIRA is speaking…",
      error: "Let's try that again",
    },
    prompts: [
      { label: '🎮 Play Memory Match', text: 'Let’s play Memory Match with calm cards!' },
      { label: '🧩 Daily Routine Game', text: 'Help me with my daily routine sequence game.' },
      { label: '⏰ My Medicine Time', text: 'When is my medicine reminder today?' },
      { label: '☕ Reminisce Peacefully', text: 'Tell me a peaceful memory about tea gardens.' },
      { label: '💛 I feel confused', text: 'I am feeling a little confused right now.' },
    ],
  },
  hi: {
    companionName: 'मीरा (MIRA)',
    welcome: "नमस्ते! मैं आपकी दिमागी और याददाश्त साथी मीरा हूँ। आप मुझसे अपनी दिनचर्या, दवाइयों के समय या मेमोरी मैच खेल के बारे में पूछ सकते हैं।",
    statusLabels: {
      idle: "माइक पर टैप करें या नीचे से विषय चुनें",
      listening: "सुन रही हूँ… बोलिए",
      processing: "मीरा सोच रही है…",
      speaking: "मीरा बोल रही है…",
      error: "फिर से प्रयास करें",
    },
    prompts: [
      { label: '🎮 मेमोरी मैच खेलें', text: 'चलिए सुंदर कार्ड वाला मेमोरी मैच खेलते हैं!' },
      { label: '🧩 दिनचर्या क्रम खेल', text: 'सुबह की दिनचर्या सही क्रम में जमाने वाले खेल में मदद कीजिए।' },
      { label: '⏰ दवा का समय', text: 'आज मेरी दवा का समय कब है?' },
      { label: '☕ सुकून भरी बातें', text: 'मुझे चाय बागानों की कोई प्यारी और शांत बात बताइए।' },
      { label: '💛 मुझे घबराहट हो रही है', text: 'मुझे थोड़ा भ्रम और डर लग रहा है।' },
    ],
  },
  as: {
    companionName: 'মীৰা (MIRA)',
    welcome: "নমস্কাৰ! মই আপোনাৰ স্মৃতি আৰু মগজুৰ সংগী মীৰা। আপুনি আজিৰ দিনটো, ঔষধৰ সময় বা আমাৰ মনোৰম মেম’ৰী খেলৰ বিষয়ে সুধিব পাৰে।",
    statusLabels: {
      idle: "মাইক্ৰ'ফনত স্পৰ্শ কৰক বা তলত এটা বাছি লওক",
      listening: "শুনি আছোঁ… কওক",
      processing: "মীৰাই চিন্তা কৰি আছে…",
      speaking: "মীৰাই উত্তৰ দি আছে…",
      error: "আকৌ চেষ্টা কৰক",
    },
    prompts: [
      { label: '🎮 মেম’ৰী খেল খেলোঁ', text: 'আহক কাজিৰঙাৰ গঁড় আৰু চাহৰ কাৰ্ড লৈ মেম’ৰী মেচ খেলোঁ!' },
      { label: '🧩 দৈনিক ৰুটিন খেল', text: 'মোক দৈনিক নিয়ম সজোৱা খেলত সহায় কৰক।' },
      { label: '⏰ ঔষধৰ সময়', text: 'আজি মোৰ ঔষধ খোৱাৰ সময় কেতিয়া?' },
      { label: '☕ অসমৰ চাহ বাগিচা', text: 'অসমৰ চাহ বাগিচাৰ বিষয়ে কিবা এটা শান্ত কথা কওক।' },
      { label: '💛 মোৰ ভয় লাগিছে', text: 'মই অলপ বিভ্ৰান্ত আৰু ভয় খাইছোঁ।' },
    ],
  },
  bn: {
    companionName: 'মীরা (MIRA)',
    welcome: "নমস্কার! আমি আপনার স্মৃতি ও মনের যত্নশীল বন্ধু মীরা। আপনি আপনার দিন, ওষুধ বা মেমোরি ম্যাচ খেলা নিয়ে কথা বলতে পারেন।",
    statusLabels: {
      idle: "মাইক্রোফোনে চাপুন অথবা নিচের বিষয় বেছে নিন",
      listening: "শুনছি… বলুন",
      processing: "মীরা ভাবছে…",
      speaking: "মীরা বলছে…",
      error: "আবার চেষ্টা করুন",
    },
    prompts: [
      { label: '🎮 মেমোরি খেলা খেলি', text: 'আসুন চায়ের সুন্দর কার্ড দিয়ে মেমোরি ম্যাচ খেলি!' },
      { label: '🧩 দৈনন্দিন কাজের পর্যায়', text: 'আমার সকালের রুটিন সাজানোর খেলায় সাহায্য করুন।' },
      { label: '⏰ ওষুধের সময়', text: 'আজ আমার ওষুধ খাওয়ার সময় কখন?' },
      { label: '☕ শান্ত সুন্দর স্মৃতি', text: 'চা বাগানের স্নিগ্ধ হাওয়ার কোনো শান্ত গল্প বলুন।' },
      { label: '💛 মনটা ভয় ভয় করছে', text: 'আমার একটু বিভ্রান্ত লাগছে।' },
    ],
  },
  pa: {
    companionName: 'ਮੀਰਾ (MIRA)',
    welcome: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡੀ ਯਾਦਾਸ਼ਤ ਅਤੇ ਦਿਮਾਗੀ ਸਾਥੀ ਮੀਰਾ ਹਾਂ। ਤੁਸੀਂ ਮੇਰੇ ਨਾਲ ਦਿਨਚਰਿਆ, ਦਵਾਈਆਂ ਜਾਂ ਖੇਡਾਂ ਬਾਰੇ ਗੱਲ ਕਰ ਸਕਦੇ ਹੋ।",
    statusLabels: {
      idle: "ਮਾਈਕ 'ਤੇ ਟੈਪ ਕਰੋ ਜਾਂ ਹੇਠਾਂ ਵਿਸ਼ਾ ਚੁਣੋ",
      listening: "ਸੁਣ ਰਹੀ ਹਾਂ… ਬੋਲੋ ਜੀ",
      processing: "ਮੀਰਾ ਸੋਚ ਰਹੀ ਹੈ…",
      speaking: "ਮੀਰਾ ਬੋਲ ਰਹੀ ਹੈ…",
      error: "ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ",
    },
    prompts: [
      { label: '🎮 ਮੈਮੋਰੀ ਮੈਚ ਖੇਡੋ', text: 'ਆਓ ਕਾਰਡ ਮਿਲਾਉਣ ਵਾਲੀ ਮੈਮੋਰੀ ਮੈਚ ਖੇਡ ਖੇਡੀਏ!' },
      { label: '🧩 ਰੋਜ਼ਾਨਾ ਤਰਤੀਬ ਖੇਡ', text: 'ਸਵੇਰ ਦੇ ਕੰਮਾਂ ਨੂੰ ਸਹੀ ਕ੍ਰਮ ਵਿੱਚ ਲਗਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰੋ।' },
      { label: '⏰ ਦਵਾਈ ਦਾ ਸਮਾਂ', text: 'ਅੱਜ ਮੇਰੀ ਦਵਾਈ ਦਾ ਸਮਾਂ ਕਦੋਂ ਹੈ?' },
      { label: '☕ ਮਨ ਦੀ ਸ਼ਾਂਤੀ', text: 'ਮੈਨੂੰ ਕੋਈ ਸੁਹਾਵਣੀ ਅਤੇ ਸ਼ਾਂਤ ਗੱਲ ਦੱਸੋ।' },
      { label: '💛 ਮੈਨੂੰ ਘਬਰਾਹਟ ਹੈ', text: 'ਮੈਨੂੰ ਥੋੜ੍ਹਾ ਭੁਲੇਖਾ ਤੇ ਡਰ ਲੱਗ ਰਿਹਾ ਹੈ।' },
    ],
  },
  ta: {
    companionName: 'மீரா (MIRA)',
    welcome: "வணக்கம்! நான் உங்கள் நினைவாற்றல் மற்றும் மனநலத் தோழி மீரா. உங்கள் மருந்துகள், அன்றாட நிகழ்வுகள் அல்லது நினைவக விளையாட்டு பற்றி பேசலாம்.",
    statusLabels: {
      idle: "மைக் தொடவும் அல்லது கீழே தேர்ந்தெடுக்கவும்",
      listening: "கேட்கிறேன்… பேசுங்கள்",
      processing: "மீரா சிந்திக்கிறது…",
      speaking: "மீரா பேசுகிறது…",
      error: "மீண்டும் முயற்சிக்கவும்",
    },
    prompts: [
      { label: '🎮 நினைவக விளையாட்டு', text: 'நினைவக கார்டு விளையாட்டு விளையாடுவோமா!' },
      { label: '🧩 அன்றாட வரிசை விளையாட்டு', text: 'காலை வழக்கங்களை வரிசைப்படுத்த எனக்கு உதவுங்கள்.' },
      { label: '⏰ மருந்து நேரம்', text: 'இன்று என் மருந்து நேரம் எப்போது?' },
      { label: '☕ மன அமைதி கதை', text: 'மனதிற்கு அமைதி தரும் இனிமையான நினைவைச் சொல்லுங்கள்.' },
      { label: '💛 எனக்குக் குழப்பமாக உள்ளது', text: 'எனக்கு இப்போது சற்று பயமாகவும் குழப்பமாகவும் உள்ளது.' },
    ],
  },
  te: {
    companionName: 'మీరా (MIRA)',
    welcome: "నమస్కారం! నేను మీ జ్ఞాపకశక్తి మరియు ఆలోచనా స్నేహితురాలిని మీరా. మీ దినచర్య, మందులు లేదా మెమరీ మ్యాచ్ ఆట గురించి నాతో మాట్లాడవచ్చు.",
    statusLabels: {
      idle: "మైక్ నొక్కండి లేదా కింద ఎంచుకోండి",
      listening: "వింటున్నాను… మాట్లాడండి",
      processing: "మీరా ఆలోచిస్తోంది…",
      speaking: "మీరా మాట్లాడుతోంది…",
      error: "మళ్లీ ప్రయత్నించండి",
    },
    prompts: [
      { label: '🎮 మెమరీ మ్యాచ్ ఆట', text: 'మంచి కార్డులతో మెమరీ మ్యాచ్ ఆట ఆడదాం!' },
      { label: '🧩 దినచర్య క్రమం ఆట', text: 'ఉదయపు పనులను క్రమంలో పెట్టడంలో సహాయం చేయండి.' },
      { label: '⏰ మందుల సమయం', text: 'ఈ రోజు నా మందుల సమయం ఎప్పుడు?' },
      { label: '☕ ప్రశాంత జ్ఞాపకాలు', text: 'మనసుకు ఆహ్లాదం కలిగించే మంచి జ్ఞాపకం చెప్పండి.' },
      { label: '💛 నాకు ఆందోళనగా ఉంది', text: 'నాకు కొద్దిగా కంగారుగా మరియు భయంగా అనిపిస్తోంది.' },
    ],
  },
  mr: {
    companionName: 'मीरा (MIRA)',
    welcome: "नमस्कार! मी तुमची आपुलकीची स्मरणशक्ती सखी मीरा. आपण आपली दिनचर्या, औषधांची वेळ किंवा मेमरी मॅच खेळाविषयी बोलू शकतो.",
    statusLabels: {
      idle: "माईकवर टॅप करा किंवा खालील विषय निवडा",
      listening: "ऐकत आहे… बोला",
      processing: "मीरा विचार करत आहे…",
      speaking: "मीरा बोलत आहे…",
      error: "पुन्हा प्रयत्न करा",
    },
    prompts: [
      { label: '🎮 मेमरी मॅच खेळा', text: 'चला सुंदर कार्डांसह मेमरी मॅच खेळूया!' },
      { label: '🧩 दिनचर्या क्रम खेळ', text: 'सकाळची दिनचर्या क्रमाने लावण्यास मदत करा.' },
      { label: '⏰ औषधांची वेळ', text: 'आज माझी औषध घेण्याची वेळ कधी आहे?' },
      { label: '☕ मनाला शांतता देणारी गोष्ट', text: 'मला मनाला शांत करणारी एखादी सुखद आठवण सांगा.' },
      { label: '💛 मला भीती वाटतेय', text: 'मला थोडे गोंधळल्यासारखे आणि भीती वाटत आहे.' },
    ],
  },
  gu: {
    companionName: 'મીરા (MIRA)',
    welcome: "નમસ્તે! હું તમારી વહાલી યાદશક્તિ સાથી મીરા છું. તમે તમારી દિનચર્યા, દવાનો સમય કે મેમરી મેચ રમત વિશે પૂછી શકો છો.",
    statusLabels: {
      idle: "માઇક પર ટેપ કરો અથવા નીચે વિષય પસંદ કરો",
      listening: "સાંભળી રહી છું… બોલો",
      processing: "મીરા વિચારી રહી છે…",
      speaking: "મીરા બોલી રહી છે…",
      error: "ફરી પ્રયત્ન કરો",
    },
    prompts: [
      { label: '🎮 મેમરી મેચ રમો', text: 'ચાલો સરસ મજાની મેમરી મેચ રમત રમીએ!' },
      { label: '🧩 દૈનિક ક્રમ રમત', text: 'સવારની દિનચર્યા ક્રમમાં ગોઠવવામાં મદદ કરો.' },
      { label: '⏰ દવાનો સમય', text: 'આજે મારી દવાનો સમય ક્યારે છે?' },
      { label: '☕ મનગમતી શાંત યાદો', text: 'મને મન શાંત કરે તેવી કોઈ વાત કહો.' },
      { label: '💛 મને મુંઝવણ થાય છે', text: 'મને થોડો ગભરાટ અને અસમંજસ લાગે છે.' },
    ],
  },
  kn: {
    companionName: 'ಮೀರಾ (MIRA)',
    welcome: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ನೆನಪಿನ ಮತ್ತು ಆಲೋಚನೆಯ ಆಪ್ತ ಮಿತ್ರ ಮೀರಾ. ನಿಮ್ಮ ದಿನಚರಿ, ಔಷಧಿ ಅಥವಾ ಮೆಮೊರಿ ಮ್ಯಾಚ್ ಆಟದ ಬಗ್ಗೆ ಮಾತನಾಡಬಹುದು.",
    statusLabels: {
      idle: "ಮೈಕ್ ಒತ್ತಿ ಅಥವಾ ಕೆಳಗಿನ ವಿಷಯ ಆರಿಸಿ",
      listening: "ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ… ಮಾತನಾಡಿ",
      processing: "ಮೀರಾ ಯೋಚಿಸುತ್ತಿದ್ದಾಳೆ…",
      speaking: "ಮೀರಾ ಮಾತನಾಡುತ್ತಿದ್ದಾಳೆ…",
      error: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
    },
    prompts: [
      { label: '🎮 ಮೆಮೊರಿ ಮ್ಯಾಚ್ ಆಟ', text: 'ಕಾರ್ಡ್ ಹೊಂದಿಸುವ ಮೆಮೊರಿ ಮ್ಯಾಚ್ ಆಟವಾಡೋಣ!' },
      { label: '🧩 ದಿನಚರಿ ಕ್ರಮ ಆಟ', text: 'ಬೆಳಗಿನ ಕೆಲಸಗಳನ್ನು ಸರಿಯಾದ ಕ್ರಮದಲ್ಲಿಡಲು ನೆರವಾಗಿ.' },
      { label: '⏰ ಔಷಧಿಯ ಸಮಯ', text: 'ಇಂದು ನನ್ನ ಔಷಧಿ ಸಮಯ ಯಾವಾಗ?' },
      { label: '☕ ಶಾಂತ ನೆನಪುಗಳು', text: 'ಮನಸ್ಸಿಗೆ ನೆಮ್ಮದಿ ನೀಡುವ ಸುಂದರ ವಿಷಯ ತಿಳಿಸಿ.' },
      { label: '💛 ನನಗೆ ಗೊಂದಲವೆನಿಸುತ್ತಿದೆ', text: 'ನನಗೆ ಸ್ವಲ್ಪ ಭಯ ಮತ್ತು ಗೊಂದಲವಾಗುತ್ತಿದೆ.' },
    ],
  },
  ml: {
    companionName: 'മീര (MIRA)',
    welcome: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ ഓർമ്മത്തോഴി മീര. നിങ്ങളുടെ ദിനചര്യ, മരുന്ന് സമയം, അല്ലെങ്കിൽ മെമ്മറി മാച്ച് കളിയെക്കുറിച്ച് ചോദിക്കാം.",
    statusLabels: {
      idle: "മൈക്ക് തൊടുക അല്ലെങ്കിൽ താഴെ തിരഞ്ഞെടുക്കുക",
      listening: "കേൾക്കുന്നു… സംസാരിക്കൂ",
      processing: "മീര ചിന്തിക്കുന്നു…",
      speaking: "മീര സംസാരിക്കുന്നു…",
      error: "വീണ്ടും ശ്രമിക്കൂ",
    },
    prompts: [
      { label: '🎮 മെമ്മറി മാച്ച് കളി', text: 'നമുക്ക് രസകരമായ മെമ്മറി മാച്ച് ഗെയിം കളിക്കാം!' },
      { label: '🧩 ദിനചര്യ ക്രമം കളി', text: 'പ്രഭാത ദിനചര്യകൾ ക്രമപ്പെടുത്താൻ സഹായിക്കൂ.' },
      { label: '⏰ മരുന്ന് സമയം', text: 'ഇന്ന് എന്റെ മരുന്ന് സമയം എപ്പോഴാണ്?' },
      { label: '☕ മനസ്സിന് ശാന്തി തരുന്ന ഓർമ്മകൾ', text: 'മനസ്സിന് കുളിർമയേകുന്ന ഒരു നല്ല ഓർമ്മ പറയൂ.' },
      { label: '💛 എനിക്ക് പേടി തോന്നുന്നു', text: 'എനിക്ക് അല്പം ആശയക്കുഴപ്പവും ഭയവും തോന്നുന്നു.' },
    ],
  },
  or: {
    companionName: 'ମୀରା (MIRA)',
    welcome: "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କ ସ୍ମୃତି ଓ ମାନସିକ ସାଥି ମୀରା। ଆପଣ ଦିନଚର୍ଯ୍ୟା, ଔଷଧ ସମୟ ବା ମେମୋରୀ ମ୍ୟାଚ୍ ଖେଳ ବିଷୟରେ ପଚାରିପାରିବେ।",
    statusLabels: {
      idle: "ମାଇକ୍ ଛୁଅନ୍ତୁ ବା ତଳୁ ବାଛନ୍ତୁ",
      listening: "ଶୁଣୁଛି… କୁହନ୍ତୁ",
      processing: "ମୀରା ଭାବୁଛି…",
      speaking: "ମୀରା କହୁଛି…",
      error: "ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ",
    },
    prompts: [
      { label: '🎮 ମେମୋରୀ ମ୍ୟାଚ୍ ଖେଳ', text: 'ଆସନ୍ତୁ କାର୍ଡ ମିଳାଇବା ମେମୋରୀ ମ୍ୟାଚ୍ ଖେଳିବା!' },
      { label: '🧩 ଦୈନନ୍ଦିନ କ୍ରମ ଖେଳ', text: 'ସକାଳ କାମକୁ କ୍ରମରେ ରଖିବାରେ ସାହାଯ୍ୟ କରନ୍ତୁ।' },
      { label: '⏰ ଔଷଧ ସମୟ', text: 'ଆଜି ମୋ ଔଷଧ ଖାଇବା ସମୟ କେତେବେଳେ?' },
      { label: '☕ ଶାନ୍ତ ସ୍ମୃତି', text: 'ମନକୁ ଶାନ୍ତି ଦେବା ଭଳି ଏକ କଥା କୁହନ୍ତୁ।' },
      { label: '💛 ମୋତେ ଡର ଲାଗୁଛି', text: 'ମୋତେ ଟିକେ ଭ୍ରମ ଓ ଡର ଲାଗୁଛି।' },
    ],
  },
  ur: {
    companionName: 'میرا (MIRA)',
    welcome: "سلام! میں آپ کی مخلص ساتھی میرا ہوں۔ آپ مجھ سے روزمرہ کاموں، ادویات کے وقت یا میموری میچ کھیل کے بارے میں بات کر سکتے ہیں۔",
    statusLabels: {
      idle: "مائیک پر ٹیپ کریں یا نیچے سے منتخب کریں",
      listening: "سن رہی ہوں… فرمائیے",
      processing: "میرا سوچ رہی ہے…",
      speaking: "میرا بول رہی ہے…",
      error: "دوبارہ کوشش کریں",
    },
    prompts: [
      { label: '🎮 میموری میچ کھیلیں', text: 'آئیے میموری میچ کا پرسکون کھیل کھیلتے ہیں!' },
      { label: '🧩 معمولات ترتیب کھیل', text: 'صبح کے معمولات کو درست ترتیب دینے میں مدد کریں۔' },
      { label: '⏰ دوا کا وقت', text: 'آج میری دوا لینے کا وقت کب ہے؟' },
      { label: '☕ پرسکون باتیں', text: 'مجھے کوئی پرامن اور دلکش یاد سنائیے۔' },
      { label: '💛 مجھے گھبراہٹ ہو رہی ہے', text: 'مجھے تھوڑا خوف اور الجھن محسوس ہو رہی ہے۔' },
    ],
  },
  es: {
    companionName: 'MIRA AI',
    welcome: "¡Hola! Soy MIRA, tu compañera de memoria y estimulación cognitiva. Puedes preguntarme sobre tu día, medicinas o jugar a juegos relajantes.",
    statusLabels: {
      idle: "Toca el micrófono o elige un tema",
      listening: "Escuchando… habla cuando estés listo",
      processing: "MIRA está pensando…",
      speaking: "MIRA está hablando…",
      error: "Intentémoslo de nuevo",
    },
    prompts: [
      { label: '🎮 Jugar a la Memoria', text: '¡Juguemos a emparejar cartas de memoria!' },
      { label: '🧩 Secuencia Diaria', text: 'Ayúdame con el juego de ordenar la rutina.' },
      { label: '⏰ Hora de Medicinas', text: '¿A qué hora me toca tomar la medicina hoy?' },
      { label: '☕ Un Recuerdo Tranquilo', text: 'Cuéntame un recuerdo apacible y sereno.' },
      { label: '💛 Me siento confundido', text: 'Me siento un poco confundido y necesito calma.' },
    ],
  },
  fr: {
    companionName: 'MIRA AI',
    welcome: "Bonjour ! Je suis MIRA, votre amie d'assistance cognitive et de mémoire. Parlons de votre journée, de vos rappels ou jouons ensemble.",
    statusLabels: {
      idle: "Touchez le micro ou choisissez un sujet",
      listening: "J'écoute… parlez quand vous voulez",
      processing: "MIRA réfléchit…",
      speaking: "MIRA vous répond…",
      error: "Réessayons ensemble",
    },
    prompts: [
      { label: '🎮 Jeu de Mémoire', text: 'Jouons au jeu de cartes de mémoire !' },
      { label: '🧩 Séquence du Quotidien', text: 'Aidez-moi à remettre la routine dans l’ordre.' },
      { label: '⏰ Heure des Médicaments', text: 'Quand est mon rappel de médicament aujourd’hui ?' },
      { label: '☕ Doux Souvenir', text: 'Racontez-moi une histoire apaisante et chaleureuse.' },
      { label: '💛 Je me sens perdu', text: 'Je me sens un peu désorienté en ce moment.' },
    ],
  },
  de: {
    companionName: 'MIRA AI',
    welcome: "Hallo! Ich bin MIRA, deine liebevolle Gedächtnisbegleiterin. Frage mich nach deinem Tag, Medikamenten oder spiele ein ruhiges Spiel.",
    statusLabels: {
      idle: "Mikrofon berühren oder Thema wählen",
      listening: "Ich höre zu… sprich ganz in Ruhe",
      processing: "MIRA überlegt…",
      speaking: "MIRA spricht…",
      error: "Versuchen wir es noch einmal",
    },
    prompts: [
      { label: '🎮 Memory spielen', text: 'Lass uns ein entspanntes Memory-Spiel spielen!' },
      { label: '🧩 Tagesablauf ordnen', text: 'Hilf mir beim Ordnen der Morgenschritte.' },
      { label: '⏰ Medikamentenzeit', text: 'Wann nehme ich heute meine Medikamente?' },
      { label: '☕ Schöne Erinnerung', text: 'Erzähle mir eine ruhige und tröstliche Erinnerung.' },
      { label: '💛 Ich fühle mich ängstlich', text: 'Ich bin gerade etwas verwirrt und verunsichert.' },
    ],
  },
  pt: {
    companionName: 'MIRA AI',
    welcome: "Olá! Sou a MIRA, sua companheira de memória e carinho. Pode perguntar sobre o seu dia, medicamentos ou jogar um jogo calmo.",
    statusLabels: {
      idle: "Toque no microfone ou escolha um tema",
      listening: "Ouvindo… fale quando desejar",
      processing: "A MIRA está pensando…",
      speaking: "A MIRA está falando…",
      error: "Vamos tentar de novo",
    },
    prompts: [
      { label: '🎮 Jogo da Memória', text: 'Vamos jogar o jogo de combinar cartas!' },
      { label: '🧩 Rotina Diária', text: 'Ajude-me a organizar a sequência do dia.' },
      { label: '⏰ Hora dos Remédios', text: 'A que horas é o meu remédio hoje?' },
      { label: '☕ Lembrança Aconchegante', text: 'Conte-me uma lembrança calma e reconfortante.' },
      { label: '💛 Sinto-me confuso', text: 'Estou me sentindo um pouco confuso agora.' },
    ],
  },
  ar: {
    companionName: 'MIRA AI',
    welcome: "مرحباً! أنا ميرا، رفيقتك المخلصة للذاكرة والدعم الذهني. يمكنك سؤالي عن يومك، مواعيد الدواء، أو لعب لعبة ذاكرة هادئة.",
    statusLabels: {
      idle: "المس الميكروفون أو اختر موضوعاً أدناه",
      listening: "أستمع إليك… تحدث متى تشاء",
      processing: "ميرا تفكر بعناية…",
      speaking: "ميرا تجيبك الآن…",
      error: "فلنحاول مجدداً",
    },
    prompts: [
      { label: '🎮 لعبة الذاكرة', text: 'دعنا نلعب لعبة مطابقة بطاقات الذاكرة!' },
      { label: '🧩 ترتيب الروتين', text: 'ساعدني في ترتيب خطوات اليوم بالترتيب الصحيح.' },
      { label: '⏰ موعد الدواء', text: 'متى يحين موعد دوائي اليوم؟' },
      { label: '☕ ذكريات هادئة', text: 'حدثني بذكرى جميلة ومهدئة للبال.' },
      { label: '💛 أشعر بالحيرة', text: 'أشعر ببعض الارتباك والخوف الآن.' },
    ],
  },
  zh: {
    companionName: 'MIRA (小米)',
    welcome: "您好！我是您的智能认知与记忆陪伴助手 MIRA。您可以向我询问今日安排、服药时间，或者一起玩放松的记忆游戏。",
    statusLabels: {
      idle: "轻触麦克风或在下方选择话题",
      listening: "正在聆听… 请随时说话",
      processing: "MIRA 正在思考中…",
      speaking: "MIRA 正在回答…",
      error: "让我们再试一次吧",
    },
    prompts: [
      { label: '🎮 记忆配对游戏', text: '让我们一起玩轻松的记忆卡片配对吧！' },
      { label: '🧩 日常排序游戏', text: '请帮我完成日常生活习惯的顺序排列。' },
      { label: '⏰ 服药时间提醒', text: '我今天下一次服药时间是什么时候？' },
      { label: '☕ 宁静温馨回忆', text: '请给我讲一段平静温暖的茶香回忆吧。' },
      { label: '💛 我觉得有点困惑', text: '我现在感觉有点迷惑和不安。' },
    ],
  },
  ja: {
    companionName: 'MIRA (ミラ)',
    welcome: "こんにちは！あなたのための認知と記憶のパートナー、MIRAです。一日の予定やお薬の時間、楽しい記憶ゲームについていつでも話しかけてくださいね。",
    statusLabels: {
      idle: "マイクをタップするか下から選んでください",
      listening: "聞いています… いつでもお話しください",
      processing: "MIRAが考えています…",
      speaking: "MIRAが話しています…",
      error: "もう一度試してみましょう",
    },
    prompts: [
      { label: '🎮 記憶合わせゲーム', text: 'カードを揃える記憶合わせゲームをしましょう！' },
      { label: '🧩 一日の順番ゲーム', text: '毎日の朝の日課を順番に並べ替えるのを手伝って。' },
      { label: '⏰ お薬の時間', text: '今日のお薬の時間はいつですか？' },
      { label: '☕ 心安らぐお話', text: '心がほっとする温かいお話を聞かせてください。' },
      { label: '💛 少し不安です', text: 'いま少し戸惑っていて、不安な気持ちです。' },
    ],
  },
};

/**
 * Expanded MIRA conversational panel.
 * Slides up from the bottom on activation.
 * Powered by Google Gemini AI with dementia-specific memory grounding & cognitive games assistance.
 */
export function MiraPanel({ isOpen, session, onClose }: MiraPanelProps) {
  const { activate, askQuestion, setErrorMessage } = useMira();
  const { settings, setVoiceGender } = useAccessibility();
  const navigate = useNavigate();

  const [inputText, setInputText] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasApiKey = Boolean(getGeminiApiKey());

  // Localized configuration for the active language
  const loc = LOCALIZED_DATA[settings.languageCode] || LOCALIZED_DATA.en;

  // Focus management
  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  // Scroll to bottom when response or transcript updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.transcript, session.responseText, session.state]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSendText = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;
    setInputText('');
    askQuestion(query);
  };

  const handleReplayAudio = () => {
    if (session.responseText) {
      speakMira(session.responseText, {
        languageCode: settings.languageCode,
        speed: settings.voiceSpeed,
        gender: settings.voiceGender,
        soundEnabled: true,
      });
    }
  };

  const isListening = session.state === 'listening';
  const isProcessing = session.state === 'processing';
  const statusLabel = loc.statusLabels[session.state] ?? loc.statusLabels.idle;

  // Check if response mentions games so we can offer a direct shortcut
  const isGameMentioned =
    session.responseText &&
    (session.responseText.toLowerCase().includes('memory match') ||
      session.responseText.toLowerCase().includes('game') ||
      session.responseText.toLowerCase().includes('খেল') ||
      session.responseText.toLowerCase().includes('खेल') ||
      session.responseText.toLowerCase().includes('rhino') ||
      session.responseText.toLowerCase().includes('গঁড়') ||
      session.responseText.toLowerCase().includes('गैंडा'));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="mira-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="mira-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Talk to MIRA"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] overflow-hidden shadow-2xl flex flex-col"
            style={{
              background: 'rgb(var(--color-surface-bg))',
              maxHeight: '90vh',
              height: '84vh',
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0" aria-hidden="true">
              <div className="w-12 h-1.5 rounded-full bg-[rgba(var(--color-text-primary),0.2)]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-[rgba(var(--color-text-primary),0.06)] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <MiraAvatarOrb state={session.state} size={48} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2
                      className="font-bold text-gradient-primary"
                      style={{ fontSize: 'var(--text-xl)' }}
                    >
                      {settings.voiceGender === 'male' ? 'MIRO AI' : loc.companionName}
                    </h2>
                    {hasApiKey ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <Sparkles className="w-3 h-3" /> Gemini
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        NER Companion
                      </span>
                    )}
                  </div>
                  <p
                    className="text-[rgb(var(--color-text-secondary))]"
                    style={{ fontSize: 'var(--text-xs)' }}
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {statusLabel}
                  </p>
                </div>
              </div>

              {/* Top controls: Male/Female voice switcher & Close */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const nextGender = settings.voiceGender === 'female' ? 'male' : 'female';
                    setVoiceGender(nextGender);
                    speakMira(nextGender === 'female' ? 'Hello, I am Mira.' : 'Hello, I am Miro.', {
                      languageCode: settings.languageCode,
                      gender: nextGender,
                      speed: settings.voiceSpeed,
                      soundEnabled: true,
                    });
                  }}
                  title="Switch between Female (Mira) and Male (Miro) voice"
                  aria-label="Switch voice gender"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[rgba(var(--color-text-primary),0.15)] bg-[rgb(var(--color-surface-card))] text-xs font-bold text-[rgb(var(--color-primary))] transition-all active:scale-95"
                >
                  {settings.voiceGender === 'female' ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-pink-500" /> 👩 Female
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5 text-blue-500" /> 👨 Male
                    </>
                  )}
                </button>

                <button
                  ref={closeRef}
                  onClick={onClose}
                  aria-label="Close MIRA"
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-[rgb(var(--color-text-secondary))] hover:bg-[rgba(var(--color-text-primary),0.08)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conversation area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Localized welcoming greeting */}
              <MiraTranscriptBubble
                text={loc.welcome}
                speaker="mira"
                state={session.state}
              />

              {/* User transcript */}
              {session.transcript && (
                <MiraTranscriptBubble
                  text={session.transcript}
                  speaker="user"
                  state={session.state}
                />
              )}

              {/* MIRA thinking indicator */}
              {isProcessing && (
                <MiraTranscriptBubble
                  text=""
                  speaker="mira"
                  state="processing"
                />
              )}

              {/* MIRA response */}
              {session.responseText && (
                <div className="space-y-2">
                  <MiraTranscriptBubble
                    text={session.responseText}
                    speaker="mira"
                    state={session.state}
                  />

                  {/* Audio replay button */}
                  <div className="flex items-center gap-2 pl-10">
                    <button
                      onClick={handleReplayAudio}
                      aria-label="Listen to response again"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))] hover:bg-[rgba(var(--color-primary),0.18)] transition-all"
                    >
                      <Volume2 className="w-4 h-4" /> Listen Again
                    </button>

                    {isGameMentioned && (
                      <button
                        onClick={() => {
                          onClose();
                          navigate('/games/memory-match');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-all"
                      >
                        <Gamepad2 className="w-4 h-4" /> Start Memory Match
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Quick suggestions when idle */}
              {session.state === 'idle' && (
                <div className="pt-2 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-text-secondary))]">
                    Suggested topics:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {loc.prompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendText(prompt.text)}
                        className="text-left px-3.5 py-2 rounded-2xl border border-[rgba(var(--color-text-primary),0.12)] hover:border-[rgb(var(--color-primary))] bg-[rgba(var(--color-surface-card),0.6)] text-[rgb(var(--color-text-primary))] text-sm font-medium transition-all active:scale-95"
                      >
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error toast */}
              <MiraErrorToast
                message={session.errorMessage}
                onDismiss={() => setErrorMessage('')}
                onRetry={activate}
              />

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Controls: Text input + Big Voice button */}
            <div className="p-4 bg-[rgba(var(--color-surface-bg),0.98)] border-t border-[rgba(var(--color-text-primary),0.06)] flex-shrink-0 space-y-3">
              {/* Text input form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendText();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type or speak a question for MIRA..."
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 rounded-2xl border-2 border-[rgba(var(--color-text-primary),0.12)] focus:border-[rgb(var(--color-primary))] bg-[rgb(var(--color-surface-card))] text-[rgb(var(--color-text-primary))] text-base outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isProcessing}
                  aria-label="Send message"
                  className="h-12 w-12 rounded-2xl flex items-center justify-center bg-[rgb(var(--color-primary))] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>

              {/* Microphone speak button */}
              <button
                onClick={isListening ? onClose : activate}
                aria-label={isListening ? 'Stop listening' : 'Start speaking to MIRA'}
                aria-pressed={isListening}
                className="w-full flex items-center justify-center gap-3 rounded-2xl font-bold transition-all duration-300 active:scale-98"
                style={{
                  minHeight: 56,
                  fontSize: 'var(--text-lg)',
                  background: isListening
                    ? 'rgb(var(--color-error))'
                    : 'rgb(var(--color-primary))',
                  color: 'white',
                  boxShadow: isListening
                    ? '0 8px 24px rgba(239,68,68,0.35)'
                    : 'var(--shadow-float)',
                }}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-6 h-6 animate-pulse" aria-hidden="true" />
                    Listening… Tap to Stop
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6" aria-hidden="true" />
                    Speak to {settings.voiceGender === 'male' ? 'MIRO' : 'MIRA'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
