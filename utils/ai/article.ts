
import { generateArticleWorkflow } from '@/actions/generate-article-workflow';

export async function generateArticleContent(articleId: string) {
    console.log(`[AI-Job][Article] Redirecting to 3-step workflow for: ${articleId}`);
    try {
        await generateArticleWorkflow(articleId);
        console.log(`[AI-Job][Article] Workflow completed for: ${articleId}`);
    } catch (error) {
        console.error(`[AI-Job][Article] Workflow failed for: ${articleId}`, error);
    }
}

