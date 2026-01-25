
import { z } from 'zod';

export const BlueprintSchema = z.object({
  primary_intent: z.enum(['informational', 'commercial', 'transactional']),
  article_type: z.enum(['guide', 'comparison', 'service-page', 'pillar', 'news']),
  user_expectations: z.array(z.string()),
  recommended_structure: z.object({
    h1: z.string(),
    sections: z.array(z.object({
      h2: z.string(),
      purpose: z.string(),
      search_intent_match: z.string()
    }))
  }),
  faq_candidates: z.array(z.string()),
  schema_recommendations: z.object({
    article: z.boolean(),
    faq: z.boolean(),
    howto: z.boolean()
  }),
  conversion_opportunities: z.array(z.string())
}).refine((data) => data.recommended_structure.sections.length >= 10, {
  message: "Blueprint must have at least 10 main sections to ensure article depth."
});

export type Blueprint = z.infer<typeof BlueprintSchema>;

export function buildBlueprintPrompt(args: {
  keyword: string;
  businessContext: string;
  goal: string;
  tone: string;
  targetCountry: string;
  languageName: string;
}) {
  const { keyword, businessContext, goal, tone, targetCountry, languageName } = args;

  return `
You are an expert SEO Strategist.
Goal: Design the perfect article blueprint to rank for the keyword: "${keyword}"
Context:
- Business: ${businessContext}
- Target Goal: ${goal}
- Tone: ${tone}
- Country: ${targetCountry}
- Language: ${languageName}

Task:
1. Classify the search intent (Informational, Commercial, Transactional).
2. Decide the best article type (Guide, Comparison, etc.).
3. created a structural blueprint (H1, Sections).
   - Rules: 
     - H1 must include the keyword.
     - Sections must logically flow to satisfy the intent.
     - NO intro/conclusion labels in H2s (use descriptive headers).
     - MANDATORY: Create a COMPREHENSIVE outline with at least 10-15 main sections (H2).
     - MANDATORY: Each main section MUST have 3-5 sub-points (H3) to ensure depth.
     - The structure must support a long-form article of 2500+ words.
4. Identify 3-5 FAQ candidates based on "People Also Ask".
5. Recommend schema types.

Output JSON ONLY matching this schema:
{
  "primary_intent": "...",
  "article_type": "...",
  "user_expectations": ["..."],
  "recommended_structure": {
    "h1": "...",
    "sections": [
      { "h2": "...", "purpose": "...", "search_intent_match": "..." }
    ]
  },
  "faq_candidates": ["..."],
  "schema_recommendations": { "article": true, "faq": boolean, "howto": boolean },
  "conversion_opportunities": ["..."]
}
`.trim();
}
