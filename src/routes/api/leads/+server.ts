import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RESEND_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
    try {
        console.log('API endpoint hit'); // Add this log
        const leadInfo = await request.json();
        console.log('Received lead info in API:', leadInfo); 
        
        let conversationHtml = '';
        if (leadInfo.conversationHistory) {
            console.log('Building conversation HTML...');
            conversationHtml = leadInfo.conversationHistory
                .map((msg: any) => `<p><strong>${msg.role}:</strong> ${msg.content}</p>`)
                .join('');
        }
        console.log('Attempting to send email via Resend...');
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'info@tracerlabs.io',
                to: 'subaiyalshk@tracerlabs.io',
                subject: 'New Lead from Website Chat',
                html: `
                    <h2>New Lead Details</h2>
                    <p><strong>Name:</strong> ${leadInfo.name || 'Not provided'}</p>
                    <p><strong>Email:</strong> ${leadInfo.email || 'Not provided'}</p>
                    <p><strong>Business Name:</strong> ${leadInfo.businessName || 'Not provided'}</p>
                    <p><strong>Project Goal:</strong> ${leadInfo.projectGoal || 'Not provided'}</p>
                    
                    <h3>Complete Conversation History</h3>
                    ${conversationHtml || 'No conversation history'}
                `
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Resend API error:', error);
            throw new Error('Failed to send email');
        }

        return json({ success: true });
    } catch (error) {
        console.error('Error processing lead:', error);
        return json({ error: 'Failed to process lead' }, { status: 500 });
    }
};