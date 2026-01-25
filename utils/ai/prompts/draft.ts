
import { z } from 'zod';
import { Blueprint } from './blueprint';

export const DraftSchema = z.object({
    content_md: z.string(),
    author_info: z.object({
        name: z.string(),
        bio: z.string(),
        credentials: z.array(z.string())
    }).nullable(),
    cta_blocks: z.array(z.object({
        type: z.string(),
        placement: z.string(),
        message: z.string()
    }))
});

export type Draft = z.infer<typeof DraftSchema>;

export function buildDraftPrompt(args: {
    blueprint: Blueprint;
    keyword: string;
    businessContext: string;
    goal: string;
    tone: string;
    languageName: string;
    minWords: number;
    providedAuthorInfo?: { name: string; bio: string } | null;
}) {
    const { blueprint, keyword, businessContext, goal, tone, languageName, minWords, providedAuthorInfo } = args;

    const authorInstruction = providedAuthorInfo
        ? `
        STRICT AUTHOR PERSONA REQUIREMENT:
        You are writing as: ${providedAuthorInfo.name}
        Bio/Expertise: ${providedAuthorInfo.bio}
        
        - Write in the voice of this specific persona.
        - Leverage this expertise to add authority and unique insights.
        - The "author_info" in the output JSON MUST match this name and bio exactly.
        `
        : `
        - Do NOT create a specific author persona.
        - Write in a high-quality ${tone} tone representing the brand.
        - The "author_info" field in the output JSON must be NULL.
        `;

    return `
${authorInstruction}
You are an expert SEO Copywriter.
Goal: Write a long-form article based strictly on the provided Blueprint.

Context:
- Keyword: "${keyword}"
- Business: ${businessContext}
- Goal: ${goal}
- Tone: ${tone}
- Language: ${languageName} (MUST write in this language)
- Min Words: ${minWords}

Blueprint (Structure & Strategy):
${JSON.stringify(blueprint, null, 2)}

Instructions:
1. Write the full article in Markdown.
2. Follow the "Recommended Structure" exactly (H1, Sections).
3. Integrate the "User Expectations" content naturally.
4. Add the "Conversion Opportunities" (CTAs) where appropriate.
5. Use proper Markdown formatting (bold, italics, lists, tables).
6. WRITE EXTREMELY EXTENSIVELY:
   - This must be a deep-dive comprehensive guide (Target: 2500+ words).
   - FOR EACH H2 SECTION: Write at least 4-5 long paragraphs.
   - FOR EACH H3 SUBSECTION: Write at least 2 detailed paragraphs with examples.
   - Do NOT summarize. Do NOT be concise. Be verbose and detailed.
   - If the blueprint is short, EXPAND on each point significantly.
7. NO H1 in the content_md (we have it in metadata, but actually usually article body starts with H1).
   - WAIT: Standard is body has H1 at top. YES, include H1.
7. Include images using markdown syntax: ![Alt text](image_description)
8. Include internal/external links as anchors: [Link Text](http://...)

Output JSON ONLY matching this schema:
{
  "content_md": "...",
  "author_info": { "name": "...", "bio": "...", "credentials": ["..."] } OR null,
  "cta_blocks": [{ "type": "soft/hard", "placement": "...", "message": "..." }]
}
`.trim();
}
