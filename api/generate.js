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

  const categoryContext = {
    image: "Le prompt doit être optimisé pour la génération d'images (Midjourney, DALL-E, Stable Diffusion). Utilise un style descriptif avec des termes visuels : composition, éclairage, style artistique, détails techniques (ratio, qualité). Structure : sujet principal, style, éclairage, ambiance, détails techniques, paramètres.",
    llm: "Le prompt doit être optimisé pour un LLM (ChatGPT, Claude). Structure avec : rôle/persona, contexte, tâche précise, format de sortie, contraintes, ton souhaité.",
    code: "Le prompt doit être optimisé pour demander du code à un LLM. Inclure : langage/framework, objectif, contraintes techniques, format attendu (code commenté, avec tests, etc.), bonnes pratiques à respecter.",
    general: "Le prompt doit être clair, structuré et efficace pour un usage général avec un LLM."
  };

  const ctx = categoryContext[category] || categoryContext.general;

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
          content: `Tu es un expert en prompt engineering. L'utilisateur décrit ce qu'il veut obtenir, et tu dois générer le prompt parfait et prêt à l'emploi.

Catégorie : ${category || 'general'}
${ctx}

Description de l'utilisateur :
---
${description}
---

Génère un prompt complet, structuré et optimisé. Réponds UNIQUEMENT avec le prompt généré, sans explication, sans introduction, sans commentaire. Le prompt doit être directement utilisable.`
        }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: `Anthropic API error: ${err}` });
    }

    const data = await response.json();
    const prompt = data.content[0].text;
    return res.status(200).json({ prompt });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
