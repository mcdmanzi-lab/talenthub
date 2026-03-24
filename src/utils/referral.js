// src/utils/referral.js

export function generateReferralCode(userId) {
  return userId.replace(/-/g, '').slice(0, 8).toUpperCase()
}

export function getReferralLink(code) {
  return `${import.meta.env.VITE_APP_URL}/register?ref=${code}`
}

export function getStoredRef() {
  return localStorage.getItem('talenthub_ref') || null
}

export function storeRef(code) {
  if (code) localStorage.setItem('talenthub_ref', code)
}

export function getReferralDiscount() {
  return localStorage.getItem('talenthub_has_discount') === 'true'
}

export function setReferralDiscount() {
  localStorage.setItem('talenthub_has_discount', 'true')
}

export function clearReferralDiscount() {
  localStorage.removeItem('talenthub_has_discount')
}
