export function load() {
    return {
        headers: {
            'X-Frame-Options': 'SAMEORIGIN',
            'Content-Security-Policy': "frame-ancestors 'self' *"
        }
    };
}