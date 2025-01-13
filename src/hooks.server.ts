import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit'
import { redirect, type Handle } from '@sveltejs/kit'

// Define allowed origins
const ALLOWED_ORIGINS = [
    'https://www.tracerlabs.io',
    'https://beastmode.tracerlabs.io'
]

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

    // Get the origin from the request headers
    const requestOrigin = event.request.headers.get('origin')

    // If the request origin is in our allowed list, set it as the allowed origin
    if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) {
        response.headers.set('Access-Control-Allow-Origin', requestOrigin)
    } else {
        // Default to the first allowed origin if no match or no origin header
        response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0])
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.set('Access-Control-Allow-Credentials', 'true')

    return response
}