'use server';

import { createClient } from '@/utils/supabase/server';
import { openai } from '@/utils/ai/client';
import { getKeywordsData } from '@/utils/dataforseo';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// Step 1: Analyze
export async function analyzeProduct(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const name = formData.get('name') as string;
    const imageFile = formData.get('image') as File;

    if (!imageFile) throw new Error('No image provided');

    // 1. Upload Image
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
        .from('product_images')
        .upload(fileName, buffer, { contentType: imageFile.type, upsert: false });

    if (uploadError) throw new Error('Failed to upload image');

    const { data: { publicUrl } } = supabase.storage
        .from('product_images')
        .getPublicUrl(fileName);

    // 2. Generate Keywords (Vision)
    const visionPrompt = `
    Analyze this product image and the following context: "${name}".
    Identify the product and generate 5-10 specific SEO keywords.
    Return ONLY a JSON object with a "keywords" array of strings.
    `;

    const visionResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: visionPrompt },
                    { type: 'image_url', image_url: { url: publicUrl } },
                ],
            },
        ],
        response_format: { type: 'json_object' },
    });

    const visionContent = visionResponse.choices[0].message.content;
    const keywordsResult = JSON.parse(visionContent || '{"keywords": []}');
    const keywords: string[] = keywordsResult.keywords || [];

    // 3. Get DataForSEO Metrics
    let seoData: any[] = [];
    if (keywords.length > 0) {
        try {
            seoData = await getKeywordsData(keywords, 'US', 'en');
        } catch (error) {
            console.error('DataForSEO error:', error);
            // Fallback: Use manual keywords with 0 volume
            seoData = keywords.map(k => ({ keyword: k, volume: 0, difficulty: 'Unknown' }));
        }
    }

    // Return data for Step 2
    return {
        success: true,
        data: {
            name,
            imageUrl: publicUrl,
            keywords: seoData.length > 0 ? seoData : keywords.map(k => ({ keyword: k, volume: 0 })),
        }
    };
}

// Step 2: Create
export async function createProductDescription(
    name: string,
    imageUrl: string,
    allKeywords: any[], // The full list we analyzed
    selectedKeywords: any[] // The ones user picked
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
    Write a compelling, SEO-optimized product description.
    
    Context: ${name}
    Target Keywords: ${selectedKeywords.map(k => k.keyword).join(', ')}
    
    Instructions:
    - Focus heavily on the target keywords.
    - Reference Language: ${languageName} (MUST WRITE IN THIS LANGUAGE)
    - Length: 2-3 paragraphs.
    `;

    const descriptionResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: descriptionPrompt },
                    { type: 'image_url', image_url: { url: imageUrl } },
                ],
            },
        ],
    });

    const generatedDescription = descriptionResponse.choices[0].message.content;

    // Save
    const { error: dbError } = await supabase
        .from('product_descriptions')
        .insert({
            user_id: user.id,
            name,
            image_url: imageUrl,
            keywords: selectedKeywords, // Store only selected ones? or all? Let's store selected for now as that's what relates to the text.
            seo_data: allKeywords, // Store full data for reference if needed
            description: generatedDescription
        });

    if (dbError) throw new Error('Failed to save product');

    revalidatePath('/product-description');
    return { success: true };
}
