// api/cron-expire-subscriptions.js
// Runs every day at midnight — deactivates expired subscriptions

import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Deactivate all expired subscriptions
  const { data, error } = await sb
    .from('profiles')
    .update({ subscription_active: false })
    .eq('subscription_active', true)
    .lt('subscription_expires_at', new Date().toISOString())
    .select('id, email, full_name')

  if (error) return res.status(500).json({ error: error.message })

  // Notify each expired user
  for (const user of data || []) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_KEY}`
      },
      body: JSON.stringify({
        from:    process.env.FROM_EMAIL || 'TalentHub <noreply@talenthub.rw>',
        to:      [user.email],
        subject: '❌ Your TalentHub subscription has expired',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px">
            <h2 style="color:#2563eb">TalentHub</h2>
            <p>Hi <strong>${user.full_name || 'there'}</strong>,</p>
            <p>Your TalentHub subscription has expired. You no longer have access to jobs, workers, and platform features.</p>
            <p>Renew today to restore your access instantly.</p>
            <a href="${process.env.VITE_APP_URL}/subscribe"
               style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;margin-top:12px">
              Renew Subscription →
            </a>
          </div>
        `
      })
    })
  }

  return res.status(200).json({ expired: data?.length || 0 })
}
