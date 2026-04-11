// api/whatsapp.js — Send WhatsApp notifications via CallMeBot
// Free service — no business account needed
// Setup: user must send "I allow callmebot to send me messages" to +34 644 59 21 48 first

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

  const { phone, message, apiKey } = req.body || {}

  if (!phone || !message) {
    return res.status(400).json({ error: 'Missing phone or message' })
  }

  try {
    // Clean phone number
    let cleanPhone = phone.replace(/[^0-9+]/g, '')
    if (cleanPhone.startsWith('07')) cleanPhone = '250' + cleanPhone.slice(1)
    if (cleanPhone.startsWith('7'))  cleanPhone = '250' + cleanPhone

    const key = apiKey || process.env.CALLMEBOT_DEFAULT_KEY || ''

    if (!key) {
      // No API key — skip silently, don't fail
      return res.status(200).json({ ok: true, skipped: true, reason: 'No API key' })
    }

    const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(message)}&apikey=${key}`
    const response = await fetch(url)
    const text = await response.text()

    return res.status(200).json({ ok: true, response: text })
  } catch (err) {
    console.error('WhatsApp error:', err)
    // Non-blocking — never fail the main flow
    return res.status(200).json({ ok: true, skipped: true, error: err.message })
  }
}
