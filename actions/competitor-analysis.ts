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
    const specificFocus = formData.get('specificFocus') as string

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
    runAnalysis(data.id, myUrl, competitorUrl, pageType, language, specificFocus).catch(err => console.error(err))

    return { success: true, id: data.id }
}

async function runAnalysis(analysisId: string, myUrl: string, competitorUrl: string, pageType: PageType, language: string, specificFocus?: string) {
    const supabase = await createClient()

    try {
        console.log(`🚀 Starting analysis for: ${myUrl} vs ${competitorUrl}`);

        const [myData, competitorData] = await Promise.all([
            scrapePage(myUrl),
            scrapePage(competitorUrl)
        ])

        console.log(`📊 Data scraped. Preparing OpenAI prompt for ${pageType}...`);

        const specificFocusBlock = specificFocus ? `
        **Specific Focus Requirement**
        The user wants a deep, expert-level focus on the following specific goal or area:
        "${specificFocus}"

        You must:
        - Analyze this area in every relevant section
        - Explicitly call it out in:
          - Strategic Positioning
          - Competitor Advantages
          - Action Plan
        - Explain how improving this area affects overall performance
        If not provided → do nothing.
        ` : ''

        const prompt = `
        You are a senior-level SEO and Conversion Rate Optimization (CRO) consultant with experience auditing and outperforming top competitors.

        I am the owner of "My Page" (${myUrl}).
        I want a deep, expert-level comparison between my page and a "Competitor Page" (${competitorUrl}).

        Page Type: "${pageType}"

        ────────────────────
        PAGE-TYPE-SPECIFIC ANALYSIS PRIORITY
        ────────────────────
        Adjust your analysis depth and weighting based on the page type:

        - Home Page → Brand clarity, value proposition, trust signals, navigation, first-impression UX, funnel entry
        - Service Page → Problem–solution alignment, service differentiation, benefits vs features, CTAs, pricing clarity, objection handling
        - Product Page → Feature hierarchy, competitive differentiation, friction points, clarity of offer, conversion psychology
        - Blog Page → Search intent alignment, topical authority, internal linking, E-E-A-T, content depth vs competitors

        ────────────────────
        INPUT DATA (RAW SCRAPED DATA)
        ────────────────────

        **My Page**
        - Title: ${myData.title}
        - H1s: ${myData.headings.h1.join(', ')}
        - Content Preview: ${myData.text.slice(0, 4000)}...

        **Competitor Page**
        - Title: ${competitorData.title}
        - H1s: ${competitorData.headings.h1.join(', ')}
        - Content Preview: ${competitorData.text.slice(0, 4000)}...

        ${specificFocusBlock}

        ────────────────────
        ANALYSIS PRINCIPLES (VERY IMPORTANT)
        ────────────────────
        - Think like an expert conducting a real SEO & CRO audit.
        - Identify BOTH obvious and non-obvious issues.
        - Analyze structure, intent, clarity, psychology, and strategy — not just keywords.
        - Do NOT assume missing features; infer only when strongly implied by content.
        - Be brutally honest, but always constructive and practical.
        - Speak directly to me: “Your website”, “You”, “The competitor”.
        - If something is weak or missing, clearly state it.
        - If something is strong, explain WHY it is strong.

        ────────────────────
        REQUIRED OUTPUT STRUCTURE
        (Extensive, professional Markdown)
        ────────────────────

        # 🎯 Executive Summary (Strategic Verdict)
        Provide a strategic, high-level verdict (3–5 paragraphs):
        - Who is winning overall and why
        - What the main strategic gap is
        - Whether this gap is primarily SEO-driven, UX-driven, content-driven, or conversion-driven
        - What would happen if no changes are made in the next 6–12 months

        Include an overall qualitative verdict:
        Competitor clearly ahead / Slight competitor advantage / Rough parity / You slightly ahead

        ---

        ## 🧠 Strategic Positioning Comparison
        Analyze how both pages position themselves:
        - Clarity of value proposition
        - Target audience alignment
        - Messaging focus and consistency
        - Emotional vs rational appeal
        - Market sophistication level

        Explain where your positioning is weaker, unclear, or misaligned.

        ---

        ## 🔍 SEO Deep-Dive Analysis

        ### Title & SERP Optimization
        - Keyword focus and intent match
        - Length, clarity, and differentiation
        - Branding vs keyword balance
        - Click-through potential

        ### Heading Structure (H1–H3)
        - Logical hierarchy
        - SEO relevance
        - Readability and scanning
        - Comparison of intent coverage

        ### Content Depth & Relevance
        - Coverage of user questions
        - Topical completeness vs competitor
        - Redundancy, fluff, or thin areas
        - Alignment with page type intent

        ### Internal Linking & Semantic Signals
        - Use of contextual relevance
        - Topic reinforcement
        - Missed internal SEO opportunities

        ---

        ## 🎨 UX & Conversion Analysis

        ### First Impression & Visual Hierarchy
        - Clarity above the fold
        - Information prioritization
        - Cognitive load

        ### CTA Strategy
        - CTA visibility and clarity
        - Action friction
        - Single vs multiple conversion goals

        ### Trust & Credibility Signals
        - Social proof presence or absence
        - Authority indicators
        - Risk reduction elements

        ---

        ## ✍️ Copywriting & Persuasion Analysis
        - Tone and professionalism
        - Benefits vs features balance
        - Clarity vs creativity
        - Objection handling
        - Consistency across sections

        Explain how the competitor’s copy better guides decisions (if applicable).

        ---

        ## 🏆 Where the Competitor Clearly Outperforms You
        List **5–7 concrete, expert-level advantages**, each explained thoroughly:
        - What they do better
        - Why it works
        - How it impacts SEO, UX, or conversions

        Avoid generic statements. Be specific.

        ---

        ## 🛡️ Your Strengths (If Any)
        Identify genuine advantages only.
        If none are meaningful, explicitly state that your page lacks clear competitive strengths.

        Explain how these strengths could be amplified.

        ---

        ## ⚠️ Hidden Risks, Gaps & Missed Opportunities
        Identify:
        - SEO risks
        - Conversion bottlenecks
        - Strategic blind spots
        - Areas neither page handles well, but users likely expect

        This section should feel like expert insight, not surface-level critique.

        ---

        ## 🚀 Prioritized Action Plan (Expert-Level)
        Provide **8–12 concrete actions**, grouped by priority:

        ### High Impact (Do First)
        ### Medium Impact
        ### Long-Term Improvements

        Each action must:
        - Reference a specific element
        - Explain why it matters
        - Be realistic to implement
        - Clearly help you close or surpass the competitor gap

        ---

        ## 📈 Expected Outcome If Implemented
        Explain:
        - What improvements to expect (SEO visibility, engagement, conversions)
        - Which changes will move the needle fastest
        - What success would look like after 3–6 months

        ────────────────────
        LANGUAGE & TONE
        ────────────────────
        - Output must be 100% in ${language}. Do NOT mix languages.
        - Tone: Senior consultant, direct, analytical, actionable.
        - No fluff. No filler. No generic SEO advice.
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
