// src/utils/translate.js
import { getLang } from './i18n'

const cache = {}

export async function translateText(text, targetLang) {
  if (!text || !text.trim()) return text
  if (targetLang === 'en') return text

  const cacheKey = `${targetLang}:${text.slice(0, 50)}`
  if (cache[cacheKey]) return cache[cacheKey]

  const langNames = {
    fr: 'French',
    rw: 'Kinyarwanda',
    sw: 'Swahili',
    am: 'Amharic',
    yo: 'Yoruba',
    tw: 'Twi',
    zu: 'Zulu',
  }

  try {
    const res = await fetch('/api/ai-translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        targetLang,
        targetLangName: langNames[targetLang] || targetLang,
      }),
    })
    const data = await res.json()
    const translated = data.translated || text
    cache[cacheKey] = translated
    return translated
  } catch {
    return text // fallback to original on error
  }
}

export function getCurrentLang() {
  return getLang()
}
