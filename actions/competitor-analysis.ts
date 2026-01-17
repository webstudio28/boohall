'use server'

import { createClient } from '@/utils/supabase/server'
import { scrapePage } from '@/utils/scrape'
import OpenAI from 'openai'
import { cookies } from 'next/headers'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export type PageType = 'Home' | 'Service' | 'Product' | 'Article'

export async function createAnalysis(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    // Check business
    const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (!business) {
        throw new Error('No business found')
    }

    const pageType = formData.get('pageType') as PageType
    const myUrl = formData.get('myUrl') as string
    const competitorUrl = formData.get('competitorUrl') as string

    if (!pageType || !myUrl || !competitorUrl) {
        throw new Error('Missing fields')
    }

    const { data, error } = await supabase
        .from('competitor_analyses')
        .insert({
            business_id: business.id,
            page_type: pageType,
            my_url: myUrl,
            competitor_url: competitorUrl,
            status: 'generating'
        })
        .select()
        .single()

    if (error) {
        throw new Error(error.message)
    }

    // Get language from cookies
    const cookieStore = await cookies()
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'
    const language = locale === 'bg' ? 'Bulgarian' : 'English'

    // Trigger analysis in background (conceptually - simplistic version awaits it or Vercel functions might timeout if too long, 
    // but for now we'll call it. In production, consider queues.)
    // For this environment, we can't easily fire-and-forget safely in server actions without risk of termination unless using next/after (experimental) or just awaiting it.
    // Client will see loading state. We can choose to await it here or rely on client polling.
    // Given the prompt "under it will be the status... It might be generating or completed", implies async.
    // I will NOT await it here to let the UI return quickly, BUT Vercel/Next serverless might kill it. 
    // SAFEST implementation for this demo: Await it, or use `void runAnalysis(...)` but acknowledge risk. 
    // I will await it to ensure it completes, assuming the user is ok with a spinner on the "Create" button or we make the UI optimistic.
    // Actually the requirement says "when we click 'Създай' In the competitors page a card will be created... if generating a small spinner". 
    // So better to return the ID immediately and let the client assume it's generating, while we kick off the process.

    // We will run it without await to return quickly, but know that in serverless this is flaky.
    // A better approach for reliability in this specific agent environment is to just await it for 10-20s. 
    // However, scraping 2 sites + GPT-4 might take 30s+.

    // Let's try the "fire and forget" pattern but with `waitUntil` if available or just no-await.
    runAnalysis(data.id, myUrl, competitorUrl, pageType, language).catch(err => console.error(err))

    return { success: true, id: data.id }
}

async function runAnalysis(analysisId: string, myUrl: string, competitorUrl: string, pageType: PageType, language: string) {
    const supabase = await createClient()

    try {
        console.log(`🚀 Starting analysis for: ${myUrl} vs ${competitorUrl}`);

        const [myData, competitorData] = await Promise.all([
            scrapePage(myUrl),
            scrapePage(competitorUrl)
        ])

        console.log(`📊 Data scraped. Preparing OpenAI prompt for ${pageType}...`);

        const prompt = `
        You are an expert SEO and Conversion Rate Optimization consultant.
        I am the owner of "My Page" (${myUrl}).
        I want to compare my page against a "Competitor Page" (${competitorUrl}).
        The page type is: "${pageType}".

        **My Page Data:**
        - Title: ${myData.title}
        - H1s: ${myData.headings.h1.join(', ')}
        - Content Preview: ${myData.text.slice(0, 4000)}...

        **Competitor Page Data:**
        - Title: ${competitorData.title}
        - H1s: ${competitorData.headings.h1.join(', ')}
        - Content Preview: ${competitorData.text.slice(0, 4000)}...

        **Your Goal:**
        Analyze where the competitor is outperforming me and give me a brutally honest but constructive comparison.
        Speak directly to me (use "Your website", "You", "The competitor").

        **Required Output Structure (Formatted in beautiful Markdown):**

        # 🎯 Executive Summary
        (2-3 sentences max. direct verdict: Who is winning and why?)

        ## 🏆 Where the Competitor Wins
        (List 3-5 specific things they do better. Be specific about their UX, Content, or SEO.)
        *   **Feature/Area:** Explanation of why theirs is better.
        *   **...**

        ## 🛡️ Your Strengths
        (What are you doing well? Don't invent things if I'm failing, be honest.)

        ## 🚀 Action Plan
        (Checklist of 3-5 high-impact changes I should make immediately to beat them.)
        - [ ] Action item 1
        - [ ] Action item 2

        **Tone:** Professional, direct, actionable. No fluff.
        **Language:** STICLKY output ONLY in ${language}.
        `

        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-4o',
        })

        const report = completion.choices[0].message.content || 'Failed to generate report.'

        await supabase
            .from('competitor_analyses')
            .update({ status: 'completed', report_markdown: report })
            .eq('id', analysisId)

    } catch (error: any) {
        console.error('Analysis failed', error)
        await supabase
            .from('competitor_analyses')
            .update({ status: 'failed', report_markdown: `Analysis failed: ${error.message} ` })
            .eq('id', analysisId)
    }
}
