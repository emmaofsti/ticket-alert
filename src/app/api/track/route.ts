import { NextRequest, NextResponse } from 'next/server';
import { saveTrackingSubscription } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { eventId, eventName, email } = body;

        // Validate input
        if (!eventId || !email) {
            return NextResponse.json(
                { error: 'eventId og email er påkrevd' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Ugyldig e-postformat' },
                { status: 400 }
            );
        }

        // Save to Supabase
        const result = await saveTrackingSubscription(
            eventId,
            eventName || 'Ukjent arrangement',
            email
        );

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Du vil nå motta varsel når billetter blir tilgjengelige',
        });
    } catch (error) {
        console.error('Failed to save tracking:', error);
        return NextResponse.json(
            { error: 'Kunne ikke lagre sporing' },
            { status: 500 }
        );
    }
}
