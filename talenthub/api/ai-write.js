// api/ai-write.js — AI Job Description & Cover Letter Writer

const ALLOWED_ORIGINS = [
  process.env.VITE_APP_URL,
  'http://localhost:5173',
]

export default async function handler(req, res) {
  const origin = req.headers.origin
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { type, data } = req.body || {}

  try {
    let prompt = ''

    if (type === 'job_description') {
      prompt = `You are a professional HR writer for TalentHub, an African job platform.

Write a professional job description based on:
- Job Title: ${data.title}
- Company: ${data.company}
- Location: ${data.location}
- Type: ${data.type}
- Category: ${data.category}
- Key Skills: ${data.skills || 'Not specified'}
- Salary: ${data.salary || 'Competitive'}
- Notes from employer: ${data.notes || 'None'}

Write a complete, professional job description in this format:
1. Brief company intro (2 sentences)
2. Role overview (2-3 sentences)
3. Key Responsibilities (5 bullet points)
4. Requirements (5 bullet points)
5. What we offer (3 bullet points)

Keep it professional, clear and attractive to African professionals. Max 400 words.
Return only the job description text, no extra commentary.`

    } else if (type === 'cover_letter') {
      prompt = `You are a professional career coach for TalentHub, an African job platform.

Write a professional cover letter for:
- Applicant Name: ${data.applicant_name}
- Applicant Title: ${data.applicant_title || 'Professional'}
- Applicant Skills: ${(data.skills || []).join(', ')}
- Job Title: ${data.job_title}
- Company: ${data.company}
- Why they want this job: ${data.reason || 'Looking for new opportunities'}

Write a concise, professional cover letter (3 paragraphs):
1. Opening — who they are and why they're applying
2. Middle — their key skills and relevant experience
3. Closing — enthusiasm and call to action

Max 200 words. Professional but warm tone. Return only the cover letter text.`

    } else if (type === 'profile_bio') {
      prompt = `Write a professional profile bio for a TalentHub user:
- Name: ${data.name}
- Title: ${data.title || 'Professional'}
- Skills: ${(data.skills || []).join(', ')}
- Category: ${data.category || 'Professional'}
- Location: ${data.location || 'Africa'}

Write 2-3 sentences that sound professional, confident and human. 
No clichés like "passionate" or "results-driven".
Return only the bio text, max 80 words.`
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const result = await response.json()
    const text = result.content?.[0]?.text || ''

    return res.status(200).json({ text })

  } catch (err) {
    console.error('AI write error:', err)
    return res.status(500).json({ error: err.message, text: '' })
  }
}
