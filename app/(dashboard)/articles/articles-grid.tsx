"use client";

import { ArticleCard } from '@/components/article-card';
import { useRouter } from 'next/navigation';

export function ArticlesGrid({ articles }: { articles: any[] }) {
    const router = useRouter();

    const handleRegenerate = (article: any) => {
        // Redirect to editor with params pre-filled
        // We need to pass keyword_id, goal, tone via query params
        // Assuming /editor/new route handles these
        const params = new URLSearchParams({
            keyword: article.keyword_id,
            goal: article.goal,
            tone: article.tone,
            regenerate: 'true' // Flag to indicate we might want to auto-version or pre-fill
        });
        router.push(`/editor/new?${params.toString()}`);
    };

    return (
        <>
            {articles.map((article) => (
                <ArticleCard
                    key={article.id}
                    article={article}
                    onRegenerate={handleRegenerate}
                />
            ))}
        </>
    );
}
