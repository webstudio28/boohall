"use client";

import Link from 'next/link';
import { FileText, RefreshCw, Eye } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ArticleCardProps {
    article: {
        id: string;
        title: string | null;
        content: string | null;
        goal: string;
        tone: string;
        version: number;
        created_at: string;
        keyword: {
            keyword: string;
        };
    };
    onRegenerate: (article: any) => void;
}

export function ArticleCard({ article, onRegenerate }: ArticleCardProps) {
    return (
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-5 hover:border-zinc-300 transition-colors flex flex-col justify-between h-full">
            <div>
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                            {article.keyword.keyword}
                        </span>
                        {article.version > 1 && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                v{article.version}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] text-zinc-400">
                        {new Date(article.created_at).toLocaleDateString('bg-BG')}
                    </span>
                </div>

                <h3 className="text-lg font-semibold text-zinc-900 mb-2 line-clamp-2">
                    {article.title || 'Untitled Article'}
                </h3>

                <div className="flex gap-2 mb-4">
                    <span className="inline-flex items-center rounded-md bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10">
                        Goal: {article.goal}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10">
                        Tone: {article.tone}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 mt-2">
                <Link
                    href={`/editor/${article.id}`}
                    className="flex-1 flex items-center justify-center gap-2 rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                    <Eye className="h-4 w-4" />
                    View
                </Link>
                <button
                    onClick={() => onRegenerate(article)}
                    className="flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50"
                    title="Regenerate new version"
                >
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
