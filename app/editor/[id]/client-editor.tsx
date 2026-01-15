'use client'

import React, { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { updateArticle } from '../actions'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

// Debounce helper
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function EditorInterface({ initialArticle }: { initialArticle: any }) {
    const [content, setContent] = useState(initialArticle.content || '')
    const [title, setTitle] = useState(initialArticle.title || '')
    // Infer status from content existence if not explicitly generating
    const [status, setStatus] = useState(initialArticle.content ? 'completed' : 'generating')
    const [isSaving, setIsSaving] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const debouncedContent = useDebounce(content, 1000)
    const debouncedTitle = useDebounce(title, 1000)

    // Polling for generation completion
    useEffect(() => {
        if (status === 'generating') {
            const interval = setInterval(async () => {
                // Poll for content existence
                const { data } = await supabase.from('articles').select('content, title').eq('id', initialArticle.id).single()
                if (data && data.content) {
                    setStatus('completed')
                    setContent(data.content || '')
                    setTitle(data.title || '')
                    clearInterval(interval)
                    router.refresh()
                }
            }, 3000)
            return () => clearInterval(interval)
        }
    }, [status, initialArticle.id, supabase, router])

    // Auto-save effect
    useEffect(() => {
        if (status === 'generating') return // Don't save while generating

        // Only save if content changed from initial or last save
        const save = async () => {
            setIsSaving(true)
            await updateArticle(initialArticle.id, debouncedContent, debouncedTitle)
            setIsSaving(false)
        }

        // Trigger save on debounce change
        if (debouncedContent !== initialArticle.content || debouncedTitle !== initialArticle.title) {
            save()
        }
    }, [debouncedContent, debouncedTitle, initialArticle.id, status, initialArticle.content, initialArticle.title])


    const handleDownload = (format: 'md' | 'txt') => {
        const element = document.createElement("a");
        const file = new Blob([content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${title.replace(/\s+/g, '_') || 'article'}.${format}`;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    }

    return (
        <div className="flex h-full">
            {/* Editor Pane */}
            <div className="w-1/2 flex flex-col border-r border-zinc-200">
                <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
                    <span className="text-xs font-semibold text-zinc-500 uppercase">Markdown Input</span>
                    {isSaving && <span className="text-xs text-zinc-400 animate-pulse">Saving...</span>}
                </div>
                <textarea
                    className="flex-1 w-full p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                    placeholder={status === 'generating' ? 'AI is writing your article...' : 'Start writing...'}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={status === 'generating'}
                />
            </div>

            {/* Preview Pane */}
            <div className="w-1/2 flex flex-col bg-zinc-50/50">
                <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
                    <span className="text-xs font-semibold text-zinc-500 uppercase">Live Preview</span>
                    <div className="flex gap-2">
                        <button onClick={() => handleDownload('md')} className="text-xs bg-white border border-zinc-200 px-2 py-1 rounded hover:bg-zinc-50">Export .md</button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 prose prose-sm max-w-none prose-zinc dark:prose-invert">
                    {status === 'generating' ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3">
                            <div className="w-6 h-6 border-2 border-zinc-300 border-t-black rounded-full animate-spin"></div>
                            <p>Analysing SERPs & Writing...</p>
                        </div>
                    ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content}
                        </ReactMarkdown>
                    )}
                </div>
            </div>
        </div>
    )
}
