export const config = {
    runtime: 'edge',
    regions: ['all'],
  };
  
  export function load() {
    return {
      headers: {
        'Content-Security-Policy': "frame-ancestors 'self' https://*.vercel.app https://*.subaiyalshk.com",
        'X-Frame-Options': 'SAMEORIGIN'
      }
    };
  }