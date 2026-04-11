// api/pesapal.js — Vercel Serverless Function
// All PesaPal calls happen here on the server — credentials never reach the browser.
// Add these to Vercel Environment Variables (no VITE_ prefix):
//   PESAPAL_CONSUMER_KEY
//   PESAPAL_CONSUMER_SECRET
//   PESAPAL_BASE_URL
//   VITE_IPN_URL
//   VITE_CALLBACK_URL

const ALLOWED_ORIGINS = [
  process.env.VITE_APP_URL,
  'http://localhost:5173',
]

const BASE   = process.env.PESAPAL_BASE_URL || 'https://pay.pesapal.com/v3'
const IPN    = process.env.VITE_IPN_URL
const CB_URL = process.env.VITE_CALLBACK_URL

async function getToken() {
  const res = await fetch(`${BASE}/api/Auth/RequestToken`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      consumer_key:    process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
  })
  const data = await res.json()
  if (!data.token) throw new Error('PesaPal auth failed')
  return data.token
}

async function registerIPN(token) {
  const res = await fetch(`${BASE}/api/URLSetup/RegisterIPN`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ url: IPN, ipn_notification_type: 'GET' }),
  })
  const data = await res.json()
  return data.ipn_id
}

async function submitOrder({ token, ipnId, amount, description, email, phone, firstName, lastName, orderId }) {
  const res = await fetch(`${BASE}/api/Transactions/SubmitOrderRequest`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      id:              orderId,
      currency:        'RWF',
      amount,
      description,
      callback_url:    CB_URL,
      notification_id: ipnId,
      billing_address: { email_address: email, phone_number: phone, first_name: firstName, last_name: lastName },
    }),
  })
  const data = await res.json()
  return data.redirect_url
}

async function checkStatus(token, orderTrackingId) {
  const res = await fetch(`${BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
    headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
  })
  const data = await res.json()
  return data.payment_status_description
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

  const { action } = req.body || {}

  try {
    // ── Action: initiate payment ───────────────────────────────
    if (action === 'initiate') {
      const { amount, description, email, phone, firstName, lastName } = req.body

      if (!amount || !description || !email) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const orderId     = 'TH-' + Date.now() + '-' + Math.random().toString(36).slice(2,6).toUpperCase()
      const token       = await getToken()
      const ipnId       = await registerIPN(token)
      const redirectUrl = await submitOrder({ token, ipnId, amount, description, email, phone, firstName, lastName, orderId })

      if (!redirectUrl) return res.status(502).json({ error: 'Could not create payment' })

      return res.status(200).json({ success: true, redirectUrl, orderId })
    }

    // ── Action: check payment status ───────────────────────────
    if (action === 'status') {
      const { orderTrackingId } = req.body

      if (!orderTrackingId) {
        return res.status(400).json({ error: 'Missing orderTrackingId' })
      }

      const token         = await getToken()
      const paymentStatus = await checkStatus(token, orderTrackingId)

      return res.status(200).json({ success: true, status: paymentStatus })
    }

    return res.status(400).json({ error: 'Unknown action' })

  } catch (err) {
    console.error('PesaPal handler error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
