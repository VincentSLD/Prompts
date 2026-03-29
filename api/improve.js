const SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'optimisation de prompts pour les modèles de langage (LLM). Ta mission est de prendre un prompt existant et de le rendre significativement meilleur.

## Principes d'amélioration :
1. **Clarté** : Reformule les passages ambigus, utilise un langage précis
2. **Structure** : Organise avec contexte, objectif, instructions, format de sortie
3. **Complétude** : Ajoute les éléments manquants (rôle, contraintes, exemples) sans dénaturer l'intention
4. **Efficacité** : Supprime le superflu, renforce ce qui compte
5. **Robustesse** : Ajoute des garde-fous contre les dérives et cas particuliers

## Ce que tu NE dois PAS faire :
- Changer l'objectif ou l'intention du prompt original
- Changer la langue du prompt
- Ajouter des éléments hors-sujet
- Rendre le prompt inutilement long ou complexe

## Règle absolue :
Réponds UNIQUEMENT avec le prompt amélioré. Pas d'introduction, pas d'explication, pas de commentaire, pas de comparaison avant/après. Le prompt amélioré doit être directement utilisable tel quel.`;

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
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Prompt à améliorer :
---
${prompt}
---`
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
