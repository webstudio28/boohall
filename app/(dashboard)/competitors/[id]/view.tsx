'use client' // Using client for markdown rendering mostly, but could be server. Client is safer for some react-markdown plugins.

import { ArrowLeft, Calendar, Link as LinkIcon, Globe } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatDistanceToNow } from 'date-fns'
import { bg } from 'date-fns/locale'

// We need to fetch data. Since this is a client component for convenience of markdown, we can either pass data from page or fetch here. 
// Best practice: Server Component page that passes data to Client Component view.
// But as per file layout, I'll make this the client View and creating a page.tsx that wraps it.
// Wait, I'm creating [id]/page.tsx directly. I'll make it a Server Component and render markdown.

export default function AnalysisDetailView({ analysis }: { analysis: any }) {
    if (!analysis) return null

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link
                    href="/competitors"
                    className="group flex items-center justify-center w-10 h-10 rounded-full bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-zinc-500 group-hover:text-zinc-900" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">
                        {analysis.page_type} Анализ
                    </h1>
                    <div className="flex items-center gap-4 mt-1 text-sm text-zinc-500">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: bg })}
                        </span>
                        <span className={`
                            inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                            ${analysis.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}
                        `}>
                            {analysis.status === 'completed' ? 'Завършен' : 'Обработка'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm">
                    <h3 className="text-sm font-medium text-zinc-500 mb-3 flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Твоят сайт
                    </h3>
                    <a
                        href={analysis.my_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-zinc-900 hover:underline break-all"
                    >
                        {analysis.my_url}
                    </a>
                </div>
                <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm">
                    <h3 className="text-sm font-medium text-zinc-500 mb-3 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-red-500" />
                        Конкурент
                    </h3>
                    <a
                        href={analysis.competitor_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-zinc-900 hover:underline break-all"
                    >
                        {analysis.competitor_url}
                    </a>
                </div>
            </div>

            <div className="rounded-2xl bg-white border border-zinc-200 shadow-sm overflow-hidden text-center sm:text-left">
                <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50">
                    <h2 className="text-lg font-semibold text-zinc-900">Доклад от анализа</h2>
                </div>
                <div className="p-6 sm:p-8 prose prose-zinc max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-blue-600">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {analysis.report_markdown || 'Все още няма генериран доклад.'}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    )
}
