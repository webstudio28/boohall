import { SEO_LIMITS } from '@/utils/seo/limits';

export function buildArticleMasterPrompt(args: {
  keyword: string;
  businessDescription: string;
  targetCountry?: string | null;
  goal?: string | null;
  tone?: string | null;
  languageCode: 'bg' | 'en';
  rulesText: string;
  minWords: number;
}) {
  const { keyword, businessDescription, targetCountry, goal, tone, languageCode, rulesText, minWords } = args;

  const languageName = languageCode === 'bg' ? 'Bulgarian' : 'English';

  return `
You are an expert SEO writer AND expert prompt-follower.

Your job: write ONE article that fully complies with the SEO spec below.
You must produce content that already satisfies the spec (we validate it).

### Context
- Primary keyword: ${keyword}
- Business description: ${businessDescription}
- Target country: ${targetCountry || ''}
- Goal: ${goal || ''}
- Tone: ${tone || ''}
- Language: ${languageName} (MUST write in this language)

### Hard requirements (validated)
- Output MUST be JSON ONLY (no markdown wrapper).
- content_md must be at least ${minWords} words (no filler).
- Exactly ONE H1 at the top of content_md.
- Include a Table of Contents with anchor links (because the content is long).
- Include at least 1 authoritative outbound link (http/https) for a citation.
- Meta limits:
  - seo_meta.title max ${SEO_LIMITS.metaTitle.hardMax} chars
  - seo_meta.description max ${SEO_LIMITS.metaDescription.hardMax} chars
  - seo_meta.slug max ${SEO_LIMITS.urlSlug.hardMax} chars
- If meta is hard to fit, provide 3 shorter alternatives for title/description (within limits).

### SEO spec (must cover ALL points)
${rulesText}

### Output JSON shape (EXACT - must include ALL fields)
{
  "title": string,
  "seo_meta": {
    "title": string (50-60 chars),
    "description": string (140-160 chars),
    "slug": string (max 75 chars, URL-safe),
    "title_alternatives": string[] (3 alternatives, each ≤60 chars),
    "description_alternatives": string[] (3 alternatives, each ≤160 chars)
  },
  "content_md": string (full article markdown, ≥${minWords} words),
  "schema_markup": {
    "article": object (JSON-LD Article/BlogPosting schema),
    "author": object (JSON-LD Person schema),
    "organization": object (JSON-LD Organization schema),
    "breadcrumb": object (JSON-LD BreadcrumbList schema),
    "faq": object | null (JSON-LD FAQPage schema if applicable),
    "howto": object | null (JSON-LD HowTo schema if applicable)
  },
  "content_structure": {
    "has_toc": boolean (true for long content),
    "h1_count": number (must be 1),
    "h2_count": number,
    "h3_count": number,
    "has_author_bio": boolean (true if author bio section exists),
    "external_links": string[] (array of http/https URLs cited),
    "internal_links": string[] (array of anchor links to other pages/topics),
    "images_with_alt": number (count of images with alt text),
    "has_table_or_list": boolean (true if table or structured list exists),
    "has_cta": boolean (true if CTA blocks exist)
  },
  "author_info": {
    "name": string,
    "bio": string (short bio paragraph),
    "credentials": string[] (array of credentials/experience points)
  }
}

### Writing rules (MUST apply ALL from spec)
1. Content & Semantic Depth:
   - Use primary keyword naturally (exact + variants).
   - Align with search intent (${goal || 'Informational'}).
   - Cover topic end-to-end (answer all sub-questions).
   - Mention relevant entities (people, brands, locations).
   - Use LSI/NLP keywords contextually.
   - Include original insights (data, opinions, examples).
   - Short paragraphs, active voice, clear explanations.

2. Headings & Structure:
   - Exactly ONE H1 (contains primary keyword naturally).
   - Hierarchical H2 → H3 → H4 (no skipping).
   - Descriptive headings (not vague like "More info").
   - Table of Contents with anchor links (#section-name) for long content.

3. Links:
   - At least 2-3 authoritative outbound links (http/https) for citations.
   - Include internal links (anchor links like [link text](#section) or [topic](/related-page)).
   - Descriptive anchor text (not "click here").

4. Author & E-E-A-T:
   - Include author bio section at the end with name, credentials, experience.
   - Show expertise/authority in the content.
   - Cite sources for claims/data.

5. Images & Media:
   - Mention/reference images with descriptive alt text (format: ![descriptive alt text](image.jpg)).
   - Include at least 1-2 image references in content.
   - Use tables/lists where helpful.

6. Schema Markup:
   - Generate valid JSON-LD for Article/BlogPosting (with headline, datePublished, author, publisher).
   - Include Person schema for author.
   - Include Organization schema for publisher.
   - Include BreadcrumbList schema.
   - Add FAQ/HowTo schema if content matches.

7. CTAs & Conversion:
   - Include 1-2 contextual CTA blocks (non-intrusive).
   - Clear value proposition in meta description.

Now produce the complete JSON with ALL fields filled.
`.trim();
}


