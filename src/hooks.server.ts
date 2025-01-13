import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit'
import { redirect, type Handle } from '@sveltejs/kit'

const ALLOWED_ORIGINS = [
    'https://www.tracerlabs.io',
    'https://beastmode.tracerlabs.io'
]

export const handle: Handle = async ({ event, resolve }) => {
    // Handle preflight requests
    if (event.request.method === 'OPTIONS') {
        const response = new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(event.request.headers.get('origin') || '') 
                    ? event.request.headers.get('origin') || ALLOWED_ORIGINS[0]
                    : ALLOWED_ORIGINS[0],
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': '3600'
            }
        });
        return response;
    }

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

    if (!session && !isPublicPath) {
        throw redirect(303, '/login')
    }

    const response = await resolve(event, {
        filterSerializedResponseHeaders(name) {
            return name === 'content-range'
        },
    })

    const requestOrigin = event.request.headers.get('origin')
    if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) {
        response.headers.set('Access-Control-Allow-Origin', requestOrigin)
    } else {
        response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0])
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '3600')

    return response
}