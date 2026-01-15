import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { dictionaries } from '@/utils/dictionaries'
import { cookies } from 'next/headers'
import { LanguageToggle } from '@/components/language-toggle'
import { CompetitorList } from '@/components/competitor-list'
import { RefreshKeywordsButton } from '../../../components/refresh-keywords-btn'
import { DebugKeywords } from '../../../components/debug-keywords'
import { regenerateNiche, regenerateCompetitors } from './actions'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .single()

    if (!business) redirect('/onboarding')

    // Fetch related data in parallel
    const [competitorsRes, keywordsRes] = await Promise.all([
        supabase.from('competitors').select('*').eq('business_id', business.id).order('created_at', { ascending: false }),
        supabase.from('keywords').select('*').eq('business_id', business.id).order('volume', { ascending: false }),
    ])

    const competitors = competitorsRes.data || []
    const keywords = keywordsRes.data || []
    const analysis = business.analysis || {}

    const cookieStore = await cookies()
    const lang = (cookieStore.get('NEXT_LOCALE')?.value as 'bg' | 'en') || 'bg'
    const dict = dictionaries[lang]

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-zinc-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        {dict.dashboard.title}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                        {dict.dashboard.strategyFor} {business.website_url}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-zinc-100 px-2 py-1 rounded text-zinc-600 uppercase">
                            {business.language === 'bg' ? '🇧🇬 ' + dict.common.bg : '🇬🇧 ' + dict.common.en}
                        </span>
                    </div>
                    <LanguageToggle currentLang={lang} />
                </div>
            </div>

            {/* 1. Research Summary */}
            <section className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 relative group">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-zinc-900">{dict.dashboard.sections.niche}</h3>
                    <div className="flex flex-col items-end gap-1">
                        <form action={async () => {
                            'use server'
                            await regenerateNiche()
                        }}>
                            <button
                                type="submit"
                                className="text-xs text-zinc-500 hover:text-black border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded px-2 py-1 transition-colors"
                                title="Regenerate Niche Analysis"
                            >
                                ↻ Refresh Data
                            </button>
                        </form>
                        <span className="text-[10px] text-zinc-400 max-w-[200px] text-right leading-tight hidden group-hover:block">
                            Ако представения текст от предишното генериране описва най-добре вашия бизнес не е нужно да го генерирате наново
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        <div>
                            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{dict.dashboard.sections.summary}</span>
                            <p className="mt-1 text-zinc-700">{analysis.summary || 'Analysis pending...'}</p>
                        </div>
                        <div>
                            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{dict.dashboard.sections.intentMix}</span>
                            <p className="mt-1 text-zinc-700">{analysis.intent_mix || 'Unknown'}</p>
                        </div>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-100">
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{dict.dashboard.sections.angles}</span>
                        <ul className="mt-2 space-y-2">
                            {(analysis.angles || []).map((angle: string, i: number) => (
                                <li key={i} className="flex gap-2 text-sm text-zinc-700">
                                    <span className="text-blue-600 font-bold">•</span>
                                    {angle}
                                </li>
                            ))}
                            {!analysis.angles?.length && <li className="text-sm text-zinc-400 italic">{dict.dashboard.empty.angles}</li>}
                        </ul>
                    </div>
                </div>
            </section>

            {/* 2. Competitors */}
            <section className="relative group/comp">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-zinc-900">{dict.dashboard.sections.competitors}</h3>
                    <div className="flex flex-col items-end gap-1">
                        <form action={async () => {
                            'use server'
                            await regenerateCompetitors()
                        }}>
                            <button
                                type="submit"
                                className="text-xs text-zinc-500 hover:text-black border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded px-2 py-1 transition-colors"
                            >
                                ↻ Refresh Competitors
                            </button>
                        </form>
                        <span className="text-[10px] text-zinc-400 max-w-[200px] text-right leading-tight hidden group-hover/comp:block">
                            При рефреш ще получите 20те най-свързани конкурентни сайтове
                        </span>
                    </div>
                </div>
                <CompetitorList
                    competitors={competitors}
                    emptyMessage={dict.dashboard.empty.competitors}
                />
            </section>

            {/* 3. Keyword Opportunities */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-zinc-900">{dict.dashboard.sections.keywords}</h3>
                    <div className="flex items-center gap-2">
                        <RefreshKeywordsButton />
                        <DebugKeywords />
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-zinc-200 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-zinc-200">
                            <thead className="bg-zinc-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{dict.dashboard.table.keyword}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{dict.dashboard.table.volume}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        <div className="flex items-center gap-1 group relative w-fit">
                                            {dict.dashboard.table.difficulty}
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-help text-zinc-400 hover:text-zinc-600"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>

                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block w-48 p-3 bg-zinc-800 text-white text-[10px] rounded shadow-xl z-50 normal-case font-normal leading-relaxed text-left">
                                                <div className="space-y-2">
                                                    <div>
                                                        <span className="text-green-300 font-bold block">Easy (0-30)</span>
                                                        <span className="opacity-90">Low competition, rankable with content.</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-yellow-300 font-bold block">Medium (31-60)</span>
                                                        <span className="opacity-90">Moderate, needs 3-5 focused articles.</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-red-300 font-bold block">Hard (61-100)</span>
                                                        <span className="opacity-90">High competition, requires authority.</span>
                                                    </div>
                                                </div>
                                                {/* Arrow */}
                                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800 rotate-45"></div>
                                            </div>
                                        </div>
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{dict.dashboard.table.intent}</th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">{dict.dashboard.table.actions}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-zinc-200">
                                {keywords.map((kw) => (
                                    <tr key={kw.id} className="hover:bg-zinc-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">{kw.keyword}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{kw.volume}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                         ${kw.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                                    kw.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'}`}>
                                                {kw.difficulty}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{kw.intent}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                href={`/editor/new?keyword=${encodeURIComponent(kw.id)}`}
                                                className="text-black hover:text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-md transition-colors"
                                            >
                                                {dict.dashboard.table.create}
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {keywords.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-zinc-500">
                                            {dict.dashboard.table.loading}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    )
}
