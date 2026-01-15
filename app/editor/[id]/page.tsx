import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import EditorInterface from './client-editor' // We'll make a client component for interaction

export default async function EditorPage({
    params,
}: {
    params: { id: string }
}) {
    const supabase = await createClient()
    // await params (Nextjs 15 breaking change fix) if needed, but in 14 it's sync. 
    // Wait, Next 15 params are async. Assuming Next 14 or implementing for 15. 
    // The 'create-next-app' output said installed 'next 16.1.1' (Canary?) No, 'next 15' usually.
    // Wait, output said "Installing dependencies: - next". Package.json said "next": "16.1.1". Is that real?
    // Next 15+ params are async. I should await it.

    const { id } = await (params as any); // Safe cast for async params if newer nextjs

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: article } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single()

    if (!article) redirect('/dashboard')

    return (
        <div className="flex flex-col h-screen bg-white">
            <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3">
                <div className="flex items-center gap-4">
                    <Link href="/articles" className="text-sm font-medium text-zinc-500 hover:text-black">← Articles</Link>
                    <div className="h-4 w-px bg-zinc-200"></div>
                    <h1 className="text-sm font-semibold text-zinc-900 truncate max-w-md">{article.title || 'Untitled'}</h1>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide border ${article.content ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                        {article.content ? 'Completed' : 'Generating'}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400">Autosaved</span>
                </div>
            </header>

            <main className="flex-1 overflow-hidden">
                <EditorInterface initialArticle={article} />
            </main>
        </div>
    )
}
