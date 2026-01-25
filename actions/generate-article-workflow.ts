
'use server'

import { createClient } from '@/utils/supabase/server'
import OpenAI from 'openai'
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { BlueprintSchema, buildBlueprintPrompt } from '@/utils/ai/prompts/blueprint';
import { DraftSchema, buildDraftPrompt } from '@/utils/ai/prompts/draft';
import { MetadataSchema, buildMetadataPrompt } from '@/utils/ai/prompts/metadata';
import { createAdminClient } from '@/utils/supabase/admin';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

// Helper to get model from env or default
const getModel = (step: 'BLUEPRINT' | 'DRAFT' | 'METADATA') => {
    const envVar = `OPENAI_MODEL_${step}`;
    const model = process.env[envVar] || process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o';
    console.log(`[WorkflowConfig] Step: ${step}, Model: ${model}`);
    return model;
}

export async function generateArticleWorkflow(articleId: string) {
    console.log(`[Workflow][${articleId}] 🚀 Starting 3-step generation workflow`);

    // Use Admin Client for background jobs
    const supabase = createAdminClient();

    try {
        // 1. Fetch Context
        const { data: article, error: fetchError } = await supabase
            .from('articles')
            .select(`
             *,
             keyword:keywords(*),
             business:businesses(*)
         `)
            .eq('id', articleId)
            .single();

        if (!article) {
            console.error(`[Workflow][${articleId}] ❌ Article not found`);
            throw new Error('Article not found');
        }

        console.log(`[Workflow][${articleId}] Context loaded. Keyword: "${article.keyword?.keyword}"`);

        // Update status
        await supabase.from('articles').update({ status: 'generating' }).eq('id', articleId);

        // Prepare Common Args
        // @ts-ignore
        const keyword = article.keyword?.keyword;
        // @ts-ignore
        const business = article.business;
        const languageName = business.language === 'bg' ? 'Bulgarian' : 'English';
        const businessContext = business.product_description || 'A generic business';

        // ==========================================
        // STEP 1: BLUEPRINT
        // ==========================================
        const blueprintModel = getModel('BLUEPRINT');
        console.log(`[Workflow][${articleId}] 🧠 Step 1/3: Blueprint Strategy (Model: ${blueprintModel})...`);
        const blueprintPrompt = buildBlueprintPrompt({
            keyword,
            businessContext,
            goal: article.goal || 'Informational',
            tone: article.tone || 'Professional',
            targetCountry: business.target_country || 'Global',
            languageName
        });

        const blueprintCompletion = await openai.chat.completions.create({
            model: blueprintModel,
            messages: [{ role: 'user', content: blueprintPrompt }],
            response_format: zodResponseFormat(BlueprintSchema, "blueprint"),
        });

        const blueprint = BlueprintSchema.parse(JSON.parse(blueprintCompletion.choices[0].message.content || '{}'));
        console.log(`[Workflow][${articleId}] ✅ Blueprint generated. Intent: ${blueprint.primary_intent}, Type: ${blueprint.article_type}`);

        // ==========================================
        // STEP 2: DRAFT
        // ==========================================
        const draftModel = getModel('DRAFT');
        console.log(`[Workflow][${articleId}] ✍️ Step 2/3: Drafting Content (Model: ${draftModel})...`);
        const draftPrompt = buildDraftPrompt({
            blueprint,
            keyword,
            businessContext,
            goal: article.goal || 'Informational',
            tone: article.tone || 'Professional',
            languageName,
            minWords: 1500,
            // @ts-ignore
            providedAuthorInfo: article.author_info
        });

        const draftCompletion = await openai.chat.completions.create({
            model: draftModel,
            messages: [{ role: 'user', content: draftPrompt }],
            response_format: zodResponseFormat(DraftSchema, "draft"),
        });

        const draft = DraftSchema.parse(JSON.parse(draftCompletion.choices[0].message.content || '{}'));
        console.log(`[Workflow][${articleId}] ✅ Draft generated. Length: ${draft.content_md.length} chars, H1: Present`);

        // ==========================================
        // STEP 3: METADATA & SCHEMA
        // ==========================================
        const metadataModel = getModel('METADATA');
        console.log(`[Workflow][${articleId}] 🧩 Step 3/3: Synthesizing Metadata & Schema (Model: ${metadataModel})...`);
        const metadataPrompt = buildMetadataPrompt({
            contentMd: draft.content_md,
            keyword,
            businessContext,
            languageName
        });

        const metadataCompletion = await openai.chat.completions.create({
            model: metadataModel,
            messages: [{ role: 'user', content: metadataPrompt }],
            response_format: zodResponseFormat(MetadataSchema, "metadata"),
        });

        const metadata = MetadataSchema.parse(JSON.parse(metadataCompletion.choices[0].message.content || '{}'));
        console.log(`[Workflow][${articleId}] ✅ Metadata generated. Title: "${metadata.seo_meta.title}"`);

        // Parse Schema Strings to Objects
        const parsedSchemaMarkup: any = {
            article: safeParseJSON(metadata.schema_markup.article),
            author: safeParseJSON(metadata.schema_markup.author),
            organization: safeParseJSON(metadata.schema_markup.organization),
            breadcrumb: safeParseJSON(metadata.schema_markup.breadcrumb),
            faq: metadata.schema_markup.faq ? safeParseJSON(metadata.schema_markup.faq) : null,
            howto: metadata.schema_markup.howto ? safeParseJSON(metadata.schema_markup.howto) : null,
        };

        // ==========================================
        // SAVE
        // ==========================================
        console.log(`[Workflow][${articleId}] 💾 Saving to database...`);
        const updatePayload = {
            title: metadata.seo_meta.title, // Use SEO title as main title or fallback
            content: draft.content_md,
            seo_meta: metadata.seo_meta,
            schema_markup: parsedSchemaMarkup,
            author_info: draft.author_info,
            content_structure: metadata.content_structure_stats,
            status: 'completed'
        };

        const { error: updateError } = await supabase
            .from('articles')
            .update(updatePayload)
            .eq('id', articleId);

        if (updateError) throw updateError;
        console.log(`[Workflow][${articleId}] 🏆 Article completed successfully.`);

    } catch (error: any) {
        console.error(`[Workflow][${articleId}] ❌ Execution Failed:`, error);
        await supabase.from('articles').update({ status: 'failed' }).eq('id', articleId);
        // Optionally store error message in a field
    }
}

function safeParseJSON(str: string): any {
    try {
        return JSON.parse(str);
    } catch (e) {
        console.warn('[Workflow] Failed to parse JSON string:', str);
        return {};
    }
}
