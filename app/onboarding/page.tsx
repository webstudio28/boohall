import { saveBusinessContext } from './actions'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { dictionaries } from '@/utils/dictionaries'
import { cookies } from 'next/headers'
import { LanguageToggle } from '@/components/language-toggle'

export default async function OnboardingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if business already exists
    const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (business) {
        redirect('/dashboard')
    }

    const cookieStore = await cookies()
    const lang = (cookieStore.get('NEXT_LOCALE')?.value as 'bg' | 'en') || 'bg'
    const dict = dictionaries[lang]

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50">
            <div className="absolute top-4 right-4">
                <LanguageToggle currentLang={lang} />
            </div>
            <div className="w-full max-w-lg space-y-8 bg-white p-8 rounded-xl border border-zinc-200 shadow-sm">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">{dict.onboarding.title}</h1>
                    <p className="text-zinc-600">
                        {dict.onboarding.subtitle}
                    </p>
                </div>

                <form action={saveBusinessContext} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="businessType" className="block text-sm font-medium text-zinc-700">{dict.onboarding.fields.businessType}</label>
                            <select
                                name="businessType"
                                id="businessType"
                                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-black focus:ring-black sm:text-sm"
                            >
                                <option value="SaaS">{dict.onboarding.options.saas}</option>
                                <option value="Ecommerce">{dict.onboarding.options.ecommerce}</option>
                                <option value="Agency">{dict.onboarding.options.agency}</option>
                                <option value="Blog">{dict.onboarding.options.blog}</option>
                                <option value="Other">{dict.onboarding.options.other}</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="websiteUrl" className="block text-sm font-medium text-zinc-700">{dict.onboarding.fields.websiteUrl}</label>
                            <input
                                type="url"
                                name="websiteUrl"
                                id="websiteUrl"
                                placeholder="https://example.com"
                                required
                                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-black focus:ring-black sm:text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="targetCountry" className="block text-sm font-medium text-zinc-700">{dict.onboarding.fields.targetCountry}</label>
                                <input
                                    type="text"
                                    name="targetCountry"
                                    id="targetCountry"
                                    placeholder="e.g. Bulgaria"
                                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-black focus:ring-black sm:text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="language" className="block text-sm font-medium text-zinc-700">{dict.onboarding.fields.language}</label>
                                <select
                                    name="language"
                                    id="language"
                                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-black focus:ring-black sm:text-sm"
                                    defaultValue={lang}
                                >
                                    <option value="bg">Bulgarian 🇧🇬</option>
                                    <option value="en">English 🇬🇧</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="productDescription" className="block text-sm font-medium text-zinc-700">
                                {dict.onboarding.fields.description}
                            </label>
                            <textarea
                                name="productDescription"
                                id="productDescription"
                                rows={4}
                                required
                                placeholder={dict.onboarding.fields.descriptionPlaceholder}
                                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-black focus:ring-black sm:text-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="flex w-full justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                    >
                        {dict.onboarding.fields.submit}
                    </button>
                </form>
            </div>
        </div>
    )
}
