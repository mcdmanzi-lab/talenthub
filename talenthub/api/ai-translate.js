import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const SUPPORTED_LANGUAGES = {
  en: "English",
  fr: "French",
  sw: "Swahili",
  ar: "Arabic",
  zh: "Chinese (Simplified)",
  es: "Spanish",
  pt: "Portuguese",
  hi: "Hindi",
  de: "German",
  ru: "Russian",
  ja: "Japanese",
  ko: "Korean",
  it: "Italian",
  nl: "Dutch",
  tr: "Turkish",
  vi: "Vietnamese",
  th: "Thai",
  id: "Indonesian",
  pl: "Polish",
  uk: "Ukrainian",
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ languages: SUPPORTED_LANGUAGES });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text, texts, targetLanguage, sourceLanguage } = req.body;

    if (!targetLanguage) {
      return res.status(400).json({ error: "Missing targetLanguage" });
    }

    const targetLangName = SUPPORTED_LANGUAGES[targetLanguage] || targetLanguage;
    const sourceLangName = sourceLanguage
      ? SUPPORTED_LANGUAGES[sourceLanguage] || sourceLanguage
      : "auto-detected language";

    // Batch translation
    if (texts && Array.isArray(texts)) {
      if (texts.length === 0) return res.status(200).json({ translations: [] });

      const prompt = `Translate the following JSON array of strings from ${sourceLangName} to ${targetLangName}.
Return ONLY a valid JSON object: {"translations": ["...", "...", ...]} with the same number of elements in the same order.
Preserve any HTML tags, markdown, line breaks, and special characters exactly as-is.

Input array:
${JSON.stringify(texts)}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 4000,
        messages: [
          {
            role: "system",
            content:
              "You are a professional translator. Return only valid JSON with a 'translations' key containing an array of translated strings. Never add commentary.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      let translations;
      try {
        const parsed = JSON.parse(response.choices[0].message.content);
        translations = parsed.translations || Object.values(parsed)[0] || texts;
      } catch {
        translations = texts;
      }

      return res.status(200).json({ translations });
    }

    // Single text translation
    if (!text) {
      return res.status(400).json({ error: "Missing text or texts" });
    }

    if (sourceLanguage && sourceLanguage === targetLanguage) {
      return res.status(200).json({ translatedText: text });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content:
            "You are a professional translator for a job marketplace. Translate accurately preserving tone, markdown, HTML tags, and special characters. Return ONLY the translated text, nothing else.",
        },
        {
          role: "user",
          content: `Translate from ${sourceLangName} to ${targetLangName}:\n\n${text}`,
        },
      ],
    });

    const translatedText = response.choices[0].message.content.trim();
    return res.status(200).json({ translatedText });
  } catch (error) {
    console.error("AI translate error:", error);
    return res.status(500).json({ error: "Translation failed", details: error.message });
  }
}
