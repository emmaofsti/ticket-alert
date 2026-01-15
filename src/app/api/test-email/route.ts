import { NextRequest, NextResponse } from 'next/server';
import { sendTicketAlertEmail } from '@/lib/email';

// Test endpoint to verify email sending works
// Usage: POST /api/test-email with { "email": "your@email.com" }
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email er påkrevd' },
                { status: 400 }
            );
        }

        const result = await sendTicketAlertEmail({
            to: email,
            eventName: 'Aurora - What Happened To The Heart Tour (TEST)',
            eventDate: '2026-03-15',
            venue: 'Oslo Spektrum, Oslo',
            ticketmasterUrl: 'https://www.ticketmaster.no',
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: `Test-e-post sendt til ${email}`,
            });
        } else {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Test email error:', error);
        return NextResponse.json(
            { error: 'Kunne ikke sende test-e-post' },
            { status: 500 }
        );
    }
}
