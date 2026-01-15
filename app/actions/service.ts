'use server';

import { createClient } from '@/utils/supabase/server';
import { openai } from '@/utils/ai/client';
import { getKeywordsData } from '@/utils/dataforseo';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// Step 1: Analyze
export async function analyzeService(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const name = formData.get('name') as string;

    // Generate Keywords (Text-based)
    const analysisPrompt = `
    Analyze this service description: "${name}".
    Identify the core service and generate 5-10 specific SEO keywords people might use to find this service.
    Return ONLY a JSON object with a "keywords" array of strings.
    `;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'user', content: analysisPrompt }
        ],
        response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content || '{"keywords": []}');
    const keywords: string[] = result.keywords || [];

    // Get DataForSEO Metrics
    let seoData: any[] = [];
    if (keywords.length > 0) {
        try {
            seoData = await getKeywordsData(keywords, 'US', 'en');
        } catch (error) {
            console.error('DataForSEO error:', error);
            seoData = keywords.map(k => ({ keyword: k, volume: 0, difficulty: 'Unknown' }));
        }
    }

    return {
        success: true,
        data: {
            name,
            keywords: seoData.length > 0 ? seoData : keywords.map(k => ({ keyword: k, volume: 0 })),
        }
    };
}

// Step 2: Create
export async function createServiceDescription(
    name: string,
    allKeywords: any[],
    selectedKeywords: any[]
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Language Support
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
    const languageName = locale === 'bg' ? 'Bulgarian' : 'English';

    // Description Generation
    const descriptionPrompt = `
    Write a compelling, SEO-optimized service description.
    
    Service Context: ${name}
    Target Keywords: ${selectedKeywords.map(k => k.keyword).join(', ')}
    
    Instructions:
    - Focus heavily on the target keywords.
    - Highlight benefits and professionalism.
    - Reference Language: ${languageName} (MUST WRITE IN THIS LANGUAGE)
    - Length: 2-3 paragraphs.
    `;

    const descriptionResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'user', content: descriptionPrompt }
        ],
    });

    const generatedDescription = descriptionResponse.choices[0].message.content;

    // Save
    const { error: dbError } = await supabase
        .from('service_descriptions')
        .insert({
            user_id: user.id,
            name,
            keywords: selectedKeywords,
            seo_data: allKeywords,
            description: generatedDescription
        });

    if (dbError) throw new Error('Failed to save service');

    revalidatePath('/service-description');
    return { success: true };
}
