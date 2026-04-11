// api/send-email.js  — Vercel Serverless Function
// This runs on the SERVER, so RESEND_KEY never reaches the browser.
// In Vercel dashboard: add RESEND_KEY as an Environment Variable (NOT prefixed with VITE_).

const ALLOWED_ORIGINS = [
  process.env.VITE_APP_URL,
  'http://localhost:5173',
]

// Very basic rate-limit: max 20 emails per IP per minute (in-memory, resets per cold start)
const rateLimitMap = new Map()
function isRateLimited(ip) {
  const now = Date.now()
  const entry = rateLimitMap.get(ip) || { count: 0, reset: now + 60_000 }
  if (now > entry.reset) { entry.count = 0; entry.reset = now + 60_000 }
  entry.count++
  rateLimitMap.set(ip, entry)
  return entry.count > 20
}

export default async function handler(req, res) {
  // ── CORS ────────────────────────────────────────────────────
  const origin = req.headers.origin
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' })

  // ── Rate limit ───────────────────────────────────────────────
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Try again in a minute.' })
  }

  // ── Validate payload ─────────────────────────────────────────
  const { to, subject, html } = req.body || {}

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' })
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(to)) {
    return res.status(400).json({ error: 'Invalid recipient email address' })
  }

  if (subject.length > 200) {
    return res.status(400).json({ error: 'Subject too long' })
  }

  if (html.length > 50_000) {
    return res.status(400).json({ error: 'Email body too large' })
  }

  // ── Send via Resend ──────────────────────────────────────────
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.RESEND_KEY}`,
      },
      body: JSON.stringify({
        from:    process.env.FROM_EMAIL || 'TalentHub Rwanda <noreply@talenthub.rw>',
        to:      [to],
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Resend error:', err)
      return res.status(502).json({ error: 'Email service error' })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('send-email handler error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
