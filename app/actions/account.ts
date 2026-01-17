'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function deleteAccount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Initialize Admin Client if available (God Mode)
    let db = supabase
    let authAdmin = null

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient: createAdminClient } = await import('@supabase/supabase-js')
        const adminClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )
        db = adminClient
        authAdmin = adminClient.auth.admin
    }

    try {
        // 0. Delete Storage Objects (Images)
        try {
            // Using `db` (potentially admin) to bypass policies
            const { data: userFiles } = await db.storage.from('product_images').list(user.id)

            if (userFiles && userFiles.length > 0) {
                const filesToRemove = userFiles.map(x => `${user.id}/${x.name}`)
                const { error: removeError } = await db.storage.from('product_images').remove(filesToRemove)
                if (removeError) console.error('Storage remove error:', removeError)
            }
        } catch (e) {
            console.warn('Storage cleanup non-fatal error:', e)
        }

        // 1. Delete User-linked Data
        // We use `db` which might be adminClient, bypassing RLS.

        // Delete Service Descriptions
        const { error: serviceError } = await db.from('service_descriptions').delete().eq('user_id', user.id)
        if (serviceError) console.error('Service delete error:', serviceError)

        // Delete Product Descriptions
        const { error: productError } = await db.from('product_descriptions').delete().eq('user_id', user.id)
        if (productError) console.error('Product delete error:', productError)

        // Delete Articles
        const { error: articleError } = await db.from('articles').delete().eq('user_id', user.id)
        if (articleError) console.error('Article delete error:', articleError)

        // 2. Get Business ID (to delete related data)
        const { data: business } = await db
            .from('businesses')
            .select('id')
            .eq('user_id', user.id)
            .single()

        if (business) {
            // 3. Delete Business-Child Data
            await db.from('keywords').delete().eq('business_id', business.id)
            await db.from('competitors').delete().eq('business_id', business.id)

            // 4. Delete Business
            const { error: busError } = await db.from('businesses').delete().eq('id', business.id)
            if (busError) console.error('Business delete error:', busError)
        }

        // 5. Delete from Auth (Requires Service Role)
        if (authAdmin) {
            const { error: deleteError } = await authAdmin.deleteUser(user.id)
            if (deleteError) {
                console.error('Auth deletion failed:', deleteError)
                // Do not fail the action if only auth delete fails, as data is gone.
            } else {
                console.log('User deleted from Auth system')
            }
        } else {
            console.warn('Skipping Auth deletion: Missing SUPABASE_SERVICE_ROLE_KEY')
        }

        return { success: true }
    } catch (error) {
        console.error('Delete account failed:', error)
        return { error: 'Failed to delete account data' }
    }
}
