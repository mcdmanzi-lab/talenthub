// src/utils/email.js
// Calls our server-side Vercel function — Resend key never touches the browser.

export async function sendEmail({ to, subject, html }) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.warn('Email send failed:', err.error || res.status)
    }
  } catch (e) {
    console.warn('Email send failed:', e)
    // Non-blocking — never throw
  }
}
