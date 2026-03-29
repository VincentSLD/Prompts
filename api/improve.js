export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `Tu es un expert en prompt engineering. Améliore le prompt suivant pour le rendre plus efficace, précis et structuré. Garde la même langue et le même objectif, mais optimise la clarté, ajoute des instructions utiles et améliore la structure.

Prompt original :
---
${prompt}
---

Réponds UNIQUEMENT avec le prompt amélioré, sans explication ni commentaire.`
        }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: `Anthropic API error: ${err}` });
    }

    const data = await response.json();
    const improved = data.content[0].text;
    return res.status(200).json({ improved });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
