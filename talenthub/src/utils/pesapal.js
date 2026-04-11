// src/utils/pesapal.js
// All PesaPal calls go through our server function — no CORS, no exposed keys.

export async function initiatePesapalPayment({ amount, description, email, phone, firstName, lastName }) {
  try {
    const res = await fetch('/api/pesapal', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'initiate', amount, description, email, phone, firstName, lastName }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Payment failed')
    return { success: true, redirectUrl: data.redirectUrl, orderId: data.orderId }
  } catch (err) {
    console.error('Pesapal error:', err)
    return { success: false, error: err.message }
  }
}

export async function checkPaymentStatus(orderTrackingId) {
  try {
    const res = await fetch('/api/pesapal', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status', orderTrackingId }),
    })
    const data = await res.json()
    return data.status // 'Completed', 'Failed', 'Pending'
  } catch (err) {
    console.error('Pesapal status error:', err)
    return null
  }
}

// Kept for backward compatibility — PaymentCallback.vue calls getPesapalToken + checkPaymentStatus separately
// This replaces that pattern with a single call
export async function getPesapalToken() {
  return 'server-side' // token is now handled in api/pesapal.js
}
