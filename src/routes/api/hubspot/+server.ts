import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { HUBSPOT_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const leadInfo = await request.json();
        console.log('Received lead info:', leadInfo);

        // Create lead
        const leadResponse = await fetch('https://api.hubapi.com/crm/v3/objects/leads', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify({
                properties: {
                    email: leadInfo.email,
                    firstname: leadInfo.firstName,
                    lastname: leadInfo.lastName,
                    company: leadInfo.company,
                    project_goal: leadInfo.projectGoal,
                    timeline: leadInfo.timeline,
                    budget: leadInfo.budget,
                    technology_preferences: leadInfo.techPreferences,
                    agency_experience: leadInfo.agencyExperience
                }
            })
        });

        if (!leadResponse.ok) {
            const errorData = await leadResponse.json();
            console.error('HubSpot lead creation failed:', errorData);
            return json({ 
                error: 'Failed to create lead',
                details: errorData 
            }, { status: leadResponse.status });
        }

        const leadData = await leadResponse.json();
        console.log('Lead created successfully:', leadData);

        return json({ 
            success: true,
            lead: leadData
        });
    } catch (error) {
        console.error('Error processing HubSpot request:', error);
        return json({ 
            error: 'Failed to process request',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
};