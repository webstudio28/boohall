'use client'

import { useState } from 'react'
import { Plus, ExternalLink, Loader2, CheckCircle, BarChart3, AlertCircle, RefreshCcw } from 'lucide-react'
import { NewAnalysisModal } from './new-analysis-modal'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { bg } from 'date-fns/locale'

interface Analysis {
    id: string
    page_type: string
    my_url: string
    competitor_url: string
    status: string
    created_at: string
}

export function CompetitorsClient({ initialAnalyses }: { initialAnalyses: Analysis[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const router = useRouter()

    const handleRefresh = () => {
        setIsRefreshing(true)
        router.refresh()
        setTimeout(() => setIsRefreshing(false), 1000)
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                        Конкуренти
                    </h1>
                    <p className="mt-2 text-zinc-500 max-w-2xl">
                        Сравни своя сайт с този на конкуренцията и виж в какво те се справят по-добре.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        className="inline-flex items-center justify-center rounded-lg bg-white border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors"
                    >
                        <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Обнови
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 transition-colors"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Нов анализ
                    </button>
                </div>
            </div>

            <NewAnalysisModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {initialAnalyses.map((analysis) => (
                    <div
                        key={analysis.id}
                        className="group relative flex flex-col overflow-hidden rounded-xl bg-white border border-zinc-200 shadow-sm transition-all hover:shadow-md"
                    >
                        <div className="p-6 flex-1">
                            <div className="flex items-center justify-between mb-4">
                                <span className={`
                                    inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                                    ${analysis.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        analysis.status === 'getting_data' ? 'bg-blue-100 text-blue-800' : // legacy/future if using detailed status
                                            analysis.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                'bg-amber-100 text-amber-800'}
                                `}>
                                    {analysis.status === 'completed' ? 'Завършен' :
                                        analysis.status === 'failed' ? 'Грешка' : 'Генериране...'}
                                </span>
                                <span className="text-xs text-zinc-400">
                                    {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: bg })}
                                </span>
                            </div>

                            <h3 className="flex items-center text-lg font-semibold text-zinc-900 mb-2">
                                <BarChart3 className="mr-2 h-5 w-5 text-zinc-400" />
                                {analysis.page_type} Анализ
                            </h3>

                            <div className="space-y-2 text-sm text-zinc-500 mb-6">
                                <div className="flex items-center gap-2 truncate">
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                                    <a href={analysis.my_url} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 truncate flex-1">
                                        {new URL(analysis.my_url).hostname}
                                    </a>
                                </div>
                                <div className="flex items-center gap-2 truncate">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    <a href={analysis.competitor_url} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 truncate flex-1">
                                        {new URL(analysis.competitor_url).hostname}
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-zinc-100 bg-zinc-50/50 p-4">
                            {analysis.status === 'completed' ? (
                                <Link
                                    href={`/competitors/${analysis.id}`}
                                    className="flex w-full items-center justify-center rounded-lg bg-white border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 transition-colors"
                                >
                                    Виж анализ
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                </Link>
                            ) : analysis.status === 'failed' ? (
                                <button
                                    disabled
                                    className="flex w-full items-center justify-center rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 cursor-not-allowed"
                                >
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    Неуспешен
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="flex w-full items-center justify-center rounded-lg bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-400 cursor-not-allowed"
                                >
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Обработка...
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {initialAnalyses.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50">
                        <div className="rounded-full bg-white p-4 shadow-sm mb-4">
                            <BarChart3 className="h-8 w-8 text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-medium text-zinc-900">Няма намерени анализи</h3>
                        <p className="mt-1 text-sm text-zinc-500 max-w-sm">
                            Започни като добавиш нов анализ за сравнение с конкурент.
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-6 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 transition-colors"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Нов анализ
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
