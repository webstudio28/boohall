import { createClient } from '@/utils/supabase/server'
import { Plus } from 'lucide-react'
import { CompetitorsClient } from './page-client'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function CompetitorsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: analyses } = await supabase
        .from('competitor_analyses')
        .select('*')
        .order('created_at', { ascending: false })

    // We pass the data to a client component to handle the modal state
    return <CompetitorsClient initialAnalyses={analyses || []} />
}
