// ─── Input Validation & Sanitization Utility ─────────────────
// src/utils/validate.js

// Strip all HTML tags to prevent XSS injection
export function stripHtml(str) {
  if (!str || typeof str !== 'string') return ''
  return str.replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').trim()
}

// Truncate a string to a maximum length
export function truncate(str, max) {
  if (!str) return ''
  return String(str).slice(0, max)
}

// Sanitize + truncate in one step
export function clean(str, max = 500) {
  return truncate(stripHtml(str), max)
}

// ─── Field-level rules ────────────────────────────────────────
export const LIMITS = {
  name:        { max: 80,   label: 'Name' },
  title:       { max: 120,  label: 'Job title' },
  company:     { max: 100,  label: 'Company' },
  location:    { max: 100,  label: 'Location' },
  salary:      { max: 80,   label: 'Salary' },
  bio:         { max: 600,  label: 'Bio' },
  description: { max: 5000, label: 'Description' },
  message:     { max: 2000, label: 'Message' },
  subject:     { max: 150,  label: 'Subject' },
  reply:       { max: 2000, label: 'Reply' },
  tag:         { max: 40,   label: 'Skill/tag' },
  url:         { max: 300,  label: 'URL' },
  phone:       { max: 20,   label: 'Phone' },
  portfolio_title: { max: 100, label: 'Portfolio title' },
  portfolio_desc:  { max: 500, label: 'Portfolio description' },
}

// ─── Validators ───────────────────────────────────────────────

export function validateRequired(value, fieldName) {
  if (!value || !String(value).trim()) return `${fieldName} is required.`
  return null
}

export function validateMaxLength(value, field) {
  if (!value) return null
  const rule = LIMITS[field]
  if (!rule) return null
  if (String(value).length > rule.max) return `${rule.label} must be under ${rule.max} characters.`
  return null
}

export function validateUrl(value) {
  if (!value) return null
  try {
    const u = new URL(value)
    if (!['http:', 'https:'].includes(u.protocol)) return 'URL must start with https://'
    return null
  } catch {
    return 'Enter a valid URL (e.g. https://example.com)'
  }
}

export function validatePhone(value) {
  if (!value) return null
  const cleaned = value.replace(/[^0-9+\s\-()]/g, '')
  if (cleaned.length < 7) return 'Phone number is too short.'
  if (cleaned.length > 20) return 'Phone number is too long.'
  return null
}

export function validateEmail(value) {
  if (!value) return null
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(value)) return 'Enter a valid email address.'
  return null
}

// ─── Sanitize an entire form object ──────────────────────────
// Pass in { field: value } pairs and get back cleaned values + any errors

export function sanitizeJobForm(form) {
  const errors = []

  const cleaned = {
    title:          clean(form.title,       LIMITS.title.max),
    company:        clean(form.company,     LIMITS.company.max),
    location:       clean(form.location,    LIMITS.location.max),
    salary:         clean(form.salary,      LIMITS.salary.max),
    description:    clean(form.description, LIMITS.description.max),
    type:           form.type,
    category:       form.category,
    remote:         !!form.remote,
    max_applicants: form.max_applicants ? Number(form.max_applicants) : null,
    whatsapp_number: clean(form.whatsapp_number, LIMITS.phone.max),
  }

  if (!cleaned.title)       errors.push('Job title is required.')
  if (!cleaned.company)     errors.push('Company is required.')
  if (!cleaned.location)    errors.push('Location is required.')
  if (!cleaned.description) errors.push('Description is required.')
  if (!cleaned.type)        errors.push('Job type is required.')
  if (!cleaned.category)    errors.push('Category is required.')

  const lenErrors = [
    validateMaxLength(cleaned.title,       'title'),
    validateMaxLength(cleaned.company,     'company'),
    validateMaxLength(cleaned.description, 'description'),
    validateMaxLength(cleaned.salary,      'salary'),
  ].filter(Boolean)

  errors.push(...lenErrors)

  return { cleaned, errors }
}

export function sanitizeProfileForm(form) {
  const errors = []

  const cleaned = {
    full_name:       clean(form.full_name,       LIMITS.name.max),
    title:           clean(form.title,           LIMITS.title.max),
    location:        clean(form.location,        LIMITS.location.max),
    phone:           clean(form.phone,           LIMITS.phone.max),
    website:         clean(form.website,         LIMITS.url.max),
    bio:             clean(form.bio,             LIMITS.bio.max),
    skills:          (form.skills || []).map(s => clean(s, LIMITS.tag.max)).filter(Boolean).slice(0, 20),
    worker_category: form.worker_category,
  }

  if (!cleaned.full_name) errors.push('Name is required.')

  const urlErr = validateUrl(cleaned.website)
  if (urlErr) errors.push(urlErr)

  const phoneErr = validatePhone(cleaned.phone)
  if (phoneErr) errors.push(phoneErr)

  return { cleaned, errors }
}

export function sanitizeMessageForm(form) {
  const errors = []

  const cleaned = {
    subject: clean(form.subject, LIMITS.subject.max),
    body:    clean(form.body,    LIMITS.message.max),
  }

  if (!cleaned.subject.trim()) errors.push('Subject is required.')
  if (!cleaned.body.trim())    errors.push('Message cannot be empty.')

  return { cleaned, errors }
}

export function sanitizeReply(text) {
  const c = clean(text, LIMITS.reply.max)
  if (!c.trim()) return { cleaned: '', error: 'Reply cannot be empty.' }
  return { cleaned: c, error: null }
}
