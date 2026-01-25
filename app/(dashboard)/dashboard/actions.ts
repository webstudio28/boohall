'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper to getting authenticated business
const getBusiness = async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (!business) throw new Error('Business not found')
    return business
}

export async function regenerateNiche() {
    try {
        const business = await getBusiness()
        const { analyzeNiche } = await import('@/utils/ai/niche')
        await analyzeNiche(business.id)
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Niche regeneration failed:', error)
        return { error: 'Failed to regenerate niche analysis' }
    }
}

export async function regenerateCompetitors() {
    try {
        const business = await getBusiness()
        const supabase = await createClient()
        // Clear existing competitors to get fresh list
        await supabase.from('competitors').delete().eq('business_id', business.id)

        const { analyzeCompetitors } = await import('@/utils/ai/competitors')
        await analyzeCompetitors(business.id)
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Competitor regeneration failed:', error)
        return { error: 'Failed to regenerate competitors' }
    }
}

export async function regenerateKeywords() {
    try {
        console.log('Refreshing keywords (non-destructive)...');
        const business = await getBusiness()
        const supabase = await createClient()

        // 1) Generate NEW keywords (5 BG + 5 Latin) and insert only non-duplicates
        const { generateKeywords } = await import('@/utils/ai/keywords')
        const genResult = await generateKeywords(business.id)

        // 2) Refresh ONLY unknown volumes (volume is null). Do NOT auto-refresh confirmed zeros.
        const { data: unknown } = await supabase
            .from('keywords')
            .select('id, keyword')
            .eq('business_id', business.id)
            .is('volume', null);

        if (unknown && unknown.length > 0) {
            const { getKeywordsData } = await import('@/utils/dataforseo');
            // Business language/country for DataForSEO targeting
            const { data: biz } = await supabase.from('businesses').select('language').eq('id', business.id).single();
            const countryCode = biz?.language === 'bg' ? 'BG' : 'US';
            const languageCode = biz?.language || 'en';

            const kwList = unknown.map((r: any) => r.keyword);
            const results = await getKeywordsData(kwList, countryCode, languageCode);
            const resultsMap = new Map(results.map((item: any) => [String(item.keyword || '').toLowerCase(), item]));
            const now = new Date().toISOString();

            // Update in parallel (small batch)
            await Promise.all(
                unknown.map(async (row: any) => {
                    const item = resultsMap.get(String(row.keyword || '').toLowerCase());
                    if (!item) return;
                    const vol = typeof item.volume === 'number' ? item.volume : 0;
                    const diff = item.difficulty || 'Medium';
                    await supabase.from('keywords').update({
                        volume: vol,
                        difficulty: diff,
                        source: 'dataforseo',
                        last_checked_at: now,
                        do_not_retry: vol === 0,
                    }).eq('id', row.id);
                })
            );
        }

        let debugPayload: string[] = []

        // Handle both legacy array return (just in case) and new object return
        if (Array.isArray(genResult)) {
            debugPayload = genResult.map((k: any) => k.keyword);
        } else if (genResult && typeof genResult === 'object') {
            debugPayload = genResult.debugExpandedList || [];
        }

        console.log(`Keyword regeneration processing complete. Payload size: ${debugPayload.length}`);

        revalidatePath('/dashboard')

        return { success: true, debugPayload }
    } catch (error) {
        console.error('Keyword regeneration failed:', error)
        return { error: 'Failed to regenerate keywords' }
    }
}

export async function refreshKeywordVolume(keywordId: string) {
    const supabase = await createClient();
    const business = await getBusiness();

    const { data: kw } = await supabase
        .from('keywords')
        .select('id, keyword')
        .eq('id', keywordId)
        .single();

    if (!kw) return { error: 'Keyword not found' };

    const { data: biz } = await supabase.from('businesses').select('language').eq('id', business.id).single();
    const countryCode = biz?.language === 'bg' ? 'BG' : 'US';
    const languageCode = biz?.language || 'en';

    const { getKeywordsData } = await import('@/utils/dataforseo');
    const results = await getKeywordsData([kw.keyword], countryCode, languageCode);
    const item = results?.[0];
    if (!item) return { error: 'No DataForSEO result' };

    const now = new Date().toISOString();
    const vol = typeof item.volume === 'number' ? item.volume : 0;
    const diff = item.difficulty || 'Medium';

    await supabase.from('keywords').update({
        volume: vol,
        difficulty: diff,
        source: 'dataforseo',
        last_checked_at: now,
        do_not_retry: vol === 0, // auto-refresh skips zeros, but manual refresh always allowed
    }).eq('id', kw.id);

    revalidatePath('/dashboard');
    return { success: true };
}

export async function deleteKeyword(keywordId: string) {
    const supabase = await createClient();
    const business = await getBusiness();

    // Safety: if an article references this keyword, detach it (leave article).
    await supabase
        .from('articles')
        .update({ keyword_id: null })
        .eq('keyword_id', keywordId);

    const { error } = await supabase.from('keywords').delete().eq('id', keywordId).eq('business_id', business.id);
    if (error) {
        console.error('Delete keyword failed:', error);
        return { error: 'Failed to delete keyword' };
    }
    revalidatePath('/dashboard');
    return { success: true };
}

export async function deleteAllKeywords() {
    const supabase = await createClient();
    const business = await getBusiness();

    // Detach keywords from articles first, then delete keywords.
    const { data: kwIds } = await supabase
        .from('keywords')
        .select('id')
        .eq('business_id', business.id);

    const ids = (kwIds || []).map((r: any) => r.id);
    if (ids.length > 0) {
        await supabase.from('articles').update({ keyword_id: null }).in('keyword_id', ids);
    }

    const { error } = await supabase.from('keywords').delete().eq('business_id', business.id);
    if (error) {
        console.error('Delete all keywords failed:', error);
        return { error: 'Failed to delete all keywords' };
    }
    revalidatePath('/dashboard');
    return { success: true };
}
