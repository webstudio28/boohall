'use client'

import React, { useState, useEffect } from 'react'
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
    const [seoMeta, setSeoMeta] = useState<any>(initialArticle.seo_meta || null)
    const [schemaMarkup, setSchemaMarkup] = useState<any>(initialArticle.schema_markup || null)
    const [authorInfo, setAuthorInfo] = useState<any>(initialArticle.author_info || null)
    const [contentStructure, setContentStructure] = useState<any>(initialArticle.content_structure || null)
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
                const { data } = await supabase.from('articles').select('*').eq('id', initialArticle.id).single()

                if (data && (data.status === 'completed' || data.content)) {
                    setStatus('completed')
                    setContent(data.content || '')
                    setTitle(data.title || '')
                    setSeoMeta(data.seo_meta || null)
                    setSchemaMarkup(data.schema_markup || null)
                    setAuthorInfo(data.author_info || null)
                    setContentStructure(data.content_structure || null)
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
                    <span className="text-xs font-semibold text-zinc-500 uppercase">Preview</span>
                    <div className="flex gap-2">
                        <button onClick={() => handleDownload('md')} className="text-xs bg-white border border-zinc-200 px-2 py-1 rounded hover:bg-zinc-50">Export .md</button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8">
                    {(seoMeta || schemaMarkup || authorInfo || contentStructure) && (
                        <div className="mb-6 grid gap-3">
                            {seoMeta && (
                                <>
                                    <div className="rounded-lg border border-zinc-200 bg-white p-4">
                                        <div className="text-xs font-semibold text-zinc-500 uppercase mb-1">Meta title</div>
                                        <div className="text-sm text-zinc-900 break-words">{seoMeta.title || '—'}</div>
                                    </div>
                                    <div className="rounded-lg border border-zinc-200 bg-white p-4">
                                        <div className="text-xs font-semibold text-zinc-500 uppercase mb-1">Meta description</div>
                                        <div className="text-sm text-zinc-900 break-words">{seoMeta.description || '—'}</div>
                                    </div>
                                    <div className="rounded-lg border border-zinc-200 bg-white p-4">
                                        <div className="text-xs font-semibold text-zinc-500 uppercase mb-1">Slug</div>
                                        <div className="text-sm text-zinc-900 break-words font-mono">{seoMeta.slug || '—'}</div>
                                    </div>
                                </>
                            )}
                            {authorInfo && (
                                <div className="rounded-lg border border-zinc-200 bg-white p-4">
                                    <div className="text-xs font-semibold text-zinc-500 uppercase mb-2">Author</div>
                                    <div className="text-sm font-medium text-zinc-900">{authorInfo.name || '—'}</div>
                                    {authorInfo.bio && <div className="mt-1 text-xs text-zinc-600">{authorInfo.bio}</div>}
                                    {authorInfo.credentials && authorInfo.credentials.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {authorInfo.credentials.map((cred: string, i: number) => (
                                                <span key={i} className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded">
                                                    {cred}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            {contentStructure && (
                                <div className="rounded-lg border border-zinc-200 bg-white p-4">
                                    <div className="text-xs font-semibold text-zinc-500 uppercase mb-2">Structure</div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div><span className="text-zinc-500">H1:</span> <span className="font-medium">{contentStructure.h1_count || 0}</span></div>
                                        <div><span className="text-zinc-500">H2:</span> <span className="font-medium">{contentStructure.h2_count || 0}</span></div>
                                        <div><span className="text-zinc-500">H3:</span> <span className="font-medium">{contentStructure.h3_count || 0}</span></div>
                                        <div><span className="text-zinc-500">Images:</span> <span className="font-medium">{contentStructure.images_with_alt || 0}</span></div>
                                        <div><span className="text-zinc-500">Ext. links:</span> <span className="font-medium">{contentStructure.external_links?.length || 0}</span></div>
                                        <div><span className="text-zinc-500">Int. links:</span> <span className="font-medium">{contentStructure.internal_links?.length || 0}</span></div>
                                        <div className="col-span-2 flex items-center gap-2">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${contentStructure.has_toc ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>TOC</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${contentStructure.has_author_bio ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>Author Bio</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${contentStructure.has_table_or_list ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>Table/List</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${contentStructure.has_cta ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>CTA</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {schemaMarkup && (
                                <div className="rounded-lg border border-zinc-200 bg-white p-4">
                                    <div className="text-xs font-semibold text-zinc-500 uppercase mb-2">Schema Markup</div>
                                    <div className="grid grid-cols-2 gap-1 text-xs">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${schemaMarkup.article ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>Article</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${schemaMarkup.author ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>Author</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${schemaMarkup.organization ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>Organization</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${schemaMarkup.breadcrumb ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>Breadcrumb</span>
                                        {schemaMarkup.faq && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">FAQ</span>}
                                        {schemaMarkup.howto && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">HowTo</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="prose prose-sm max-w-none prose-zinc dark:prose-invert">
                        {status === 'generating' ? (
                            <div className="flex flex-col items-center justify-center h-64 text-zinc-400 gap-3">
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
        </div>
    )
}
