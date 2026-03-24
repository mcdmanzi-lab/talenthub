// api/ai-match.js — AI Job Matching using Claude

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

  const { type, profile, jobs, job, workers } = req.body || {}

  try {
    let prompt = ''

    if (type === 'match_jobs') {
      // Worker asks: which jobs suit me best?
      prompt = `You are a job matching assistant for TalentHub, an African job platform.

A worker has this profile:
- Name: ${profile.full_name}
- Title: ${profile.title || 'Not specified'}
- Skills: ${(profile.skills || []).join(', ') || 'Not specified'}
- Category: ${profile.worker_category || 'Not specified'}
- Bio: ${profile.bio || 'Not specified'}
- Location: ${profile.location || 'Not specified'}

Here are available jobs (JSON):
${JSON.stringify(jobs?.slice(0, 20) || [], null, 2)}

Return a JSON array of the top 5 best matching job IDs with a match score (0-100) and a one-sentence reason.
Format: [{"id": "job-id", "score": 85, "reason": "Your Vue.js skills match perfectly"}]
Return ONLY valid JSON, no explanation.`

    } else if (type === 'match_workers') {
      // Employer asks: which workers suit my job best?
      prompt = `You are a recruitment assistant for TalentHub, an African job platform.

A job posting:
- Title: ${job.title}
- Description: ${job.description}
- Required Skills/Tags: ${(job.tags || []).join(', ')}
- Category: ${job.category}
- Location: ${job.location}

Here are available workers (JSON):
${JSON.stringify(workers?.slice(0, 20) || [], null, 2)}

Return a JSON array of the top 5 best matching worker IDs with a match score (0-100) and a one-sentence reason.
Format: [{"id": "worker-id", "score": 90, "reason": "Has 3 years of relevant experience"}]
Return ONLY valid JSON, no explanation.`
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

    const data = await response.json()
    const text = data.content?.[0]?.text || '[]'

    // Parse JSON from response
    const clean = text.replace(/```json|```/g, '').trim()
    const matches = JSON.parse(clean)

    return res.status(200).json({ matches })

  } catch (err) {
    console.error('AI match error:', err)
    return res.status(500).json({ error: err.message, matches: [] })
  }
}
