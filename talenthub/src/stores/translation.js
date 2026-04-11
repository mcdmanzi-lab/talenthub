import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const SUPPORTED_LANGUAGES = {
  en: { name: "English", flag: "🇬🇧", dir: "ltr" },
  fr: { name: "Français", flag: "🇫🇷", dir: "ltr" },
  sw: { name: "Kiswahili", flag: "🇰🇪", dir: "ltr" },
  ar: { name: "العربية", flag: "🇸🇦", dir: "rtl" },
  zh: { name: "中文", flag: "🇨🇳", dir: "ltr" },
  es: { name: "Español", flag: "🇪🇸", dir: "ltr" },
  pt: { name: "Português", flag: "🇧🇷", dir: "ltr" },
  hi: { name: "हिन्दी", flag: "🇮🇳", dir: "ltr" },
  de: { name: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  ru: { name: "Русский", flag: "🇷🇺", dir: "ltr" },
  ja: { name: "日本語", flag: "🇯🇵", dir: "ltr" },
  ko: { name: "한국어", flag: "🇰🇷", dir: "ltr" },
  it: { name: "Italiano", flag: "🇮🇹", dir: "ltr" },
  nl: { name: "Nederlands", flag: "🇳🇱", dir: "ltr" },
  tr: { name: "Türkçe", flag: "🇹🇷", dir: "ltr" },
  vi: { name: "Tiếng Việt", flag: "🇻🇳", dir: "ltr" },
  th: { name: "ภาษาไทย", flag: "🇹🇭", dir: "ltr" },
  id: { name: "Bahasa Indonesia", flag: "🇮🇩", dir: "ltr" },
  pl: { name: "Polski", flag: "🇵🇱", dir: "ltr" },
  uk: { name: "Українська", flag: "🇺🇦", dir: "ltr" },
};

const STORAGE_KEY = "talenthub_language";
const SEEN_KEY = "talenthub_lang_chosen";

// In-memory translation cache: { `${lang}:${text}` -> translatedText }
const translationCache = new Map();

export const useTranslationStore = defineStore("translation", () => {
  const currentLanguage = ref(localStorage.getItem(STORAGE_KEY) || "en");
  const isTranslating = ref(false);
  const showLanguagePicker = ref(!localStorage.getItem(SEEN_KEY));
  const autoTranslateEnabled = ref(currentLanguage.value !== "en");

  const currentLangInfo = computed(() => SUPPORTED_LANGUAGES[currentLanguage.value] || SUPPORTED_LANGUAGES.en);
  const isRTL = computed(() => currentLangInfo.value.dir === "rtl");

  function setLanguage(lang) {
    currentLanguage.value = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    localStorage.setItem(SEEN_KEY, "1");
    showLanguagePicker.value = false;
    autoTranslateEnabled.value = lang !== "en";

    // Update document direction for RTL support
    document.documentElement.setAttribute("dir", SUPPORTED_LANGUAGES[lang]?.dir || "ltr");
    document.documentElement.setAttribute("lang", lang);
  }

  function dismissLanguagePicker() {
    localStorage.setItem(SEEN_KEY, "1");
    showLanguagePicker.value = false;
  }

  function toggleAutoTranslate() {
    autoTranslateEnabled.value = !autoTranslateEnabled.value;
  }

  /**
   * Translate a single string
   */
  async function translateText(text, targetLang = null) {
    const lang = targetLang || currentLanguage.value;
    if (lang === "en" || !text || typeof text !== "string" || text.trim() === "") return text;

    const cacheKey = `${lang}:${text}`;
    if (translationCache.has(cacheKey)) return translationCache.get(cacheKey);

    try {
      const res = await fetch("/api/ai-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLanguage: lang, sourceLanguage: "en" }),
      });
      const data = await res.json();
      const translated = data.translatedText || text;
      translationCache.set(cacheKey, translated);
      return translated;
    } catch {
      return text;
    }
  }

  /**
   * Translate an array of strings in one API call (efficient batch)
   */
  async function translateBatch(texts, targetLang = null) {
    const lang = targetLang || currentLanguage.value;
    if (lang === "en" || !texts?.length) return texts;

    // Check cache for each item
    const results = new Array(texts.length);
    const toTranslate = [];
    const indices = [];

    texts.forEach((text, i) => {
      const cacheKey = `${lang}:${text}`;
      if (translationCache.has(cacheKey) || !text || typeof text !== "string") {
        results[i] = translationCache.get(cacheKey) || text;
      } else {
        toTranslate.push(text);
        indices.push(i);
      }
    });

    if (toTranslate.length === 0) return results;

    try {
      isTranslating.value = true;
      const res = await fetch("/api/ai-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: toTranslate, targetLanguage: lang, sourceLanguage: "en" }),
      });
      const data = await res.json();
      const translations = data.translations || toTranslate;

      translations.forEach((translated, j) => {
        const originalIndex = indices[j];
        const originalText = toTranslate[j];
        results[originalIndex] = translated;
        translationCache.set(`${lang}:${originalText}`, translated);
      });
    } catch {
      indices.forEach((originalIndex, j) => {
        results[originalIndex] = toTranslate[j];
      });
    } finally {
      isTranslating.value = false;
    }

    return results;
  }

  /**
   * Translate a whole object's string values (for job posts, profiles, etc.)
   */
  async function translateObject(obj, fields, targetLang = null) {
    const lang = targetLang || currentLanguage.value;
    if (lang === "en") return obj;

    const values = fields.map((f) => obj[f] || "");
    const translated = await translateBatch(values, lang);

    const result = { ...obj };
    fields.forEach((f, i) => {
      if (translated[i]) result[f] = translated[i];
    });
    return result;
  }

  return {
    currentLanguage,
    isTranslating,
    showLanguagePicker,
    autoTranslateEnabled,
    currentLangInfo,
    isRTL,
    setLanguage,
    dismissLanguagePicker,
    toggleAutoTranslate,
    translateText,
    translateBatch,
    translateObject,
    SUPPORTED_LANGUAGES,
  };
});
