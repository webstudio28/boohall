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
        console.log('Regenerating keywords (v4)...');
        const business = await getBusiness()
        const supabase = await createClient()
        // Clear existing keywords
        await supabase.from('keywords').delete().eq('business_id', business.id)

        const { generateKeywords } = await import('@/utils/ai/keywords')
        const genResult = await generateKeywords(business.id)

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
