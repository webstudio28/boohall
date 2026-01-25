import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { createArticle } from '../actions'
import { AuthorFields } from '@/app/(dashboard)/articles/author-fields'

export default async function NewArticlePage({
    searchParams,
}: {
    searchParams: Promise<{ keyword?: string }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { keyword: keywordId } = await searchParams
    if (!keywordId) redirect('/dashboard')

    // Fetch keyword text for display
    const { data: keyword } = await supabase
        .from('keywords')
        .select('keyword')
        .eq('id', keywordId)
        .single()

    if (!keyword) redirect('/dashboard')

    // Fetch saved authors
    const { data: savedAuthors } = await supabase
        .from('saved_authors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50">
            <div className="w-full max-w-lg space-y-8 bg-white p-8 rounded-xl border border-zinc-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create Article</h1>
                    <p className="text-zinc-600 mt-2">
                        Targeting keyword: <span className="font-semibold text-black">{keyword.keyword}</span>
                    </p>
                </div>

                <form action={createArticle} className="space-y-6">
                    <input type="hidden" name="keywordId" value={keywordId} />

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700">Article Goal</label>
                            <div className="mt-2 grid grid-cols-3 gap-3">
                                {['Inform', 'Compare', 'Convert'].map((goal) => (
                                    <label key={goal} className="cursor-pointer">
                                        <input type="radio" name="goal" value={goal} className="peer sr-only" required defaultChecked={goal === 'Inform'} />
                                        <div className="rounded-md border border-zinc-200 bg-white px-3 py-3 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-50 peer-checked:border-black peer-checked:bg-zinc-900 peer-checked:text-white peer-focus:ring-2 peer-focus:ring-black peer-focus:ring-offset-2">
                                            {goal}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700">Tone of Voice</label>
                            <div className="mt-2 grid grid-cols-3 gap-3">
                                {['Neutral', 'Expert', 'Friendly'].map((tone) => (
                                    <label key={tone} className="cursor-pointer">
                                        <input type="radio" name="tone" value={tone} className="peer sr-only" required defaultChecked={tone === 'Expert'} />
                                        <div className="rounded-md border border-zinc-200 bg-white px-3 py-3 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-50 peer-checked:border-black peer-checked:bg-zinc-900 peer-checked:text-white peer-focus:ring-2 peer-focus:ring-black peer-focus:ring-offset-2">
                                            {tone}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <AuthorFields savedAuthors={savedAuthors || []} />
                    </div>

                    <button
                        type="submit"
                        className="flex w-full justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                    >
                        Generate Article Outline
                    </button>
                </form>
            </div>
        </div>
    )
}
