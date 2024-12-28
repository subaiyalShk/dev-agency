export const config = {
    runtime: 'edge',
    regions: ['iad1'] // Using Washington DC region, you can change this to the closest region to your users
  };
  
  export function load() {
    return {
      headers: {
        'Content-Security-Policy': "frame-ancestors 'self' https://*.vercel.app https://*.subaiyalshk.com",
        'X-Frame-Options': 'SAMEORIGIN'
      }
    };
  }