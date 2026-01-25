import { openai } from './client';
import { createClient } from '@/utils/supabase/server';
import { getNicheModel } from '@/utils/ai/models';

export async function analyzeNiche(businessId: string) {
    const supabase = await createClient();
    const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();

    if (!business) throw new Error('Business not found');

    const prompt = `
    Analyze the following business for SEO strategy.
    
    URL: ${business.website_url}
    Type: ${business.business_type}
    Description: ${business.product_description}
    Target Country: ${business.target_country}
    Language: ${business.language}

    Provide a JSON output with:
    1. "summary": A concise definition of what the business actually does (2 sentences).
    2. "intent_mix": A string describing the balance of Transactional vs Informational intent suitable for this business.
    3. "angles": An array of 3 distinct content angles/topics that would rank well and drive customers.
    
    IMPORTANT: The output content for summary, intent_mix, and angles MUST be in the language "${business.language}".
    Output JSON only.
  `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are an expert SEO Strategist." }, { role: "user", content: prompt }],
            model: getNicheModel(),
            response_format: { type: "json_object" },
        });

        const analysis = JSON.parse(completion.choices[0].message.content || '{}');

        // Save to DB
        const { error } = await supabase
            .from('businesses')
            .update({ analysis })
            .eq('id', businessId);

        if (error) throw error;

        return analysis;
    } catch (error) {
        console.error('Niche analysis failed:', error);
        // Return mock data if AI fails or no key
        return {
            summary: "Analysis pending configuration.",
            intent_mix: "Unknown",
            angles: []
        };
    }
}
