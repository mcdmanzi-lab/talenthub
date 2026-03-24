// api/ai-translate.js — AI Translation using Claude

const ALLOWED_ORIGINS = [
  process.env.VITE_APP_URL,
  'http://localhost:5173',
]

export default async function handler(req, res) {
  const origin = req.headers.origin
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { text, targetLang, targetLangName } = req.body || {}

  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Missing text or targetLang' })
  }

  // No translation needed for English
  if (targetLang === 'en') {
    return res.status(200).json({ translated: text })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Translate the following text to ${targetLangName || targetLang}.
Keep the same format and structure. Only return the translated text, nothing else.

Text to translate:
${text}`
        }],
      }),
    })

    const data = await response.json()
    const translated = data.content?.[0]?.text || text

    return res.status(200).json({ translated })

  } catch (err) {
    console.error('Translation error:', err)
    return res.status(200).json({ translated: text }) // fallback to original
  }
}
