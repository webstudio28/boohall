'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function signInWithGoogle() {
    const supabase = await createClient()

    // Get the site URL strictly from environment variables to avoid 'origin' header issues.
    // This is the standard reliable pattern for Vercel + Supabase.
    let redirectUrl = process.env.NEXT_PUBLIC_SITE_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
        'http://localhost:3000'

    console.log('SignInWithGoogle: Resolved redirectUrl:', redirectUrl)

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${redirectUrl}/auth/callback`,
        },
    })

    if (error) {
        console.error(error)
        redirect('/login?error=Could not initiate Google Login')
    }

    if (data.url) {
        redirect(data.url)
    }
}
