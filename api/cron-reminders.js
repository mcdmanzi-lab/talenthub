// api/cron-reminders.js
// Runs every day at 8am — sends renewal reminder emails to users expiring in 3 days

import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // needs service key to bypass RLS
)

export default async function handler(req, res) {
  // Only allow Vercel cron calls
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Find users expiring in exactly 3 days
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    const dayStart = new Date(threeDaysFromNow)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(threeDaysFromNow)
    dayEnd.setHours(23, 59, 59, 999)

    const { data: expiring } = await sb
      .from('profiles')
      .select('id, full_name, email, role, subscription_expires_at')
      .eq('subscription_active', true)
      .gte('subscription_expires_at', dayStart.toISOString())
      .lte('subscription_expires_at', dayEnd.toISOString())

    if (!expiring?.length) {
      return res.status(200).json({ message: 'No users expiring soon', count: 0 })
    }

    let sent = 0
    for (const user of expiring) {
      const fee = user.role === 'employer' ? '30,000 RWF' : '10,000 RWF'
      const expDate = new Date(user.subscription_expires_at).toLocaleDateString('en-GB')

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_KEY}`
        },
        body: JSON.stringify({
          from:    process.env.FROM_EMAIL || 'TalentHub <noreply@talenthub.rw>',
          to:      [user.email],
          subject: '⚠️ Your TalentHub subscription expires in 3 days',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0a0a0f;color:#f0f0f5;padding:32px;border-radius:12px">
              <h2 style="color:#facc15;margin-bottom:8px">⚠️ Subscription Expiring Soon</h2>
              <p>Hi <strong>${user.full_name || 'there'}</strong>,</p>
              <p>Your TalentHub subscription expires on <strong>${expDate}</strong>.</p>
              <p>Renew now to keep access to all features:</p>
              <ul style="color:#a0a0b0;margin:12px 0">
                ${user.role === 'employer' 
                  ? '<li>Post jobs and find workers</li><li>Manage applications</li><li>Message workers directly</li>' 
                  : '<li>Browse and apply to jobs</li><li>Keep your profile visible to employers</li><li>Receive job alerts</li>'}
              </ul>
              <div style="background:#1a1a24;border-radius:8px;padding:16px;margin:20px 0;text-align:center">
                <div style="font-size:24px;font-weight:700;color:#4ade80">${fee}/month</div>
              </div>
              <a href="${process.env.VITE_APP_URL}/subscribe" 
                 style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
                Renew Subscription →
              </a>
              <p style="color:#505060;font-size:12px;margin-top:24px">
                If you don't renew, your account will be suspended after ${expDate}.
              </p>
            </div>
          `
        })
      })
      sent++
    }

    return res.status(200).json({ message: `Sent ${sent} reminders`, count: sent })

  } catch (err) {
    console.error('Cron reminder error:', err)
    return res.status(500).json({ error: err.message })
  }
}
