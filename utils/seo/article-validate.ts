import { validateSeoMeta } from '@/utils/seo/validate';

export type ArticleValidationIssue = {
  code:
    | 'missing_title'
    | 'missing_content'
    | 'word_count_low'
    | 'missing_h1'
    | 'multiple_h1'
    | 'no_external_link'
    | 'missing_toc'
    | 'meta_invalid'
    | 'missing_schema'
    | 'missing_author_info'
    | 'missing_content_structure';
  message: string;
  details?: any;
};

function wordCount(text: string) {
  return text
    .replace(/[`*_>#-]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links -> visible text
    .split(/\s+/)
    .filter(Boolean).length;
}

function countH1(md: string) {
  // Count lines that start with "# " (not "##")
  return md.split('\n').filter((l) => /^#\s+/.test(l)).length;
}

function hasExternalLink(md: string) {
  // crude: https:// or http:// in a markdown link
  return /\[[^\]]+\]\(https?:\/\/[^)]+\)/i.test(md);
}

function hasToc(md: string) {
  // either a "Table of contents" heading or a list of anchor links
  if (/^##\s+(table of contents|toc)\b/im.test(md)) return true;
  if (/\[[^\]]+\]\(#[-a-z0-9]+\)/i.test(md)) return true;
  return false;
}

export function validateGeneratedArticle(result: any, opts?: { minWords?: number }) {
  const issues: ArticleValidationIssue[] = [];
  const minWords = opts?.minWords ?? 1500;

  if (!result?.title || typeof result.title !== 'string' || !result.title.trim()) {
    issues.push({ code: 'missing_title', message: 'Missing title.' });
  }

  const content = String(result?.content_md || '');
  let wc = 0; // Calculate word count at function scope
  if (!content.trim()) {
    issues.push({ code: 'missing_content', message: 'Missing content_md.' });
  } else {
    wc = wordCount(content);
    if (wc < minWords) {
      issues.push({ code: 'word_count_low', message: `Article too short (${wc} words). Must be >= ${minWords}.`, details: { wc, minWords } });
    }

    const h1Count = countH1(content);
    if (h1Count === 0) issues.push({ code: 'missing_h1', message: 'Missing H1 (# Title).' });
    if (h1Count > 1) issues.push({ code: 'multiple_h1', message: `Multiple H1 found (${h1Count}). Must be exactly 1.` });

    if (!hasExternalLink(content)) issues.push({ code: 'no_external_link', message: 'No outbound (http/https) link found for citations.' });

    // TOC required for long content (we enforce because minWords is high)
    if (wc >= 1200 && !hasToc(content)) issues.push({ code: 'missing_toc', message: 'Missing table of contents with anchor links.' });
  }

  const meta = result?.seo_meta;
  const metaValidation = meta ? validateSeoMeta(meta) : null;
  if (!metaValidation) {
    issues.push({ code: 'meta_invalid', message: 'Missing seo_meta.' });
  } else {
    const bad = [metaValidation.metaTitle, metaValidation.metaDescription, metaValidation.slug].filter((v) => v.status === 'fail');
    if (bad.length) {
      issues.push({
        code: 'meta_invalid',
        message: 'Meta fields exceed hard limits.',
        details: bad,
      });
    }
  }

  // Check schema markup
  if (!result?.schema_markup || typeof result.schema_markup !== 'object') {
    issues.push({ code: 'missing_schema', message: 'Missing schema_markup object.' });
  } else {
    const sm = result.schema_markup;
    if (!sm.article || typeof sm.article !== 'object') {
      issues.push({ code: 'missing_schema', message: 'Missing schema_markup.article (Article/BlogPosting schema).' });
    }
    if (!sm.author || typeof sm.author !== 'object') {
      issues.push({ code: 'missing_schema', message: 'Missing schema_markup.author (Person schema).' });
    }
    if (!sm.organization || typeof sm.organization !== 'object') {
      issues.push({ code: 'missing_schema', message: 'Missing schema_markup.organization (Organization schema).' });
    }
  }

  // Check author info
  if (!result?.author_info || typeof result.author_info !== 'object') {
    issues.push({ code: 'missing_author_info', message: 'Missing author_info object.' });
  } else {
    const ai = result.author_info;
    if (!ai.name || typeof ai.name !== 'string' || !ai.name.trim()) {
      issues.push({ code: 'missing_author_info', message: 'Missing author_info.name.' });
    }
    if (!ai.bio || typeof ai.bio !== 'string' || !ai.bio.trim()) {
      issues.push({ code: 'missing_author_info', message: 'Missing author_info.bio.' });
    }
  }

  // Check content structure
  if (!result?.content_structure || typeof result.content_structure !== 'object') {
    issues.push({ code: 'missing_content_structure', message: 'Missing content_structure object.' });
  } else {
    const cs = result.content_structure;
    if (cs.h1_count !== 1) {
      issues.push({ code: 'multiple_h1', message: `content_structure.h1_count should be 1, got ${cs.h1_count}.` });
    }
    if (!cs.has_author_bio) {
      issues.push({ code: 'missing_content_structure', message: 'content_structure.has_author_bio should be true (author bio section required).' });
    }
    if (!Array.isArray(cs.external_links) || cs.external_links.length < 2) {
      issues.push({ code: 'no_external_link', message: 'Need at least 2 external links (http/https) for citations.' });
    }
    if (wc >= 1200 && !cs.has_toc) {
      issues.push({ code: 'missing_toc', message: 'Table of contents required for long content (≥1200 words).' });
    }
  }

  return { issues };
}


