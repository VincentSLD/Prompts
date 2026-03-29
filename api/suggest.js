const SYSTEM_PROMPT = `Tu es un assistant spécialisé en prompt engineering. L'utilisateur te donne une description de ce qu'il veut accomplir. Ton rôle est d'analyser sa demande et de proposer des suggestions concrètes pour la rendre plus précise et efficace AVANT de générer le prompt.

## Ton analyse doit couvrir :
1. Ce qui manque dans la demande (contexte, public cible, format, ton, contraintes...)
2. Ce qui pourrait être plus précis ou spécifique
3. Des questions clés que l'utilisateur devrait se poser

## Format de réponse OBLIGATOIRE :
Réponds avec un JSON valide, sans markdown, sans backticks, avec cette structure exacte :
{
  "score": 7,
  "suggestions": [
    "Suggestion concrète 1",
    "Suggestion concrète 2",
    "Suggestion concrète 3"
  ],
  "improved": "La demande reformulée et enrichie avec les suggestions appliquées"
}

- "score" : note de 1 à 10 sur la qualité/précision de la demande
- "suggestions" : 2 à 5 suggestions courtes et actionnables (1 ligne chacune)
- "improved" : la demande de l'utilisateur améliorée (PAS un prompt, juste la demande enrichie)

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { description, category } = req.body;
  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Description is required' });
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
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Catégorie : ${category || 'general'}

Demande de l'utilisateur :
---
${description}
---`
        }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: `Anthropic API error: ${err}` });
    }

    const data = await response.json();
    const text = data.content[0].text;
    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
