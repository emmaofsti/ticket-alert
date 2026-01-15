import { NextRequest, NextResponse } from 'next/server';
import { getTrackedEvents, markEventNotified } from '@/lib/supabase';
import { checkResaleAvailability, getEventDetails } from '@/lib/ticketmaster';
import { sendTicketAlertEmail } from '@/lib/email';

// This endpoint checks all tracked events for resale availability
// and sends email notifications when tickets are found
export async function GET(request: NextRequest) {
    // Simple auth check - in production use a proper secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get all tracked events that haven't been notified yet
        const trackedEvents = await getTrackedEvents();

        if (trackedEvents.length === 0) {
            return NextResponse.json({
                message: 'Ingen arrangementer å sjekke',
                checked: 0,
                notified: 0,
            });
        }

        let notifiedCount = 0;
        const results: Array<{ eventId: string; hasResale: boolean; notified: boolean }> = [];

        // Check each event for resale availability
        for (const tracked of trackedEvents) {
            const resaleCheck = await checkResaleAvailability(tracked.event_id);

            if (resaleCheck.hasResale) {
                // Get event details for the email
                const eventDetails = await getEventDetails(tracked.event_id);

                if (eventDetails) {
                    // Send notification email
                    const emailResult = await sendTicketAlertEmail({
                        to: tracked.email,
                        eventName: eventDetails.name,
                        eventDate: eventDetails.date,
                        venue: `${eventDetails.venue}, ${eventDetails.city}`,
                        ticketmasterUrl: eventDetails.url,
                    });

                    if (emailResult.success) {
                        // Mark as notified so we don't send again
                        await markEventNotified(tracked.id);
                        notifiedCount++;
                    }

                    results.push({
                        eventId: tracked.event_id,
                        hasResale: true,
                        notified: emailResult.success,
                    });
                }
            } else {
                results.push({
                    eventId: tracked.event_id,
                    hasResale: false,
                    notified: false,
                });
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        return NextResponse.json({
            message: `Sjekket ${trackedEvents.length} arrangementer`,
            checked: trackedEvents.length,
            notified: notifiedCount,
            results,
        });
    } catch (error) {
        console.error('Error in check-and-notify:', error);
        return NextResponse.json(
            { error: 'Feil ved sjekking av arrangementer' },
            { status: 500 }
        );
    }
}
