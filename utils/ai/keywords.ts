import { openai } from './client';
import { createClient } from '@/utils/supabase/server';
import { getKeywordModel } from '@/utils/ai/models';

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
    volume: number | null;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    intent: 'Blog' | 'Landing' | 'Mixed';
}

async function generateAdjacentKeywords(args: {
    businessDescription: string | null;
    language: 'bg' | 'en';
    targetCountry: string | null;
    exclude: string[];
    count: number;
}): Promise<string[]> {
    const { businessDescription, language, targetCountry, exclude, count } = args;

    const prompt = `
You generate SEO keywords that actually have search demand.

Business: ${businessDescription || ''}
Language: ${language}
Target country: ${targetCountry || ''}

Problem: the niche phrasing has near-zero search volume. Generate ${count} CLOSE alternatives that people *actually* search for.
Rules:
- Keep it close to the business, but broaden terminology (synonyms, more common phrasing, category terms).
- Avoid luxury/premium-only wording if it reduces demand.
- Avoid duplicates and avoid anything in the exclude list.
- If language is bg: MUST be Bulgarian Cyrillic.
- Return ONLY JSON: { "keywords": string[] }

Exclude list (case-insensitive): ${JSON.stringify(exclude.slice(0, 50))}
`.trim();

    const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: "You are an SEO keyword researcher." }, { role: "user", content: prompt }],
        model: getKeywordModel(),
        response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"keywords": []}');
    const list = Array.isArray(result.keywords) ? result.keywords : [];
    return list.map((k: any) => String(k || '').trim()).filter(Boolean);
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
    Generate 5 realistic SEO keywords only for this business.
    
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
            model: getKeywordModel(),
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
    let debugExtra: string[] = [];

    // Cost controls
    const MAX_ADJACENT_BG = 3;
    const MAX_ADJACENT_LATIN = 3;

    try {
        console.log('Using DataForSEO for real keyword metrics...');

        // Map country and language
        // business.language is likely 'en' or 'bg'
        // business.target_country is likely a country name or code. We need to be careful.
        // Based on existing code: const countryCode = business.language === 'bg' ? 'BG' : 'US';
        const countryCode = business.language === 'bg' ? 'BG' : 'US';
        const languageCode = business.language || 'en';

        // Expand list with transliterations if Bulgarian (5 BG + 5 Latin max)
        const uniqueSeeds = Array.from(new Set(keywordsList.map(k => String(k || '').trim()).filter(Boolean)));
        const bgSeeds = uniqueSeeds.slice(0, 5);

        expandedKeywords = [...bgSeeds];
        if (business.language === 'bg') {
            const latinList: string[] = [];
            bgSeeds.forEach(kw => {
                const latin = transliterateBG(kw);
                if (latin && latin !== kw) {
                    latinList.push(latin);
                }
            });

            const uniqueLatin = Array.from(new Set(latinList));
            expandedKeywords.push(...uniqueLatin.slice(0, 5));
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
                    volume: typeof item.volume === 'number' ? item.volume : 0,
                    difficulty: item.difficulty || 'Medium',
                    intent: 'Mixed',
                    isValid: true // Verified by DataForSEO
                } as KeywordData & { isValid: boolean };
            } else {
                // Unknown (not returned by API) -> keep, but do not mark as checked
                return {
                    keyword: seedKeyword,
                    volume: null,
                    difficulty: 'Medium',
                    intent: 'Mixed',
                    isValid: false
                } as KeywordData & { isValid: boolean };
            }
        });

        console.log(`Keywords prepared: ${keywordData.length} (BG+Latin cap applied).`);

        // If we have almost no demand, broaden automatically (still close to niche).
        const nonZero = keywordData.filter((k: any) => k.isValid && (k.volume ?? 0) > 0).length;
        const checked = keywordData.filter((k: any) => k.isValid).length;
        const lowDemand = checked > 0 && nonZero <= 1; // <= 1 keyword with demand is a signal

        if (lowDemand) {
            console.log(`[Keywords] Low demand detected (nonZero=${nonZero}/${checked}). Generating adjacent keywords...`);

            const { data: existing } = await supabase
                .from('keywords')
                .select('keyword')
                .eq('business_id', businessId);

            const exclude = Array.from(new Set([
                ...expandedKeywords,
                ...(existing || []).map((r: any) => r.keyword),
            ].map((x: any) => String(x || '').trim()).filter(Boolean)));

            const adjacent = await generateAdjacentKeywords({
                businessDescription: business.product_description,
                language: business.language,
                targetCountry: business.target_country,
                exclude,
                count: MAX_ADJACENT_BG,
            });

            const adjUnique = Array.from(new Set(adjacent));
            const adjBg = adjUnique.slice(0, MAX_ADJACENT_BG);
            const adjExpanded: string[] = [...adjBg];

            if (business.language === 'bg') {
                const latinList: string[] = [];
                adjBg.forEach((kw: string) => {
                    const latin = transliterateBG(kw);
                    if (latin && latin !== kw) latinList.push(latin);
                });
                const adjLatin = Array.from(new Set(latinList)).slice(0, MAX_ADJACENT_LATIN);
                adjExpanded.push(...adjLatin);
            }

            debugExtra = adjExpanded;

            const adjResults = await getKeywordsData(adjExpanded, countryCode, languageCode);
            const adjMap = new Map(adjResults.map((item: any) => [String(item.keyword || '').toLowerCase(), item]));

            const adjData = adjExpanded.map((seedKeyword) => {
                const item = adjMap.get(String(seedKeyword).toLowerCase());
                if (item) {
                    return {
                        keyword: item.keyword,
                        volume: typeof item.volume === 'number' ? item.volume : 0,
                        difficulty: item.difficulty || 'Medium',
                        intent: 'Mixed',
                        isValid: true
                    } as KeywordData & { isValid: boolean };
                }
                return {
                    keyword: seedKeyword,
                    volume: null,
                    difficulty: 'Medium',
                    intent: 'Mixed',
                    isValid: false
                } as KeywordData & { isValid: boolean };
            });

            keywordData = [...keywordData, ...adjData];
            console.log(`[Keywords] Added adjacent set: +${adjData.length}. Total now: ${keywordData.length}.`);
        }

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
            model: getKeywordModel(),
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
        // Avoid duplicates (case-insensitive) and keep existing winners/zeros.
        const { data: existing } = await supabase
            .from('keywords')
            .select('keyword')
            .eq('business_id', businessId);

        const existingSet = new Set((existing || []).map((r: any) => String(r.keyword || '').toLowerCase()));
        const now = new Date().toISOString();

        const rows = keywordData
            .filter((k: any) => !existingSet.has(String(k.keyword || '').toLowerCase()))
            .map((k: any) => ({
                business_id: businessId,
                keyword: k.keyword,
                volume: k.isValid ? (k.volume ?? 0) : null,
                difficulty: k.difficulty,
                intent: k.intent,
                is_selected: false,
                source: k.isValid ? 'dataforseo' : 'ai',
                last_checked_at: k.isValid ? now : null,
                do_not_retry: k.isValid && (k.volume ?? 0) === 0,
            }));

        if (rows.length > 0) {
            await supabase.from('keywords').insert(rows);
        }
    }

    return {
        keywords: keywordData,
        debugExpandedList: [...(expandedKeywords || keywordsList), ...debugExtra]
    };
}
