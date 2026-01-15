'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { generateArticleContent } from '@/utils/ai/article'

export async function createArticle(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const keywordId = formData.get('keywordId') as string
    const goal = formData.get('goal') as string
    const tone = formData.get('tone') as string

    // Get business for language
    const { data: business } = await supabase
        .from('businesses')
        .select('id, language')
        .eq('user_id', user.id)
        .single()

    if (!business) redirect('/onboarding')

    // Versioning Logic
    const { data: existingVersions } = await supabase
        .from('articles')
        .select('version')
        .eq('business_id', business.id)
        .eq('keyword_id', keywordId)
        .eq('goal', goal)
        .eq('tone', tone)
        .order('version', { ascending: false })
        .limit(1)

    const nextVersion = existingVersions && existingVersions.length > 0
        ? existingVersions[0].version + 1
        : 1

    // Find parent if it's a version > 1? Or just link to the first one?
    // For now, simple version increment is enough.

    // Create article record
    const { data: article, error } = await supabase
        .from('articles')
        .insert({
            business_id: business.id,
            keyword_id: keywordId,
            title: 'Generating...',
            goal: goal,
            tone: tone,
            version: nextVersion,
            // language: business.language, // Not in my new migration, but useful if I add it. For now, prompt uses business language.
            // status: 'generating' // Not in migration, can add or skip. I'll skip status for now or assume it defaults if column exists. 
            // My migration didn't have status. I'll skip it and just rely on content being null/filled.
        })
        .select()
        .single()

    if (error || !article) {
        console.error('Create article error:', error)
        return
    }

    // Trigger AI (async, don't await)
    generateArticleContent(article.id).catch(console.error)

    redirect(`/editor/${article.id}`)
}

export async function updateArticle(articleId: string, content: string, title?: string) {
    const supabase = await createClient()
    await supabase
        .from('articles')
        .update({
            content: content,
            title: title,
            // updated_at: new Date().toISOString() // Assuming automatic or trigger, but good to keep if column exists. 
            // My migration has created_at default now, but not updated_at explicitly. 
            // I'll leave updated_at out if the column wasn't in my migration. 
            // Checked migration: no updated_at. I'll remove it to avoid error.
        })
        .eq('id', articleId)
}
