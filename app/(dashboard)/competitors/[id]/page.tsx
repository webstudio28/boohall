import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import AnalysisDetailView from './view'

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: analysis } = await supabase
        .from('competitor_analyses')
        .select('*')
        .eq('id', id)
        .single()

    if (!analysis) {
        notFound()
    }

    // Verify ownership via RLS normally handles this, but single() might throw error if empty
    // The query above will return null data if no access/not found due to RLS policies.

    return <AnalysisDetailView analysis={analysis} />
}
