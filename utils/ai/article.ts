import { openai } from './client';
import { createAdminClient } from '@/utils/supabase/admin';

export async function generateArticleContent(articleId: string) {
    console.log(`[AI-Job] Starting generation for article: ${articleId}`);

    // Use Admin Client for background jobs to avoid cookie/session expiry
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('[AI-Job] SUPABASE_SERVICE_ROLE_KEY is missing!');
        return;
    }
    const supabase = createAdminClient();

    // 1. Fetch Context
    const { data: article, error: fetchError } = await supabase
        .from('articles')
        .select(`
            *,
            keyword:keywords(*),
            business:businesses(*)
        `)
        .eq('id', articleId)
        .single();

    if (fetchError || !article) {
        console.error('[AI-Job] Failed to fetch article context:', fetchError);
        // Try to set status to failed if possible (requires simple client or raw query if we have id)
        await supabase.from('articles').update({ status: 'failed' }).eq('id', articleId);
        return;
    }

    // @ts-ignore 
    const keyword = article.keyword?.keyword;
    // @ts-ignore
    const business = article.business;

    console.log(`[AI-Job] Context loaded. Keyword: ${keyword}`);

    try {
        await supabase.from('articles').update({ status: 'generating' }).eq('id', articleId);

        // 2. Research & Outline
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

        console.log('[AI-Job] Sending prompt to OpenAI...');
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a professional Content Writer." }, { role: "user", content: prompt }],
            model: "gpt-5.2",
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(completion.choices[0].message.content || '{}');
        console.log('[AI-Job] OpenAI response received. Saving to DB...');

        // 3. Save
        const { error: updateError } = await supabase.from('articles').update({
            title: result.title || 'Untitled Article',
            content: result.content || result.content_md || '',
            status: 'completed'
        }).eq('id', articleId);

        if (updateError) {
            console.error('[AI-Job] DB Update Failed:', updateError);
        } else {
            console.log('[AI-Job] Article saved successfully.');
        }

    } catch (error) {
        console.error('[AI-Job] Article generation failed:', error);
        await supabase.from('articles').update({ status: 'failed' }).eq('id', articleId);
    }
}
