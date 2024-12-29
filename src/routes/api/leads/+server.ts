import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RESEND_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const leadInfo = await request.json();
        
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'info@tracerlabs.io',
                to: 'subaiyalshk@tracerlabs.io', // Replace with your email
                subject: 'New Lead from Website Chat',
                html: `
                    <h2>New Lead Details</h2>
                    <p><strong>Email:</strong> ${leadInfo.email}</p>
                    <p><strong>Project Goal:</strong> ${leadInfo.projectGoal || 'Not provided'}</p>
                    <p><strong>Timeline:</strong> ${leadInfo.timeline || 'Not provided'}</p>
                    <p><strong>Budget:</strong> ${leadInfo.budget || 'Not provided'}</p>
                    <p><strong>Tech Preferences:</strong> ${leadInfo.techPreferences || 'Not provided'}</p>
                    <p><strong>Agency Experience:</strong> ${leadInfo.agencyExperience || 'Not provided'}</p>
                    
                    <h3>Conversation History</h3>
                    ${leadInfo.conversationHistory ? 
                      leadInfo.conversationHistory.map((msg: any) => 
                        `<p><strong>${msg.role}:</strong> ${msg.content}</p>`
                      ).join('') : 'No conversation history'}
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