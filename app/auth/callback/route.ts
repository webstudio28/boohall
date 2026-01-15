import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        console.log('Callback received code:', code)
        const supabase = await createClient()
        const { error, data } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()
            console.log('Session exchange successful. User:', user?.id)

            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'

            if (isLocalEnv) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                console.log('Redirecting to origin (Local):', `${origin}${next}`)
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                console.log('Redirecting to forwarded host:', `https://${forwardedHost}${next}`)
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                console.log('Redirecting to origin (Prod):', `${origin}${next}`)
                return NextResponse.redirect(`${origin}${next}`)
            }
        } else {
            console.error('Exchange Code Error:', error)
        }
    } else {
        console.log('No code found in callback URL')
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?message=Could not login with provider`)
}
