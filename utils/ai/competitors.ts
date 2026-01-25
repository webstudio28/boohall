import { openai } from './client';
import { createClient } from '@/utils/supabase/server';
import { getCompetitorModel } from '@/utils/ai/models';

export async function analyzeCompetitors(businessId: string) {
    const supabase = await createClient();
    const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();

    if (!business) throw new Error('Business not found');

    const prompt = `
    Identify up to 20 likely online competitors for this business.
    
    Business: ${business.website_url}
    Description: ${business.product_description}
    Country: ${business.target_country}
    
    Return JSON format:
    {
      "competitors": [
        { "domain": "example.com", "content_type": "Blog", "weakness": "Low update frequency" }
      ]
    }

    IMPORTANT: The "weakness" and "content_type" fields MUST be in the language "${business.language}".
    If the language is 'bg' (Bulgarian), write the weakness in Bulgarian.
  `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are an SEO Competitor Analyst." }, { role: "user", content: prompt }],
            model: getCompetitorModel(),
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(completion.choices[0].message.content || '{"competitors": []}');
        const competitors = result.competitors || [];

        // Save to DB
        if (competitors.length > 0) {
            await supabase.from('competitors').insert(
                competitors.map((c: any) => ({
                    business_id: businessId,
                    domain: c.domain,
                    content_type: c.content_type,
                    weakness_summary: c.weakness
                }))
            );
        }

        return competitors;
    } catch (error) {
        console.error('Competitor analysis failed:', error);
        return [];
    }
}
