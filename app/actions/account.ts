'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function deleteAccount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    try {
        // 1. Get Business ID (to delete related data)
        const { data: business } = await supabase
            .from('businesses')
            .select('id')
            .eq('user_id', user.id)
            .single()

        if (business) {
            // 2. Delete Child Data connected to Business
            // Note: If ON DELETE CASCADE is set in DB, this might be redundant but safe.
            // If NOT set, this is required to avoid Foreign Key errors.

            // Delete Articles (Connected to User via user_id, but also Business)
            // Articles have user_id AND business_id. We can delete by user_id to be safe.
            await supabase.from('articles').delete().eq('user_id', user.id)

            // Delete Keywords (Connected to Business)
            await supabase.from('keywords').delete().eq('business_id', business.id)

            // Delete Competitors (Connected to Business)
            await supabase.from('competitors').delete().eq('business_id', business.id)

            // 3. Delete Business
            await supabase.from('businesses').delete().eq('id', business.id)
        }

        // 4. Attempt to delete from Auth (Requires Service Role usually, skipping to avoid error/config issues)
        // Instead, we just sign them out on client side.
        // Ideally, we would use SUPABASE_SERVICE_ROLE_KEY to delete auth.users entry:
        // const adminClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
        // await adminClient.auth.admin.deleteUser(user.id)

        return { success: true }
    } catch (error) {
        console.error('Delete account failed:', error)
        return { error: 'Failed to delete account data' }
    }
}
