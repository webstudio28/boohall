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
    // Infer status from initialArticle.status or content existence
    const [status, setStatus] = useState(initialArticle.status || (initialArticle.content ? 'completed' : 'generating'))
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    // Polling for generation completion
    useEffect(() => {
        if (status === 'generating') {
            const interval = setInterval(async () => {
                // Poll for status or content
                const { data } = await supabase.from('articles').select('status, content, title').eq('id', initialArticle.id).single()

                if (data && (data.status === 'completed' || data.content)) {
                    setStatus('completed')
                    setContent(data.content || '')
                    setTitle(data.title || '')
                    setHasChanges(false) // Reset changes as we just loaded fresh data
                    clearInterval(interval)
                    router.refresh()
                } else if (data && data.status === 'failed') {
                    setStatus('failed')
                    clearInterval(interval)
                }
            }, 3000)
            return () => clearInterval(interval)
        }
    }, [status, initialArticle.id, supabase, router])

    // Track changes
    useEffect(() => {
        // Simple check: if current content/title differs from initial AND we are not generating
        // But initialArticle is static. We need to compare against "last saved state".
        // For simplicity, let's just say if we type anything, it becomes dirty.
        // Or we can compare with initial.
        if (content !== initialArticle.content || title !== initialArticle.title) {
            setHasChanges(true)
        }
    }, [content, title, initialArticle.content, initialArticle.title])

    const handleSave = async () => {
        if (!hasChanges || isSaving) return;

        setIsSaving(true)
        await updateArticle(initialArticle.id, content, title)
        setIsSaving(false)
        setHasChanges(false)
        router.refresh() // Refresh server data so initialArticle updates on next load (if we were to reload)
        // Ideally we should update the "initial" reference here to avoid dirty flag resetting immediately if we matched against it,
        // but since we navigate or stay, visual feedback is enough.
    }


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
                    <div className="flex items-center gap-2">
                        {status === 'failed' && <span className="text-xs text-red-500 font-medium">Generation Failed</span>}

                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving || status === 'generating'}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border
                                ${hasChanges && !isSaving
                                    ? 'bg-black text-white border-black hover:bg-zinc-800 cursor-pointer shadow-sm'
                                    : 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'}
                            `}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
                <textarea
                    className="flex-1 w-full p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                    placeholder={status === 'generating' ? 'AI is writing your article...' : 'Start writing...'}
                    value={content}
                    onChange={(e) => {
                        setContent(e.target.value)
                        setHasChanges(true)
                    }}
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
