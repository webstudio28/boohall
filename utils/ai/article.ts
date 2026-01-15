import { openai } from './client';
import { createClient } from '@/utils/supabase/server';

export async function generateArticleContent(articleId: string) {
    const supabase = await createClient();

    // 1. Fetch Context - Adjust query to match actual schema relations
    // Using `keyword_id` relation if setup, otherwise we might need manual fetch
    // Assuming Supabase infers `keywords` relation from `keyword_id` FK.
    const { data: article } = await supabase
        .from('articles')
        .select(`
            *,
            keyword:keywords(*),
            business:businesses(*)
        `)
        .eq('id', articleId)
        .single();

    if (!article) return;

    // @ts-ignore 
    const keyword = article.keyword?.keyword;
    // @ts-ignore
    const business = article.business;

    // Remove status update since column doesn't exist in new schema
    // await supabase.from('articles').update({ status: 'generating' }).eq('id', articleId);

    try {
        // 2. Research & Outline (Combined for speed)
        const prompt = `
      You are an expert SEO Writer.
      Write a comprehensive SEO article for:
      
      Topic/Keyword: ${keyword}
      Business: ${business.product_description}
      Target Audience: ${business.target_country}
      Goal: ${article.goal}
      Tone: ${article.tone}
      Language: ${business.language} (IMPORTANT: Write in this language)
      
      First, create an H1 title.
      Then write the full article in Markdown.
      Use H2 and H3 for structure.
      Include a short introduction and conclusion.
      Focus on data and helpful content.
      
      Return JSON format:
      {
        "title": "...",
        "content": "# Title\n\nIntroduction..."
      }
    `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a professional Content Writer." }, { role: "user", content: prompt }],
            model: "gpt-5.2", // Use GPT-5.2 for best quality
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(completion.choices[0].message.content || '{}');

        // 3. Save
        await supabase.from('articles').update({
            title: result.title || 'Untitled Article',
            content: result.content || result.content_md || '', // adaptation
            // status: 'completed', // Not in schema
        }).eq('id', articleId);

    } catch (error) {
        console.error('Article generation failed:', error);
        // await supabase.from('articles').update({ status: 'draft' }).eq('id', articleId);
    }
}
