import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RESEND_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
    try {
        console.log('Early access form submission received');
        const formData = await request.json();
        console.log('Form data:', formData);
        
        // Send email notification using Resend
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'info@tracerlabs.io',
                to: 'subaiyalshk@tracerlabs.io',
                subject: 'Beastmode - New Early Access Request',
                html: `
                    <h2>New Early Access Request</h2>
                    <p><strong>Name:</strong> ${formData.name}</p>
                    <p><strong>Email:</strong> ${formData.email}</p>
                    <p><strong>User Type:</strong> ${formData.userType}</p>
                    <p><strong>Interest:</strong> ${formData.interest}</p>
                `
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Resend API error:', error);
            throw new Error('Failed to send email notification');
        }

        return json({ success: true });
    } catch (error) {
        console.error('Error processing early access request:', error);
        return json({ error: 'Failed to process request' }, { status: 500 });
    }
};