import type { Shift, ShiftInput } from '@/lib/earnings';
import { PLATFORMS, formatMoney, getSummary } from '@/lib/earnings';

export const ASSISTANT_LANGUAGES = [
  { code: 'en-IN', label: 'English', short: 'EN' },
  { code: 'hi-IN', label: 'हिन्दी', short: 'हि' },
  { code: 'te-IN', label: 'తెలుగు', short: 'తె' },
  { code: 'ta-IN', label: 'தமிழ்', short: 'த' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ', short: 'ಕ' },
  { code: 'ml-IN', label: 'മലയാളം', short: 'മ' },
  { code: 'mr-IN', label: 'मराठी', short: 'म' },
  { code: 'bn-IN', label: 'বাংলা', short: 'বা' },
  { code: 'gu-IN', label: 'ગુજરાતી', short: 'ગુ' },
  { code: 'pa-IN', label: 'ਪੰਜਾਬੀ', short: 'ਪੰ' },
  { code: 'or-IN', label: 'ଓଡ଼ିଆ', short: 'ଓ' },
] as const;

export type AssistantLanguage = (typeof ASSISTANT_LANGUAGES)[number]['code'];

export type AssistantContext = {
  shifts: Shift[];
  currentView: string;
};

export type AssistantAction =
  | { type: 'navigate'; view: 'overview' | 'log' | 'history' | 'receipt' }
  | { type: 'fill_shift'; fields: Partial<ShiftInput> }
  | { type: 'save_shift' }
  | { type: 'none' };

export type AssistantCommand = {
  response: string;
  action: AssistantAction;
  confidence: number;
};

type Intent = 'greeting' | 'summary' | 'log' | 'history' | 'receipt' | 'costs' | 'help' | 'unknown';

const words: Record<AssistantLanguage, Record<Intent, string>> = {
  'en-IN': {
    greeting: 'Hello. I am the KamaiClear Assistant. You can say or type: “show my earnings”, “log a shift”, “open history”, or “make a receipt”.',
    summary: 'Your current records show {net} net earnings across {hours} hours. Your average true hourly pay is {hourly}.',
    log: 'Let us record a shift. Open “Log a shift”, then enter your hours, payout and costs. I will calculate the amount that stays with you.',
    history: 'I can show your saved shift history. Open “Shift history” to compare gross payout, costs and net hourly pay.',
    receipt: 'I can prepare a simple Net Pay Receipt from your latest saved shift. Open “Net Pay Receipt” to print or save it as a PDF.',
    costs: 'Costs matter because gross payout is not take-home income. Add fuel, maintenance, phone data and other costs to see your true hourly pay.',
    help: 'You can ask me about earnings, costs, shift history or a receipt. You can also use the microphone or type your question.',
    unknown: 'I did not understand that yet. Try: “what did I earn?”, “record a shift”, “show history”, or “make a receipt”.',
  },
  'hi-IN': {
    greeting: 'नमस्ते। मैं KamaiClear सहायक हूँ। आप बोल या लिख सकते हैं: “मेरी कमाई दिखाओ”, “शिफ्ट जोड़ो”, “इतिहास खोलो”, या “रसीद बनाओ।”',
    summary: 'आपके रिकॉर्ड में {hours} घंटे में {net} शुद्ध कमाई है। आपकी औसत असली प्रति घंटा कमाई {hourly} है।',
    log: 'शिफ्ट दर्ज करने के लिए “शिफ्ट जोड़ें” खोलें। घंटे, भुगतान और खर्च भरें। मैं बची हुई कमाई निकाल दूँगा।',
    history: 'आपका शिफ्ट इतिहास खोल रहा हूँ। वहाँ भुगतान, खर्च और प्रति घंटा कमाई की तुलना कर सकते हैं।',
    receipt: 'आपकी आखिरी शिफ्ट की नेट पे रसीद तैयार है। उसे प्रिंट या PDF में सेव कर सकते हैं।',
    costs: 'सिर्फ कुल भुगतान कमाई नहीं है। ईंधन, रखरखाव और मोबाइल खर्च जोड़कर असली कमाई देखें।',
    help: 'आप कमाई, खर्च, इतिहास या रसीद के बारे में पूछ सकते हैं। माइक्रोफोन या टाइपिंग दोनों इस्तेमाल करें।',
    unknown: 'मैं समझ नहीं पाया। पूछें: “मेरी कमाई कितनी है?”, “शिफ्ट जोड़ो”, “इतिहास दिखाओ”, या “रसीद बनाओ।”',
  },
  'te-IN': {
    greeting: 'నమస్కారం. నేను KamaiClear సహాయకుడిని. “నా సంపాదన చూపించు”, “షిఫ్ట్ జోడించు”, “చరిత్ర తెరువు”, లేదా “రసీదు తయారు చేయి” అని చెప్పండి.',
    summary: 'మీ రికార్డుల్లో {hours} గంటలకు నికర సంపాదన {net}. మీ నిజమైన సగటు గంట ఆదాయం {hourly}.',
    log: 'షిఫ్ట్ నమోదు చేయడానికి “షిఫ్ట్ జోడించు” తెరవండి. గంటలు, చెల్లింపు, ఖర్చులు నమోదు చేయండి.',
    history: 'మీ సేవ్ చేసిన షిఫ్ట్ చరిత్రను తెరవండి. చెల్లింపు, ఖర్చులు, గంట ఆదాయాన్ని పోల్చవచ్చు.',
    receipt: 'చివరి షిఫ్ట్‌కు నెట్ పే రసీదు సిద్ధంగా ఉంది. ప్రింట్ లేదా PDFగా సేవ్ చేయవచ్చు.',
    costs: 'మొత్తం చెల్లింపు మాత్రమే నిజమైన ఆదాయం కాదు. ఇంధనం, నిర్వహణ, ఫోన్ ఖర్చులు జోడించండి.',
    help: 'ఆదాయం, ఖర్చులు, చరిత్ర లేదా రసీదు గురించి అడగండి. మాట్లాడండి లేదా టైప్ చేయండి.',
    unknown: 'నాకు అర్థం కాలేదు. “నా ఆదాయం ఎంత?”, “షిఫ్ట్ జోడించు”, “చరిత్ర చూపించు” అని అడగండి.',
  },
  'ta-IN': {
    greeting: 'வணக்கம். நான் KamaiClear உதவியாளர். “என் வருமானத்தை காட்டு”, “ஷிப்ட் சேர்”, “வரலாற்றை திற”, அல்லது “ரசீது உருவாக்கு” என்று கேளுங்கள்.',
    summary: '{hours} மணி நேரத்தில் உங்கள் நிகர வருமானம் {net}. உண்மையான சராசரி மணிநேர வருமானம் {hourly}.',
    log: 'ஷிப்ட்டை பதிவு செய்ய “ஷிப்ட் சேர்” என்பதைத் திறக்கவும். நேரம், தொகை மற்றும் செலவுகளை உள்ளிடவும்.',
    history: 'சேமித்த ஷிப்ட் வரலாற்றைத் திறக்கலாம். தொகை, செலவு மற்றும் மணிநேர வருமானத்தை ஒப்பிடலாம்.',
    receipt: 'சமீபத்திய ஷிப்ட்டுக்கான நிகர ஊதிய ரசீது தயாராக உள்ளது. PDF ஆக சேமிக்கலாம்.',
    costs: 'மொத்த தொகை மட்டும் உண்மையான வருமானம் அல்ல. எரிபொருள், பராமரிப்பு மற்றும் மொபைல் செலவுகளைச் சேர்க்கவும்.',
    help: 'வருமானம், செலவு, வரலாறு அல்லது ரசீது பற்றி கேளுங்கள். பேசவும் அல்லது தட்டச்சு செய்யவும்.',
    unknown: 'எனக்கு புரியவில்லை. “என் வருமானம் எவ்வளவு?”, “ஷிப்ட் சேர்”, அல்லது “வரலாற்றைக் காட்டு” என்று கேளுங்கள்.',
  },
  'kn-IN': {
    greeting: 'ನಮಸ್ಕಾರ. ನಾನು KamaiClear ಸಹಾಯಕ. “ನನ್ನ ಆದಾಯ ತೋರಿಸು”, “ಶಿಫ್ಟ್ ಸೇರಿಸು”, “ಇತಿಹಾಸ ತೆರೆ”, ಅಥವಾ “ರಸೀದಿ ಮಾಡು” ಎಂದು ಕೇಳಿ.',
    summary: '{hours} ಗಂಟೆಗಳಲ್ಲಿ ನಿಮ್ಮ ನಿವ್ವಳ ಆದಾಯ {net}. ನಿಜವಾದ ಸರಾಸರಿ ಗಂಟೆ ಆದಾಯ {hourly}.',
    log: 'ಶಿಫ್ಟ್ ದಾಖಲಿಸಲು “ಶಿಫ್ಟ್ ಸೇರಿಸು” ತೆರೆಯಿರಿ. ಗಂಟೆಗಳು, ಪಾವತಿ ಮತ್ತು ಖರ್ಚುಗಳನ್ನು ನಮೂದಿಸಿ.',
    history: 'ಉಳಿಸಿದ ಶಿಫ್ಟ್ ಇತಿಹಾಸವನ್ನು ತೆರೆಯಿರಿ. ಪಾವತಿ, ಖರ್ಚು ಮತ್ತು ಗಂಟೆ ಆದಾಯ ಹೋಲಿಸಬಹುದು.',
    receipt: 'ಇತ್ತೀಚಿನ ಶಿಫ್ಟ್‌ನ ನೆಟ್ ಪೇ ರಸೀದಿ ಸಿದ್ಧವಾಗಿದೆ. PDF ಆಗಿ ಉಳಿಸಬಹುದು.',
    costs: 'ಒಟ್ಟು ಪಾವತಿ ಮಾತ್ರ ನಿಜವಾದ ಆದಾಯವಲ್ಲ. ಇಂಧನ, ನಿರ್ವಹಣೆ ಮತ್ತು ಫೋನ್ ಖರ್ಚುಗಳನ್ನು ಸೇರಿಸಿ.',
    help: 'ಆದಾಯ, ಖರ್ಚು, ಇತಿಹಾಸ ಅಥವಾ ರಸೀದಿ ಬಗ್ಗೆ ಕೇಳಿ. ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.',
    unknown: 'ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ. “ನನ್ನ ಆದಾಯ ಎಷ್ಟು?”, “ಶಿಫ್ಟ್ ಸೇರಿಸು” ಅಥವಾ “ಇತಿಹಾಸ ತೋರಿಸು” ಎಂದು ಕೇಳಿ.',
  },
  'ml-IN': {
    greeting: 'നമസ്കാരം. ഞാൻ KamaiClear സഹായി. “എന്റെ വരുമാനം കാണിക്കുക”, “ഷിഫ്റ്റ് ചേർക്കുക”, “ചരിത്രം തുറക്കുക”, അല്ലെങ്കിൽ “രസീത് ഉണ്ടാക്കുക” എന്ന് പറയൂ.',
    summary: '{hours} മണിക്കൂറിൽ നിങ്ങളുടെ നെറ്റ് വരുമാനം {net}. യഥാർത്ഥ ശരാശരി മണിക്കൂർ വരുമാനം {hourly}.',
    log: 'ഷിഫ്റ്റ് രേഖപ്പെടുത്താൻ “ഷിഫ്റ്റ് ചേർക്കുക” തുറക്കൂ. സമയം, പണം, ചെലവുകൾ നൽകൂ.',
    history: 'സേവ് ചെയ്ത ഷിഫ്റ്റ് ചരിത്രം തുറക്കാം. പണം, ചെലവ്, മണിക്കൂർ വരുമാനം താരതമ്യം ചെയ്യാം.',
    receipt: 'അവസാന ഷിഫ്റ്റിന്റെ നെറ്റ് പേ രസീത് തയ്യാറാണ്. PDF ആയി സേവ് ചെയ്യാം.',
    costs: 'മൊത്തം പണം മാത്രം യഥാർത്ഥ വരുമാനം അല്ല. ഇന്ധനം, പരിപാലനം, ഫോൺ ചെലവുകൾ ചേർക്കൂ.',
    help: 'വരുമാനം, ചെലവ്, ചരിത്രം അല്ലെങ്കിൽ രസീത് ചോദിക്കൂ. സംസാരിക്കുകയോ ടൈപ്പ് ചെയ്യുകയോ ചെയ്യാം.',
    unknown: 'എനിക്ക് മനസ്സിലായില്ല. “എന്റെ വരുമാനം എത്ര?”, “ഷിഫ്റ്റ് ചേർക്കൂ” അല്ലെങ്കിൽ “ചരിത്രം കാണിക്കൂ” എന്ന് ചോദിക്കൂ.',
  },
  'mr-IN': {
    greeting: 'नमस्कार. मी KamaiClear सहाय्यक आहे. “माझी कमाई दाखवा”, “शिफ्ट जोडा”, “इतिहास उघडा”, किंवा “पावती तयार करा” असे विचारा.',
    summary: '{hours} तासांत तुमची निव्वळ कमाई {net} आहे. खरी सरासरी तासाची कमाई {hourly} आहे.',
    log: 'शिफ्ट नोंदवण्यासाठी “शिफ्ट जोडा” उघडा. तास, पैसे आणि खर्च भरा.',
    history: 'तुमचा सेव्ह केलेला शिफ्ट इतिहास उघडा. पैसे, खर्च आणि तासाची कमाई तुलना करता येईल.',
    receipt: 'शेवटच्या शिफ्टची नेट पे पावती तयार आहे. ती PDF म्हणून सेव्ह करू शकता.',
    costs: 'एकूण पेमेंट म्हणजे पूर्ण कमाई नाही. इंधन, देखभाल आणि फोन खर्च जोडा.',
    help: 'कमाई, खर्च, इतिहास किंवा पावतीबद्दल विचारा. बोलू शकता किंवा टाइप करू शकता.',
    unknown: 'मला समजले नाही. “माझी कमाई किती?”, “शिफ्ट जोडा” किंवा “इतिहास दाखवा” असे विचारा.',
  },
  'bn-IN': {
    greeting: 'নমস্কার। আমি KamaiClear সহায়ক। “আমার আয় দেখাও”, “শিফট যোগ করো”, “ইতিহাস খোলো”, বা “রসিদ বানাও” বলুন।',
    summary: '{hours} ঘণ্টায় আপনার নেট আয় {net}। আপনার প্রকৃত গড় ঘণ্টার আয় {hourly}।',
    log: 'শিফট যোগ করতে “শিফট যোগ করুন” খুলুন। সময়, পেমেন্ট এবং খরচ লিখুন।',
    history: 'আপনার সেভ করা শিফট ইতিহাস খুলুন। পেমেন্ট, খরচ এবং ঘণ্টার আয় তুলনা করতে পারবেন।',
    receipt: 'শেষ শিফটের নেট পে রসিদ প্রস্তুত। PDF হিসেবে সেভ করা যাবে।',
    costs: 'মোট পেমেন্টই আসল আয় নয়। জ্বালানি, রক্ষণাবেক্ষণ এবং ফোন খরচ যোগ করুন।',
    help: 'আয়, খরচ, ইতিহাস বা রসিদ সম্পর্কে জিজ্ঞাসা করুন। কথা বলুন বা টাইপ করুন।',
    unknown: 'আমি বুঝতে পারিনি। “আমার আয় কত?”, “শিফট যোগ করো” বা “ইতিহাস দেখাও” বলুন।',
  },
  'gu-IN': {
    greeting: 'નમસ્તે. હું KamaiClear સહાયક છું. “મારી કમાણી બતાવો”, “શિફ્ટ ઉમેરો”, “ઇતિહાસ ખોલો”, અથવા “રસીદ બનાવો” કહો.',
    summary: '{hours} કલાકમાં તમારી નેટ કમાણી {net} છે. તમારી સાચી સરેરાશ કલાકની કમાણી {hourly} છે.',
    log: 'શિફ્ટ નોંધવા માટે “શિફ્ટ ઉમેરો” ખોલો. કલાકો, પેમેન્ટ અને ખર્ચ ભરો.',
    history: 'સાચવેલો શિફ્ટ ઇતિહાસ ખોલો. પેમેન્ટ, ખર્ચ અને કલાકની કમાણી સરખાવી શકો છો.',
    receipt: 'છેલ્લી શિફ્ટની નેટ પે રસીદ તૈયાર છે. PDF તરીકે સાચવી શકો છો.',
    costs: 'કુલ પેમેન્ટ જ સાચી કમાણી નથી. ઇંધણ, જાળવણી અને ફોન ખર્ચ ઉમેરો.',
    help: 'કમાણી, ખર્ચ, ઇતિહાસ અથવા રસીદ વિશે પૂછો. બોલો અથવા ટાઇપ કરો.',
    unknown: 'મને સમજાયું નથી. “મારી કમાણી કેટલી?”, “શિફ્ટ ઉમેરો” અથવા “ઇતિહાસ બતાવો” કહો.',
  },
  'pa-IN': {
    greeting: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ। ਮੈਂ KamaiClear ਸਹਾਇਕ ਹਾਂ। “ਮੇਰੀ ਕਮਾਈ ਦਿਖਾਓ”, “ਸ਼ਿਫਟ ਜੋੜੋ”, “ਇਤਿਹਾਸ ਖੋਲ੍ਹੋ”, ਜਾਂ “ਰਸੀਦ ਬਣਾਓ” ਕਹੋ।',
    summary: '{hours} ਘੰਟਿਆਂ ਵਿੱਚ ਤੁਹਾਡੀ ਨੈੱਟ ਕਮਾਈ {net} ਹੈ। ਤੁਹਾਡੀ ਅਸਲੀ ਔਸਤ ਘੰਟੇ ਦੀ ਕਮਾਈ {hourly} ਹੈ।',
    log: 'ਸ਼ਿਫਟ ਦਰਜ ਕਰਨ ਲਈ “ਸ਼ਿਫਟ ਜੋੜੋ” ਖੋਲ੍ਹੋ। ਘੰਟੇ, ਭੁਗਤਾਨ ਅਤੇ ਖਰਚੇ ਭਰੋ।',
    history: 'ਸੇਵ ਕੀਤੀ ਸ਼ਿਫਟ ਹਿਸਟਰੀ ਖੋਲ੍ਹੋ। ਭੁਗਤਾਨ, ਖਰਚੇ ਅਤੇ ਘੰਟੇ ਦੀ ਕਮਾਈ ਦੇਖੋ।',
    receipt: 'ਆਖਰੀ ਸ਼ਿਫਟ ਦੀ ਨੈੱਟ ਪੇ ਰਸੀਦ ਤਿਆਰ ਹੈ। PDF ਵਜੋਂ ਸੇਵ ਕਰ ਸਕਦੇ ਹੋ।',
    costs: 'ਕੁੱਲ ਭੁਗਤਾਨ ਹੀ ਅਸਲੀ ਕਮਾਈ ਨਹੀਂ। ਇੰਧਨ, ਰੱਖ-ਰਖਾਅ ਅਤੇ ਫੋਨ ਖਰਚੇ ਜੋੜੋ।',
    help: 'ਕਮਾਈ, ਖਰਚੇ, ਹਿਸਟਰੀ ਜਾਂ ਰਸੀਦ ਬਾਰੇ ਪੁੱਛੋ। ਬੋਲੋ ਜਾਂ ਟਾਈਪ ਕਰੋ।',
    unknown: 'ਮੈਂ ਸਮਝਿਆ ਨਹੀਂ। “ਮੇਰੀ ਕਮਾਈ ਕਿੰਨੀ?”, “ਸ਼ਿਫਟ ਜੋੜੋ” ਜਾਂ “ਹਿਸਟਰੀ ਦਿਖਾਓ” ਕਹੋ।',
  },
  'or-IN': {
    greeting: 'ନମସ୍କାର। ମୁଁ KamaiClear ସହାୟକ। “ମୋ ଆୟ ଦେଖାଅ”, “ଶିଫ୍ଟ ଯୋଡ଼”, “ଇତିହାସ ଖୋଲ”, କିମ୍ବା “ରସିଦ ତିଆରି କର” କୁହନ୍ତୁ।',
    summary: '{hours} ଘଣ୍ଟାରେ ଆପଣଙ୍କ ନେଟ୍ ଆୟ {net}। ଆପଣଙ୍କ ପ୍ରକୃତ ହାରାହାରି ଘଣ୍ଟା ଆୟ {hourly}।',
    log: 'ଶିଫ୍ଟ ରେକର୍ଡ କରିବାକୁ “ଶିଫ୍ଟ ଯୋଡ଼” ଖୋଲନ୍ତୁ। ସମୟ, ପେମେଣ୍ଟ ଏବଂ ଖର୍ଚ୍ଚ ଭରନ୍ତୁ।',
    history: 'ସଞ୍ଚିତ ଶିଫ୍ଟ ଇତିହାସ ଖୋଲନ୍ତୁ। ପେମେଣ୍ଟ, ଖର୍ଚ୍ଚ ଏବଂ ଘଣ୍ଟା ଆୟ ତୁଳନା କରନ୍ତୁ।',
    receipt: 'ଶେଷ ଶିଫ୍ଟର ନେଟ୍ ପେ ରସିଦ୍ ପ୍ରସ୍ତୁତ। PDF ଭାବରେ ସେଭ୍ କରିପାରିବେ।',
    costs: 'ମୋଟ ପେମେଣ୍ଟ ହିଁ ପ୍ରକୃତ ଆୟ ନୁହେଁ। ଇନ୍ଧନ, ରକ୍ଷଣାବେକ୍ଷଣ ଏବଂ ଫୋନ୍ ଖର୍ଚ୍ଚ ଯୋଡ଼ନ୍ତୁ।',
    help: 'ଆୟ, ଖର୍ଚ୍ଚ, ଇତିହାସ କିମ୍ବା ରସିଦ ବିଷୟରେ ପଚାରନ୍ତୁ। କୁହନ୍ତୁ କିମ୍ବା ଟାଇପ୍ କରନ୍ତୁ।',
    unknown: 'ମୁଁ ବୁଝିପାରିଲି ନାହିଁ। “ମୋ ଆୟ କେତେ?”, “ଶିଫ୍ଟ ଯୋଡ଼” କିମ୍ବା “ଇତିହାସ ଦେଖାଅ” କୁହନ୍ତୁ।',
  },
};

function intentFor(input: string): Intent {
  const value = input.toLocaleLowerCase();
  if (['సంపాదన', 'ఆదాయం', 'வருமானம்', 'ಆದಾಯ', 'വരുമാനം', 'कमाई', 'आय', 'आय', 'আয়', 'કમાણી', 'ਕਮਾਈ', 'ଆୟ'].some((term) => value.includes(term))) return 'summary';
  if (/\b(?:hello|hi|hey|namaste)\b/i.test(value) || ['నమస్కారం', 'வணக்கம்', 'ನಮಸ್ಕಾರ', 'നമസ്കാരം', 'नमस्कार', 'নমস্কার', 'નમસ્તે', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ', 'ନମସ୍କାର'].some((term) => value.includes(term))) return 'greeting';
  if (/help|what can|how|मदद|सहाय|సహాయం|உதவி|ಸಹಾಯ|സഹായം|मदत|সাহায্য|મદદ|ਮਦਦ|ସାହାଯ୍ୟ/.test(value)) return 'help';
  if (/receipt|pdf|रसीद|पावती|రసీదు|ரசீது|ರಸೀದಿ|രസീത്|পাওনা|রসিদ|રસીદ|ਰਸੀਦ|ରସିଦ/.test(value)) return 'receipt';
  if (/history|saved|list|इतिहास|दिखाओ|చరిత్ర|வரலாறு|ಇತಿಹಾಸ|ചരിത്രം|इतिहास|ইতিহাস|ઇતિહાસ|ਇਤਿਹਾਸ|ଇତିହାସ/.test(value)) return 'history';
  if (/log|record|add shift|shift|जोड़|शिफ्ट|షిఫ్ట్|ஷிப்ட்|ಶಿಫ್ಟ್|ഷിഫ്റ്റ്|শিফট|શિફ્ટ|ਸ਼ਿਫਟ|ଶିଫ୍ଟ/.test(value)) return 'log';
  if (/cost|fuel|expense|खर्च|ईंधन|ఖర్చు|எரிபொருள்|ಖರ್ಚು|ചെലവ്|खर्च|খরচ|ખર્ચ|ਖਰਚੇ|ଖର୍ଚ୍ଚ/.test(value)) return 'costs';
  if (/earn|income|pay|money|कमाई|आय|पैसा|సంపాదన|ఆదాయం|வருமானம்|ಆದಾಯ|വരുമാനം|उत्पन्न|আয়|કમાણી|ਕਮਾਈ|ଆୟ/.test(value)) return 'summary';
  return 'unknown';
}

export function assistantReply(input: string, language: AssistantLanguage, context: AssistantContext) {
  const selected = words[language] ?? words['en-IN'];
  const intent = intentFor(input);
  const summary = getSummary(context.shifts);
  const template = selected[intent];
  return template
    .replace('{net}', formatMoney(summary.net))
    .replace('{hours}', summary.hours.toFixed(1))
    .replace('{hourly}', formatMoney(summary.hourly, 2));
}

function firstNumber(input: string, pattern: RegExp) {
  const match = input.match(pattern);
  return match ? Number(match[1]) : undefined;
}

function shiftFieldsFromCommand(input: string): Partial<ShiftInput> {
  const value = input.toLocaleLowerCase();
  const fields: Partial<ShiftInput> = {};
  const platform = PLATFORMS.find((item) => value.includes(item.toLocaleLowerCase()));
  if (platform) fields.platform = platform;

  const hours = firstNumber(value, /(?:hours?|hrs?|घंटे|గంటలు|மணி|ಗಂಟೆ|മണിക്കൂർ|तास|ঘণ্টা|કલાક|ਘੰਟੇ|ଘଣ୍ଟା)[^0-9]{0,8}(\d+(?:\.\d+)?)/i) ?? firstNumber(value, /(\d+(?:\.\d+)?)[^a-z0-9]{0,4}(?:hours?|hrs?|घंटे|గంటలు|மணி|ಗಂಟೆ|മണിക്കൂർ|तास|ঘণ্টা|કલાક|ਘੰਟੇ|ଘଣ୍ଟા)/i);
  const waitingHours = firstNumber(value, /(?:waiting|wait|प्रतीक्षा|వేచి|காத்திருப்பு|ಕಾಯುವ|കാത്തിരിപ്പ്|प्रतीक्षा|অপেক্ষা|રાહ|ਉਡੀਕ|ଅପେକ୍ଷା)[^0-9]{0,8}(\d+(?:\.\d+)?)/i);
  const orders = firstNumber(value, /(?:orders?|trips?|ऑर्डर|ఆర్డర్|ஆர்டர்|ಆರ್ಡರ್|ഓർഡർ|ऑर्डर|অর্ডার|ઓર્ડર|ਆਰਡਰ|ଅର୍ଡର)[^0-9]{0,8}(\d+)/i) ?? firstNumber(value, /(\d+)[^a-z0-9]{0,4}(?:orders?|trips?|ऑर्डर|ఆర్డర్|ஆர்டர்|ಆರ್ಡರ್|ഓർഡർ|ऑर्डर|অর্ডার|ઓર્ડર|ਆਰਡਰ|ଅର୍ଡର)/i);
  const kilometres = firstNumber(value, /(?:km|kilomet(?:re|er)s?|किलोमीटर|కి\.మీ|கிமீ|ಕಿಮೀ|കിമീ|किमी|কিমি|કિમી|ਕਿਲੋਮੀਟਰ|କିମି)[^0-9]{0,8}(\d+(?:\.\d+)?)/i) ?? firstNumber(value, /(\d+(?:\.\d+)?)[^a-z0-9]{0,4}(?:km|kilomet(?:re|er)s?|किलोमीटर|కి\.మీ|கிமீ|ಕಿಮೀ|കിമീ|किमी|কিমি|કિમી|ਕਿਲੋਮੀਟਰ|କିମି)/i);
  const payout = firstNumber(value, /(?:payout|earned|earnings?|paid|कमाई|आय|कमाया|సంపాదన|ఆదాయం|வருமானம்|ಆದಾಯ|വരുമാനം|उत्पन्न|আয়|કમાણી|ਕਮਾਈ|ଆୟ)[^0-9₹]{0,12}₹?\s*(\d+(?:\.\d+)?)/i);
  const tips = firstNumber(value, /(?:tips?|टिप|చిట్కా|டிப்ஸ்|ಟಿಪ್ಸ್|ടിപ്സ്|टिप्स|টিপস|ટીપ્સ|ਟਿਪਸ|ଟିପ୍ସ)[^0-9₹]{0,8}₹?\s*(\d+(?:\.\d+)?)/i);
  const incentives = firstNumber(value, /(?:incentives?|bonus|प्रोत्साहन|బోనస్|ஊக்கத்தொகை|ಬೋನಸ್|ഇൻസെന്റീവ്|बोनस|বোনাস|બોનસ|ਬੋਨਸ|ପ୍ରୋତ୍ସାହନ)[^0-9₹]{0,8}₹?\s*(\d+(?:\.\d+)?)/i);
  const fuel = firstNumber(value, /(?:fuel|petrol|charging|ईंधन|पेट्रोल|চার্জ|ఇంధనం|பெட்ரோல்|ಇಂಧನ|ഇന്ധനം|पेट्रोल|জ্বালানি|ઇંધણ|ਇੰਧਨ|ଇନ୍ଧନ)[^0-9₹]{0,8}₹?\s*(\d+(?:\.\d+)?)/i);
  const maintenance = firstNumber(value, /(?:maintenance|repair|रखरखाव|मरम्मत|నిర్వహణ|பராமரிப்பு|ನಿರ್ವಹಣೆ|പരിപാലനം|देखभाल|রক্ষণাবেক্ষণ|જાળવણી|ਰੱਖ-ਰਖਾਅ|ରକ୍ଷଣାବେକ୍ଷଣ)[^0-9₹]{0,8}₹?\s*(\d+(?:\.\d+)?)/i);
  const phone = firstNumber(value, /(?:phone|data|mobile|मोबाइल|डेटा|ఫోన్|డేటా|தொலைபேசி|ಮೊಬೈಲ್|ഫോൺ|मोबाईल|ফোন|ડેટા|ਫੋਨ|ଫୋନ୍)[^0-9₹]{0,8}₹?\s*(\d+(?:\.\d+)?)/i);

  if (hours !== undefined) fields.hours = hours;
  if (waitingHours !== undefined) fields.waitingHours = waitingHours;
  if (orders !== undefined) fields.orders = orders;
  if (kilometres !== undefined) fields.kilometres = kilometres;
  if (payout !== undefined) fields.payout = payout;
  if (tips !== undefined) fields.tips = tips;
  if (incentives !== undefined) fields.incentives = incentives;
  if (fuel !== undefined) fields.fuel = fuel;
  if (maintenance !== undefined) fields.maintenance = maintenance;
  if (phone !== undefined) fields.phone = phone;
  return fields;
}

export function interpretAssistantCommand(input: string, language: AssistantLanguage, context: AssistantContext): AssistantCommand {
  const value = input.toLocaleLowerCase();
  const fields = shiftFieldsFromCommand(input);
  const hasFields = Object.keys(fields).length > 0;
  const saveRequested = /save|submit|confirm|सहेज|सेव|जमा|భద్రపరచ|சேமி|ಉಳಿಸು|സേവ്|साठवा|সেভ|સાચવો|ਸੇਵ|ସେଭ/.test(value);

  if (saveRequested) {
    return {
      response: language === 'en-IN' ? 'I am ready to save the shift. Please check the numbers in the form, then confirm save.' : assistantReply('log', language, context),
      action: { type: 'save_shift' },
      confidence: 0.94,
    };
  }

  if (hasFields) {
    return {
      response: language === 'en-IN' ? 'I filled the shift details I heard. Please review the highlighted numbers before saving.' : assistantReply('log', language, context),
      action: { type: 'fill_shift', fields },
      confidence: 0.88,
    };
  }

  if (/\b(?:log|record|add|start)\b[\s\S]*\bshift\b/i.test(value)) {
    return { response: assistantReply('log', language, context), action: { type: 'navigate', view: 'log' }, confidence: 0.96 };
  }

  if (/open|go|show|navigate|खोल|दिखा|చూపించు|திற|ತೆರೆ|തുറ|उघडा|খোলো|ખોલો|ਖੋਲ੍ਹੋ|ଖୋଲ/.test(value)) {
    if (/history|list|इतिहास|చరిత్ర|வரலாறு|ಇತಿಹಾಸ|ചരിത്രം|ইতিহাস|ઇતિહાસ|ਇਤਿਹਾਸ|ଇତିହାସ/.test(value)) return { response: assistantReply('history', language, context), action: { type: 'navigate', view: 'history' }, confidence: 0.96 };
    if (/receipt|pdf|रसीद|రసీదు|ரசீது|ರಸೀದಿ|രസീത്|রসিদ|રસીદ|ਰਸੀਦ|ରସିଦ/.test(value)) return { response: assistantReply('receipt', language, context), action: { type: 'navigate', view: 'receipt' }, confidence: 0.96 };
    if (/log|record|shift|जोड़|शिफ्ट|షిఫ్ట్|ஷிப்ட்|ಶಿಫ್ಟ್|ഷിഫ്റ്റ്|শিফট|શિફ્ટ|ਸ਼ਿਫਟ|ଶିଫ୍ଟ/.test(value)) return { response: assistantReply('log', language, context), action: { type: 'navigate', view: 'log' }, confidence: 0.96 };
  }

  return { response: assistantReply(input, language, context), action: { type: 'none' }, confidence: 0.74 };
}

export const ASSISTANT_EXAMPLES: Record<AssistantLanguage, string[]> = {
  'en-IN': ['What did I earn?', 'Log a shift', 'Show my history'],
  'hi-IN': ['मेरी कमाई दिखाओ', 'शिफ्ट जोड़ो', 'इतिहास दिखाओ'],
  'te-IN': ['నా సంపాదన చూపించు', 'షిఫ్ట్ జోడించు', 'చరిత్ర చూపించు'],
  'ta-IN': ['என் வருமானத்தை காட்டு', 'ஷிப்ட் சேர்', 'வரலாற்றைக் காட்டு'],
  'kn-IN': ['ನನ್ನ ಆದಾಯ ತೋರಿಸು', 'ಶಿಫ್ಟ್ ಸೇರಿಸು', 'ಇತಿಹಾಸ ತೋರಿಸು'],
  'ml-IN': ['എന്റെ വരുമാനം കാണിക്കുക', 'ഷിഫ്റ്റ് ചേർക്കുക', 'ചരിത്രം കാണിക്കുക'],
  'mr-IN': ['माझी कमाई दाखवा', 'शिफ्ट जोडा', 'इतिहास दाखवा'],
  'bn-IN': ['আমার আয় দেখাও', 'শিফট যোগ করো', 'ইতিহাস দেখাও'],
  'gu-IN': ['મારી કમાણી બતાવો', 'શિફ્ટ ઉમેરો', 'ઇતિહાસ બતાવો'],
  'pa-IN': ['ਮੇਰੀ ਕਮਾਈ ਦਿਖਾਓ', 'ਸ਼ਿਫਟ ਜੋੜੋ', 'ਹਿਸਟਰੀ ਦਿਖਾਓ'],
  'or-IN': ['ମୋ ଆୟ ଦେଖାଅ', 'ଶିଫ୍ଟ ଯୋଡ଼', 'ଇତିହାସ ଦେଖାଅ'],
};
