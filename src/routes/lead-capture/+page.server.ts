export const config = {
    runtime: 'edge',
    regions: ['iad1']
  };
  
  export function load() {
    return {
      headers: {
        // Note that we're modifying the frame-ancestors to explicitly include your domain
        'Content-Security-Policy': "frame-ancestors 'self' https://www.tracerlabs.io https://tracerlabs.io https://*.tracerlabs.io https://*.vercel.app https://*.subaiyalshk.com",
        // Remove SAMEORIGIN since we want to allow your domain
        'X-Frame-Options': 'ALLOW-FROM https://www.tracerlabs.io',
        'Access-Control-Allow-Origin': 'https://www.tracerlabs.io',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  }