import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit'
import { redirect, type Handle } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.supabase = createSupabaseServerClient({
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        event,
    })

    event.locals.getSession = async () => {
        const {
            data: { session },
        } = await event.locals.supabase.auth.getSession()
        return session
    }

    // Check authentication
    const session = await event.locals.getSession()
    const publicPaths = ['/login', '/register', '/reset-password', '/lead-capture', '/api/leads', '/api/beastmode-earlyaccess']
    const isPublicPath = publicPaths.some(path => 
        event.url.pathname.startsWith(path)
    )

    // If no session and trying to access protected route, redirect to login
    if (!session && !isPublicPath) {
        throw redirect(303, '/login')
    }

    // Add CORS headers for lead-capture
    const response = await resolve(event, {
        filterSerializedResponseHeaders(name) {
            return name === 'content-range'
        },
    })

    // Keep your existing CORS headers
    response.headers.append('Access-Control-Allow-Origin', 'https://www.tracerlabs.io')
    response.headers.append('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.append('Access-Control-Allow-Headers', 'Content-Type')

    return response
}