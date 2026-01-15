import { openai } from './client';
import { createClient } from '@/utils/supabase/server';

// Helper for transliteration (Bulgarian Standard)
function transliterateBG(text: string): string {
    const map: Record<string, string> = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
        'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
        'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sht', 'ъ': 'a', 'ь': 'y',
        'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ж': 'Zh',
        'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
        'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F',
        'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sht', 'Ъ': 'A', 'Ь': 'Y',
        'Ю': 'Yu', 'Я': 'Ya'
    };
    return text.split('').map(char => map[char] || char).join('');
}

// Interface for keyword data
interface KeywordData {
    keyword: string;
    volume: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    intent: 'Blog' | 'Landing' | 'Mixed';
}

export async function generateKeywords(businessId: string) {
    const supabase = await createClient();
    const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();

    if (!business) throw new Error('Business not found');

    // TODO: Integrate real Apify client here
    // For MVP without Apify key, we use AI to "estimate" or suggest keywords
    // In a real production scenario, this would call an Apify Actor

    // Step 1: Generate Seed Keywords using OpenAI
    // We ask AI for just the keyword strings now, as we'll get metrics from Apify
    const promptSeed = `
    Generate 10 realistic SEO keywords only for this business.
    
    Business: ${business.product_description}
    Language: ${business.language}
    Target Country: ${business.target_country}
    
    Return JSON format:
    {
      "keywords": ["keyword 1", "keyword 2", ...]
    }

    IMPORTANT: The keywords must be in the language "${business.language}".
    If language is 'bg', the keywords MUST be in Cyrillic/Bulgarian.
  `;

    let keywordsList: string[] = [];
    let expandedKeywords: string[] = [];

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are an SEO Keyword Researcher." }, { role: "user", content: promptSeed }],
            model: "gpt-5.2",
            response_format: { type: "json_object" },
        });
        const result = JSON.parse(completion.choices[0].message.content || '{"keywords": []}');
        keywordsList = result.keywords || [];
    } catch (e) {
        console.error('AI Seed generation failed', e);
        return [];
    }

    if (keywordsList.length === 0) return [];

    // Step 2: Fetch Metrics (Real using DataForSEO)
    const { getKeywordsData } = await import('@/utils/dataforseo');

    let keywordData: KeywordData[] = [];

    try {
        console.log('Using DataForSEO for real keyword metrics...');

        // Map country and language
        // business.language is likely 'en' or 'bg'
        // business.target_country is likely a country name or code. We need to be careful.
        // Based on existing code: const countryCode = business.language === 'bg' ? 'BG' : 'US';
        const countryCode = business.language === 'bg' ? 'BG' : 'US';
        const languageCode = business.language || 'en';

        // Expand list with transliterations if Bulgarian
        expandedKeywords = [...keywordsList];
        if (business.language === 'bg') {
            keywordsList.forEach(kw => {
                const latin = transliterateBG(kw);
                if (latin !== kw) {
                    expandedKeywords.push(latin);
                }
            });
        }

        const results = await getKeywordsData(expandedKeywords, countryCode, languageCode);

        // Create a map of results for easy lookup
        const resultsMap = new Map(results.map((item: any) => [item.keyword.toLowerCase(), item]));

        // Iterate over the expanded list
        keywordData = expandedKeywords.map((seedKeyword) => {
            const item = resultsMap.get(seedKeyword.toLowerCase());

            if (item) {
                return {
                    keyword: item.keyword, // Exact keyword from API
                    volume: item.volume || 0,
                    difficulty: item.difficulty || 'Medium',
                    intent: 'Mixed'
                };
            } else {
                // Return placeholder with 0 volume, will be filtered out
                return {
                    keyword: seedKeyword,
                    volume: 0,
                    difficulty: 'Medium',
                    intent: 'Mixed'
                };
            }
        });

        // Filter out zero volume keywords as requested
        const beforeFilter = keywordData.length;
        keywordData = keywordData.filter(k => k.volume > 0);
        console.log(`Keywords Filtered: ${beforeFilter} -> ${keywordData.length}. removed ${beforeFilter - keywordData.length} zero-volume keywords.`);

    } catch (error) {
        console.error('DataForSEO failed, falling back to AI.', error);
    }

    // Step 3: Fallback / Intent Classification if Apify worked but didn't give Intent, OR if Apify failed completely.
    // If Apify failed (keywordData empty), run the old "AI Estimates" logic.
    // If Apify succeeded, we might just need to fill in "Intent".

    if (keywordData.length === 0) {
        console.log('Using AI for estimated metrics...');
        const promptEstimate = `
        Estimate SEO metrics for these keywords for a business in ${business.target_country}.
        
        Keywords: ${JSON.stringify(keywordsList)}
        
        Return JSON format:
        {
          "keywords": [
            { "keyword": "...", "volume": 1200, "difficulty": "Medium", "intent": "Blog" }
          ]
        }
        `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are an SEO Strategist." }, { role: "user", content: promptEstimate }],
            model: "gpt-5.2",
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(completion.choices[0].message.content || '{"keywords": []}');
        keywordData = result.keywords || [];
    } else {
        // We have Apify data, but maybe need Intent?
        // Let's do a quick "Classify Intent" pass if needed, or just let the user change it. For now, we leave 'Mixed' or trust simple heuristics.
        // Or we can ask AI to classify them quickly.
    }

    // Save to DB
    if (keywordData.length > 0) {
        // existing insert logic
        await supabase.from('keywords').insert(
            keywordData.map(k => ({
                business_id: businessId,
                keyword: k.keyword,
                volume: k.volume,
                difficulty: k.difficulty,
                intent: k.intent,
                is_selected: false
            }))
        );
    }

    return {
        keywords: keywordData,
        debugExpandedList: expandedKeywords || keywordsList
    };
}
