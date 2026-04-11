// src/utils/whatsapp.js
// Send WhatsApp messages through our server function

export async function sendWhatsApp({ phone, message, apiKey }) {
  if (!phone) return // skip if no phone number
  try {
    await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message, apiKey }),
    })
  } catch (e) {
    console.warn('WhatsApp send failed:', e)
    // Non-blocking — never throw
  }
}

// Pre-built notification messages
export const WA_MESSAGES = {
  newApplication: (jobTitle, applicantName) =>
    `🔔 *TalentHub* — New application!\n\n*${applicantName}* applied for your job: *${jobTitle}*\n\nCheck your dashboard: ${import.meta.env.VITE_APP_URL}/dashboard`,

  jobApproved: (jobTitle) =>
    `✅ *TalentHub* — Job Approved!\n\nYour job *"${jobTitle}"* has been approved and is now live on TalentHub.\n\nView it here: ${import.meta.env.VITE_APP_URL}/jobs`,

  jobRejected: (jobTitle) =>
    `❌ *TalentHub* — Job Not Approved\n\nYour job *"${jobTitle}"* was not approved. Please review and resubmit.\n\nGo to dashboard: ${import.meta.env.VITE_APP_URL}/dashboard`,

  newMessage: (senderName) =>
    `✉️ *TalentHub* — New Message!\n\n*${senderName}* sent you a message.\n\nReply here: ${import.meta.env.VITE_APP_URL}/messages`,

  subscriptionExpiring: (daysLeft) =>
    `⚠️ *TalentHub* — Subscription Expiring!\n\nYour subscription expires in *${daysLeft} days*.\n\nRenew now: ${import.meta.env.VITE_APP_URL}/subscribe`,

  newJob: (jobTitle, company) =>
    `🔔 *TalentHub* — New Job Alert!\n\n*${jobTitle}* at *${company}* was just posted.\n\nApply now: ${import.meta.env.VITE_APP_URL}/jobs`,
}
