import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Sidebar } from '@/components/sidebar'

import { UserNav } from '@/components/user-nav'
import { cookies } from 'next/headers'
import { dictionaries, Lang } from '@/utils/dictionaries'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if business exists
    const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (!business) {
        redirect('/onboarding')
    }

    // Language logic
    const cookieStore = await cookies()
    const lang = (cookieStore.get('NEXT_LOCALE')?.value || 'en') as Lang
    const dict = dictionaries[lang] || dictionaries.en

    return (
        <div className="min-h-screen bg-zinc-50">
            <Sidebar dict={dict} />
            <div className="pl-64 flex flex-col min-h-screen">
                <header className="sticky top-0 z-40 flex h-16 items-center justify-end gap-x-4 border-b border-zinc-200 bg-white px-6 shadow-sm">
                    <UserNav />
                </header>
                <main className="flex-1 py-8">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
