// api/cron-expire.js
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

  try {
    // Deactivate all subscriptions that have expired
    const { data, error } = await sb
      .from('profiles')
      .update({ subscription_active: false })
      .eq('subscription_active', true)
      .lt('subscription_expires_at', new Date().toISOString())
      .select('id, email, full_name')

    if (error) throw error

    const count = data?.length || 0
    console.log(`Deactivated ${count} expired subscriptions`)

    return res.status(200).json({ message: `Deactivated ${count} subscriptions`, count })

  } catch (err) {
    console.error('Cron expire error:', err)
    return res.status(500).json({ error: err.message })
  }
}
