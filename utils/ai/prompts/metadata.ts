
import { z } from 'zod';
import { SEO_LIMITS } from '@/utils/seo/limits';

export const MetadataSchema = z.object({
  seo_meta: z.object({
    title: z.string().max(70),
    description: z.string().max(165),
    slug: z.string(),
    title_alternatives: z.array(z.string()),
    description_alternatives: z.array(z.string())
  }),
  schema_markup: z.object({
    article: z.string().describe("JSON-LD Article object as a string"),
    author: z.string().describe("JSON-LD Person object as a string"),
    organization: z.string().describe("JSON-LD Organization object as a string"),
    breadcrumb: z.string().describe("JSON-LD BreadcrumbList object as a string"),
    faq: z.string().nullable().optional().describe("JSON-LD FAQPage object as a string (if applicable)"),
    howto: z.string().nullable().optional().describe("JSON-LD HowTo object as a string (if applicable)")
  }),
  content_structure_stats: z.object({
    h1_count: z.number(),
    h2_count: z.number(),
    images_count: z.number(),
    links_count: z.number(),
    toc_found: z.boolean()
  })
});

export type MetadataOutput = z.infer<typeof MetadataSchema>;

export function buildMetadataPrompt(args: {
  contentMd: string;
  keyword: string;
  businessContext: string;
  languageName: string;
}) {
  const { contentMd, keyword, businessContext, languageName } = args;

  return `
You are an expert SEO Technical Specialist.
Goal: Generate perfect metadata and Schema.org JSON-LD for the article below.

Context:
- Keyword: "${keyword}"
- Language: ${languageName}
- Article Content (Excerpt):
${contentMd.slice(0, 3000)}... (truncated for context)

Rules:
1. Generate valid JSON-LD for: Article, Author, Organization, Breadcrumb.
2. If the content implies FAQ or HowTo, generate those schema types too.
3. Create a compelling Meta Title (50-60 chars) and Description (140-160 chars).
4. Analyze the content structure (H1s, H2s, images, links) and report stats.
5. CRITICAL: For the "schema_markup" fields, return the JSON-LD objects as STRINGIFIED JSON. 
   - Example: "article": "{\\"@context\\": \\"https://schema.org\\", \\"@type\\": \\"Article\\"...}"

Output JSON ONLY matching this schema:
{
  "seo_meta": {
    "title": "...",
    "description": "...",
    "slug": "...",
    "title_alternatives": ["..."],
    "description_alternatives": ["..."]
  },
  "schema_markup": {
    "article": "stringified_json_ld_object", 
    "author": "stringified_json_ld_object", 
    "organization": "stringified_json_ld_object", 
    "breadcrumb": "stringified_json_ld_object",
    "faq": "stringified_json_ld_object" (or null),
    "howto": "stringified_json_ld_object" (or null)
  },
  "content_structure_stats": {
    "h1_count": 0,
    "h2_count": 0,
    "images_count": 0,
    "links_count": 0,
    "toc_found": boolean
  }
}
`.trim();
}
