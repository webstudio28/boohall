'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveBusinessContext(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const businessType = formData.get('businessType') as string
    const websiteUrl = formData.get('websiteUrl') as string
    const targetCountry = formData.get('targetCountry') as string
    const language = formData.get('language') as 'bg' | 'en'
    const productDescription = formData.get('productDescription') as string

    // Simple validation
    if (!websiteUrl || !productDescription) {
        // In real app, return error state
        redirect('/onboarding?error=Missing%20required%20fields')
    }

    const { data, error } = await supabase
        .from('businesses')
        .insert({
            user_id: user.id,
            business_type: businessType,
            website_url: websiteUrl,
            target_country: targetCountry,
            language: language,
            product_description: productDescription
        })
        .select()

    if (error) {
        console.error('Error saving business:', error)
        redirect('/onboarding?error=Failed%20to%20save%20business%20context')
    }

    // Trigger background jobs (Sequential for MVP to ensure data exists on dashboard)
    // In production, use a queue or `after()`
    const businessId = data[0].id

    try {
        const { analyzeNiche } = await import('@/utils/ai/niche')
        const { generateKeywords } = await import('@/utils/ai/keywords')
        const { analyzeCompetitors } = await import('@/utils/ai/competitors')

        await Promise.allSettled([
            analyzeNiche(businessId),
            generateKeywords(businessId),
            analyzeCompetitors(businessId)
        ])
    } catch (e) {
        console.error('Background job error:', e)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
