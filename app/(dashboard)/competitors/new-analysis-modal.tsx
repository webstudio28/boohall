'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Globe, ArrowRight, Loader2 } from 'lucide-react'
import { createAnalysis } from '@/actions/competitor-analysis'

interface NewAnalysisModalProps {
    isOpen: boolean
    onClose: () => void
}

const PAGE_TYPES = [
    { value: 'Home', label: 'Начална страница (Home Page)' },
    { value: 'Service', label: 'Страница на услуга (Service Page)' },
    { value: 'Product', label: 'Страница на продукт (Product Page)' },
    { value: 'Article', label: 'Статия (Article/Blog Post)' },
]

export function NewAnalysisModal({ isOpen, onClose }: NewAnalysisModalProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        setError('')

        const formData = new FormData(event.currentTarget)

        try {
            await createAnalysis(formData)
            router.refresh()
            onClose()
        } catch (e: any) {
            setError('Failed to start analysis. Please check the URLs and try again.')
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
                    <h2 className="text-lg font-semibold text-zinc-900">Нов анализ</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 hover:bg-zinc-100 transition-colors"
                    >
                        <X className="h-5 w-5 text-zinc-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label htmlFor="pageType" className="block text-sm font-medium text-zinc-700 mb-2">
                            Тип на страницата
                        </label>
                        <select
                            name="pageType"
                            id="pageType"
                            required
                            className="block w-full rounded-lg border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-zinc-900 focus:ring-zinc-900"
                        >
                            {PAGE_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid gap-6">
                        <div>
                            <label htmlFor="myUrl" className="block text-sm font-medium text-zinc-700 mb-2">
                                Твоят линк
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Globe className="h-4 w-4 text-zinc-400" />
                                </div>
                                <input
                                    type="url"
                                    name="myUrl"
                                    id="myUrl"
                                    required
                                    placeholder="https://mysite.com/service"
                                    className="block w-full rounded-lg border-zinc-200 bg-zinc-50 pl-10 px-4 py-3 text-sm focus:border-zinc-900 focus:ring-zinc-900"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="competitorUrl" className="block text-sm font-medium text-zinc-700 mb-2">
                                Линк на конкурента
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Globe className="h-4 w-4 text-zinc-400" />
                                </div>
                                <input
                                    type="url"
                                    name="competitorUrl"
                                    id="competitorUrl"
                                    required
                                    placeholder="https://competitor.com/service"
                                    className="block w-full rounded-lg border-zinc-200 bg-zinc-50 pl-10 px-4 py-3 text-sm focus:border-zinc-900 focus:ring-zinc-900"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Генериране...
                                </>
                            ) : (
                                <>
                                    Създай анализ
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
