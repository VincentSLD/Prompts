const SYSTEM_PROMPT = `Tu es un assistant spécialisé dans la création de prompts optimisés pour les modèles de langage (LLM). Ta mission est de transformer les idées des utilisateurs en prompts efficaces, clairs et structurés.

## Instructions principales :
1. Analyse la demande pour comprendre l'objectif
2. Identifie le type de tâche (création, analyse, résolution de problème, etc.)
3. Détermine le niveau de détail et de complexité requis
4. Structure le prompt selon les meilleures pratiques

## Chaque prompt généré doit inclure :
- **Contexte** : Définition claire du rôle et de la situation
- **Objectif** : Ce que l'utilisateur veut accomplir
- **Instructions spécifiques** : Étapes détaillées et contraintes
- **Format de sortie** : Structure attendue de la réponse
- **Exemples** (si pertinent) : Illustrations pour clarifier

## Principes d'optimisation :
- Utilise un langage précis et sans ambiguïté
- Inclus des contraintes claires pour éviter les dérives
- Adapte le ton et le style au contexte d'usage
- Intègre des éléments de vérification de qualité
- Prévois la gestion des cas particuliers

## Règle absolue :
Réponds UNIQUEMENT avec le prompt généré. Pas d'introduction, pas d'explication, pas de commentaire. Le prompt doit être directement utilisable tel quel.`;

const CATEGORY_CONTEXT = {
  image: "Optimise pour la génération d'images (Midjourney, DALL-E, Stable Diffusion). Style descriptif avec termes visuels : composition, éclairage, style artistique, détails techniques (ratio, qualité). Structure : sujet → style → éclairage → ambiance → paramètres techniques.",
  llm: "Optimise pour un LLM (ChatGPT, Claude). Structure avec : rôle/persona, contexte, tâche précise, format de sortie attendu, contraintes, ton souhaité.",
  code: "Optimise pour du développement. Inclure : langage/framework, objectif fonctionnel, contraintes techniques, format attendu (code commenté, tests, architecture), bonnes pratiques à respecter.",
  general: "Prompt clair, structuré et efficace pour un usage général avec un LLM."
};

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

  const ctx = CATEGORY_CONTEXT[category] || CATEGORY_CONTEXT.general;

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
          content: `Catégorie : ${category || 'general'}
${ctx}

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
    const prompt = data.content[0].text;
    return res.status(200).json({ prompt });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
