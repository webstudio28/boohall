import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArticlesGrid } from './articles-grid'

export default async function ArticlesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (!business) redirect('/onboarding')

    const { data: articles } = await supabase
        .from('articles')
        .select(`
            *,
            keyword:keywords(keyword)
        `)
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-zinc-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Saved Articles
                    </h2>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
                    >
                        Create New
                    </Link>
                </div>
            </div>

            {(!articles || articles.length === 0) ? (
                <div className="text-center py-12 bg-white rounded-lg border border-zinc-200 border-dashed">
                    <h3 className="mt-2 text-sm font-semibold text-zinc-900">No articles</h3>
                    <p className="mt-1 text-sm text-zinc-500">Get started by creating a new article from the Dashboard.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <ArticlesGrid articles={articles} />
                </div>
            )}
        </div>
    )
}
