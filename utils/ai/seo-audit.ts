import { SEO_LIMITS } from '@/utils/seo/limits';

export type SeoAuditStatus = 'pass' | 'warn' | 'fail' | 'na';

export type SeoAuditItem = {
  id: string;
  title: string;
  status: SeoAuditStatus;
  notes?: string;
  how_to_fix?: string;
};

export type SeoAuditSection = {
  id: string;
  title: string;
  items: SeoAuditItem[];
};

export type SeoMeta = {
  title: string;
  description: string;
  slug: string;
  canonical_url?: string;
  title_alternatives?: string[];
  description_alternatives?: string[];
};

export type SeoAuditResult = {
  meta: SeoMeta;
  sections: SeoAuditSection[];
};

export function buildSeoAuditPrompt(args: {
  pageType: 'article' | 'product' | 'service';
  primaryKeyword: string;
  languageName: string;
  businessContext?: string;
  contentMd: string;
}) {
  const { pageType, primaryKeyword, languageName, businessContext, contentMd } = args;

  // Keep this prompt strict + UI-friendly (short strings per item).
  return `
You are an expert SEO auditor and editor.

Goal: evaluate the provided page content against a strict SEO checklist and propose compliant meta tags.

Constraints:
- Output MUST be valid JSON only (no markdown, no commentary).
- Keep every "notes" and "how_to_fix" very short (1-2 sentences max).
- Status must be one of: "pass" | "warn" | "fail" | "na".
- If something cannot be determined from the content, use "na" and explain briefly.

Page:
- Type: ${pageType}
- Primary keyword: ${primaryKeyword}
- Language: ${languageName}
${businessContext ? `- Business context: ${businessContext}` : ''}

Meta rules (HARD MAXES):
- meta.title max ${SEO_LIMITS.metaTitle.hardMax} chars (recommended ${SEO_LIMITS.metaTitle.recommendedMin}-${SEO_LIMITS.metaTitle.recommendedMax})
- meta.description max ${SEO_LIMITS.metaDescription.hardMax} chars (recommended ${SEO_LIMITS.metaDescription.recommendedMin}-${SEO_LIMITS.metaDescription.recommendedMax})
- meta.slug max ${SEO_LIMITS.urlSlug.hardMax} chars

If you cannot fit the limits, you MUST provide shorter alternatives in:
- meta.title_alternatives (3 options, each <= max)
- meta.description_alternatives (3 options, each <= max)

Return JSON with EXACT shape:
{
  "meta": {
    "title": string,
    "description": string,
    "slug": string,
    "canonical_url": string (optional),
    "title_alternatives": string[],
    "description_alternatives": string[]
  },
  "sections": [
    {
      "id": "content-semantic-depth",
      "title": "Content & Semantic Depth",
      "items": [
        { "id": "primary-keyword-targeting", "title": "Primary keyword targeting", "status": "pass|warn|fail|na", "notes": "...", "how_to_fix": "..." }
      ]
    }
  ]
}

Checklist sections & items to include (ALL):
1) Content & Semantic Depth
- Primary keyword targeting
- One clear main intent per page
- Semantic variants used naturally
- Search intent alignment (Informational/Commercial/Transactional/Navigational)
- Topical completeness
- Entity coverage
- LSI & NLP keywords
- Original insights
- Content freshness
- Clear structure
- Readability
- Multimedia enrichment
- Content length
- Unique content

2) Headings & On-Page Structure
- Single H1
- Hierarchical headings (H2→H3→H4 without skipping)
- Descriptive headings
- Keyword-optimized headings
- Table of contents (if long content)

3) Meta & SERP Optimization
- Meta title length + CTR
- Meta description length + CTA
- Clean URL
- Breadcrumbs in SERP
- Date handling

4) Schema & Structured Data
- Article/BlogPosting schema (if applicable)
- Author schema
- Organization/Publisher schema
- BreadcrumbList schema
- FAQ schema (if applicable)
- HowTo schema (if applicable)
- Speakable schema (optional)
- ImageObject schema
- MainEntityOfPage

5) Internal Linking & Site Architecture
- Contextual internal links
- Topic cluster support
- No orphan pages
- Descriptive anchor text
- Logical crawl depth

6) External Linking & Trust Signals
- Outbound links to authoritative sources
- Correct rel attributes
- Citations for data/claims
- No broken external links

7) E-E-A-T
- Author bio
- Author page
- Editorial policy page
- Fact-checking signals
- Contact & About pages
- Company transparency
- Reviews/mentions support

8) UX & Engagement Signals
- Fast perceived load
- Clear typography
- Mobile-first layout
- Comfortable line length/white space
- Sticky TOC (optional)
- Scroll depth optimization
- Clear next actions (related/CTA)
- No intrusive popups
- Accessibility basics

9) Core Web Vitals & Performance
- LCP
- CLS
- INP
- Optimized images
- Font optimization
- Minimal JS
- Server response optimization

10) Image & Media SEO
- Descriptive filenames
- Alt text
- Captions when useful
- Compression
- Video schema (if video exists)

11) Technical SEO Hygiene
- Indexable page (no accidental noindex)
- Canonical tag
- hreflang (if applicable)
- HTML validity
- No mixed content
- No render-blocking resources
- Clean DOM structure

12) Conversion & Business Layer
- Contextual CTAs
- Lead magnets / email capture (non-intrusive)
- Trust badges
- Clear value proposition
- Tracking (GA4/GSC/events)

Now audit the content below:
CONTENT (Markdown):
${contentMd}
`.trim();
}


