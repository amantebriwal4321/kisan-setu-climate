// Farmer-facing strings in the three languages of the demo district.
export type Lang = "en" | "hi" | "kn";

export const LANGS: { id: Lang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "hi", label: "हिंदी" },
  { id: "kn", label: "ಕನ್ನಡ" },
];

export const voiceCode: Record<Lang, string> = { en: "en-IN", hi: "hi-IN", kn: "kn-IN" };

type Str = {
  saathi: string;
  alertTag: string;
  sellHere: string;
  play: string;
  pause: string;
  resume: string;
  noVoice: string;
  callBanner: string;   // "automated call, works on any phone"
  pressKeys: string;    // "Press 1 to accept · Press 2 to decline"
  bookedNote: string;   // reassurance that the unit is notified
  modeBasic: string;    // toggle label
  modeApp: string;      // toggle label
  accept: string;
  notNow: string;
  booked: string;
  okNotNow: string;
  waiting: string;
  header: (crop: string) => string;
  mandi: (crash: number) => string;
  bring: (crop: string, unit: string, offer: number) => string;
  pickup: (crop: string, point: string, phone: string, unit: string) => string;
  nearestCenterNotice: string;
  fieldConsole: string;
  fieldSubtitle: string;
  roleKrishiSakhi: string;
  roleVle: string;
  roleFpo: string;
  actionCall: string;
  actionVisit: string;
  actionCenter: string;
  statusBooked: string;
  // value chain (who gains what, and why buy from the farmer not the cheaper mandi)
  whyQ: (offer: number, crash: number) => string;
  chainFresh: string;
  chainProcessed: (product: string) => string;
  chainYouGet: (offer: number, mult: string) => string;
  winWhy: (product: string, price: number, offer: number) => string;
};

export const STR: Record<Lang, Str> = {
  en: {
    saathi: "Krishi Saathi",
    alertTag: "PRICE ALERT",
    sellHere: "Don’t dump it — sell here instead",
    play: "🔊 Play message",
    pause: "❚❚ Pause",
    resume: "▶ Resume",
    noVoice: "🔇 No English voice on this device — open on an Android phone to hear it",
    callBanner: "📞 Automated call · works on any phone — no app, no internet",
    pressKeys: "Press 1 to accept · Press 2 to decline",
    bookedNote: "The unit has been notified to expect your crop.",
    modeBasic: "📟 Basic phone",
    modeApp: "📱 Smartphone",
    accept: "Accept",
    notNow: "Not now",
    booked: "Booked",
    okNotNow: "Okay, not now",
    waiting: "Waiting for a price alert…",
    nearestCenterNotice: "No phone or internet? Visit your village Krishi Sakhi or CSC Center to book in person.",
    fieldConsole: "Field Partner Console",
    fieldSubtitle: "Village-level human bridge for farmers without smartphones.",
    roleKrishiSakhi: "Krishi Sakhi (KSCP)",
    roleVle: "CSC VLE",
    roleFpo: "FPO Coordinator",
    actionCall: "📞 Call farmer",
    actionVisit: "🚶 Visited field",
    actionCenter: "🏢 At Center",
    statusBooked: "Booked",
    header: (c) => `${c} price crashing`,
    mandi: (crash) => `Mandi is paying only ₹${crash}/kg today`,
    bring: (c, u, o) => `Bring your ${c} to ${u}. You’ll get ₹${o}/kg.`,
    pickup: (c, point, phone, u) => `Bring your ${c} to ${point} by tomorrow 10 am. Call ${phone} to confirm — a van takes it from there to ${u}.`,
    whyQ: (offer, crash) => `Why buy from the farmer at ₹${offer} when the mandi is ₹${crash}?`,
    chainFresh: "glut, rots unsold",
    chainProcessed: (product) => `as ${product} · lasts`,
    chainYouGet: (offer, mult) => `You get ₹${offer}/kg — ${mult}× the mandi`,
    winWhy: (product, price, offer) =>
      `The mandi price is a crash — in the glut most of the crop rots unsold, so it isn’t supply a unit can rely on. Buying direct from you at ₹${offer} gets it steady, fresh crop it turns into ${product} worth ₹${price}/kg — and gets you a guaranteed buyer instead of the crashing mandi. Both win.`,
  },
  hi: {
    saathi: "कृषि साथी",
    alertTag: "मूल्य चेतावनी",
    sellHere: "फेंके नहीं — यहाँ बेचिए",
    play: "🔊 संदेश सुनें",
    pause: "❚❚ रोकें",
    resume: "▶ जारी रखें",
    noVoice: "🔇 इस डिवाइस में हिंदी आवाज़ नहीं है — एंड्रॉइड फ़ोन पर सुनें",
    callBanner: "📞 अपने-आप आने वाली कॉल · किसी भी फ़ोन पर चलती है — न ऐप, न इंटरनेट",
    pressKeys: "स्वीकारने के लिए 1 दबाएँ · मना करने के लिए 2 दबाएँ",
    bookedNote: "यूनिट को आपकी फसल के बारे में सूचित कर दिया गया है।",
    modeBasic: "📟 साधारण फ़ोन",
    modeApp: "📱 स्मार्टफ़ोन",
    accept: "स्वीकारें",
    notNow: "अभी नहीं",
    booked: "बुक हो गया",
    okNotNow: "ठीक है, अभी नहीं",
    waiting: "मूल्य चेतावनी की प्रतीक्षा…",
    nearestCenterNotice: "फ़ोन या इंटरनेट नहीं है? सीधे अपने गाँव की कृषि सखी या सीएससी केंद्र जाकर बुक करवाएँ।",
    fieldConsole: "फील्ड पार्टनर कंसोल",
    fieldSubtitle: "स्मार्टफ़ोन न रखने वाले किसानों के लिए जमीनी सेतु।",
    roleKrishiSakhi: "कृषि सखी (केएससीपी)",
    roleVle: "सीएससी वीएलई",
    roleFpo: "एफपीओ समन्वयक",
    actionCall: "📞 किसान को कॉल",
    actionVisit: "🚶 खेत दौरा",
    actionCenter: "🏢 केंद्र पर आए",
    statusBooked: "बुक किया गया",
    header: (c) => `${c} के दाम गिर रहे हैं`,
    mandi: (crash) => `मंडी आज सिर्फ ₹${crash}/किलो दे रही है`,
    bring: (c, u, o) => `अपनी ${c} ${u} ले जाइए। ₹${o}/किलो मिलेगा।`,
    pickup: (c, point, phone, u) => `अपनी ${c} कल सुबह 10 बजे तक ${point} पर पहुँचाएँ। पक्का करने के लिए ${phone} पर कॉल करें — वहाँ से वैन इसे ${u} तक ले जाएगी।`,
    whyQ: (offer, crash) => `मंडी में ₹${crash} है, फिर भी किसान से ₹${offer} में क्यों?`,
    chainFresh: "बहुत आवक, बिना बिके सड़ता",
    chainProcessed: (product) => `${product} बनकर · टिकाऊ`,
    chainYouGet: (offer, mult) => `आपको ₹${offer}/किलो — मंडी से ${mult} गुना`,
    winWhy: (product, price, offer) =>
      `मंडी का दाम क्रैश है — इतनी आवक में ज़्यादातर फसल बिना बिके सड़ जाती है, इसलिए यूनिट उस पर भरोसा नहीं कर सकती। आपसे सीधे ₹${offer} में लेकर उसे ताज़ा फसल मिलती है, जिसे वह ₹${price}/किलो के ${product} में बदलती है — और आपको मंडी की जगह पक्का खरीदार मिलता है। दोनों का फायदा।`,
  },
  kn: {
    saathi: "ಕೃಷಿ ಸಾಥಿ",
    alertTag: "ಬೆಲೆ ಎಚ್ಚರಿಕೆ",
    sellHere: "ಎಸೆಯಬೇಡಿ — ಇಲ್ಲಿ ಮಾರಿ",
    play: "🔊 ಸಂದೇಶ ಕೇಳಿ",
    pause: "❚❚ ನಿಲ್ಲಿಸಿ",
    resume: "▶ ಮುಂದುವರಿಸಿ",
    noVoice: "🔇 ಈ ಸಾಧನದಲ್ಲಿ ಕನ್ನಡ ಧ್ವನಿ ಇಲ್ಲ — ಆಂಡ್ರಾಯ್ಡ್ ಫೋನ್‌ನಲ್ಲಿ ಕೇಳಿ",
    callBanner: "📞 ಸ್ವಯಂಚಾಲಿತ ಕರೆ · ಯಾವುದೇ ಫೋನ್‌ನಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತದೆ — ಆ್ಯಪ್ ಇಲ್ಲ, ಇಂಟರ್ನೆಟ್ ಇಲ್ಲ",
    pressKeys: "ಒಪ್ಪಲು 1 ಒತ್ತಿ · ಬೇಡವೆಂದರೆ 2 ಒತ್ತಿ",
    bookedNote: "ನಿಮ್ಮ ಬೆಳೆಯನ್ನು ನಿರೀಕ್ಷಿಸಲು ಘಟಕಕ್ಕೆ ತಿಳಿಸಲಾಗಿದೆ.",
    modeBasic: "📟 ಸಾಮಾನ್ಯ ಫೋನ್",
    modeApp: "📱 ಸ್ಮಾರ್ಟ್‌ಫೋನ್",
    accept: "ಒಪ್ಪಿ",
    notNow: "ಈಗ ಬೇಡ",
    booked: "ಬುಕ್ ಆಗಿದೆ",
    okNotNow: "ಸರಿ, ಈಗ ಬೇಡ",
    waiting: "ಬೆಲೆ ಎಚ್ಚರಿಕೆಗಾಗಿ ಕಾಯುತ್ತಿದೆ…",
    nearestCenterNotice: "ಫೋನ್ ಅಥವಾ ಇಂಟರ್ನೆಟ್ ಇಲ್ಲವೇ? ನೇರವಾಗಿ ನಿಮ್ಮ ಗ್ರಾಮದ ಕೃಷಿ ಸಖಿ ಅಥವಾ ಸಿಎಸ್‌ಸಿ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ ಬುಕ್ ಮಾಡಿ.",
    fieldConsole: "ಕ್ಷೇತ್ರ ಪಾಲುದಾರ ಕನ್ಸೋಲ್",
    fieldSubtitle: "ಸ್ಮಾರ್ಟ್‌ಫೋನ್ ಇಲ್ಲದ ರೈತರಿಗೆ ಗ್ರಾಮ ಮಟ್ಟದ ಮಾನವ ಸಂಪರ್ಕ ಸೇತು.",
    roleKrishiSakhi: "ಕೃಷಿ ಸಖಿ (ಕೆಎಸ್‌ಸಿಪಿ)",
    roleVle: "ಸಿಎಸ್‌ಸಿ ವಿಎಲ್‌ಇ",
    roleFpo: "ಎಫ್‌ಪಿಒ ಸಂಯೋಜಕರು",
    actionCall: "📞 ರೈತರಿಗೆ ಕರೆ",
    actionVisit: "🚶 ಕ್ಷೇತ್ರ ಭೇಟಿ",
    actionCenter: "🏢 ಕೇಂದ್ರಕ್ಕೆ ಬಂದಿದ್ದಾರೆ",
    statusBooked: "ಬುಕ್ ಮಾಡಲಾಗಿದೆ",
    header: (c) => `${c} ಬೆಲೆ ಕುಸಿಯುತ್ತಿದೆ`,
    mandi: (crash) => `ಮಂಡಿ ಇಂದು ₹${crash}/ಕೆಜಿ ಮಾತ್ರ ಕೊಡುತ್ತಿದೆ`,
    bring: (c, u, o) => `ನಿಮ್ಮ ${c} ${u} ಗೆ ತನ್ನಿ. ₹${o}/ಕೆಜಿ ಸಿಗುತ್ತದೆ.`,
    pickup: (c, point, phone, u) => `ನಿಮ್ಮ ${c} ಅನ್ನು ನಾಳೆ ಬೆಳಿಗ್ಗೆ 10 ಗಂಟೆಯ ಒಳಗೆ ${point} ಗೆ ತನ್ನಿ. ಖಚಿತಪಡಿಸಲು ${phone} ಗೆ ಕರೆ ಮಾಡಿ — ಅಲ್ಲಿಂದ ವ್ಯಾನ್ ಅದನ್ನು ${u} ಗೆ ಒಯ್ಯುತ್ತದೆ.`,
    whyQ: (offer, crash) => `ಮಂಡಿಯಲ್ಲಿ ₹${crash} ಇರುವಾಗ ರೈತನಿಂದ ₹${offer}ಗೆ ಏಕೆ?`,
    chainFresh: "ಹೆಚ್ಚು ಆವಕ, ಮಾರಾಟವಾಗದೆ ಕೊಳೆಯುತ್ತದೆ",
    chainProcessed: (product) => `${product} ಆಗಿ · ಬಾಳಿಕೆ`,
    chainYouGet: (offer, mult) => `ನಿಮಗೆ ₹${offer}/ಕೆಜಿ — ಮಂಡಿಗಿಂತ ${mult} ಪಟ್ಟು`,
    winWhy: (product, price, offer) =>
      `ಮಂಡಿ ಬೆಲೆ ಕುಸಿತ — ಇಷ್ಟು ಆವಕದಲ್ಲಿ ಹೆಚ್ಚಿನ ಬೆಳೆ ಮಾರಾಟವಾಗದೆ ಕೊಳೆಯುತ್ತದೆ, ಹಾಗಾಗಿ ಘಟಕ ಅದನ್ನು ನಂಬಲಾಗದು. ನಿಮ್ಮಿಂದ ನೇರವಾಗಿ ₹${offer}ಗೆ ಪಡೆದು ತಾಜಾ ಬೆಳೆ ಸಿಗುತ್ತದೆ, ಅದನ್ನು ₹${price}/ಕೆಜಿ ${product} ಆಗಿ ಮಾಡುತ್ತದೆ — ಮತ್ತು ನಿಮಗೆ ಕುಸಿಯುವ ಮಂಡಿ ಬದಲು ಖಚಿತ ಖರೀದಿದಾರ ಸಿಗುತ್ತದೆ. ಇಬ್ಬರಿಗೂ ಲಾಭ.`,
  },
};

export function loadLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const v = localStorage.getItem("ks_lang");
    if (v === "en" || v === "hi" || v === "kn") return v;
  } catch {}
  return "en";
}
export function saveLang(l: Lang) {
  try { localStorage.setItem("ks_lang", l); } catch {}
}

// Farmer interface mode: a basic keypad phone (the reality for most) or a smartphone app.
export type Mode = "basic" | "app";
export function loadMode(): Mode {
  if (typeof window === "undefined") return "basic";
  try {
    const v = localStorage.getItem("ks_mode");
    if (v === "basic" || v === "app") return v;
  } catch {}
  return "basic";
}
export function saveMode(m: Mode) {
  try { localStorage.setItem("ks_mode", m); } catch {}
}
