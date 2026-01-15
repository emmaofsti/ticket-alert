import { NextRequest, NextResponse } from 'next/server';
import { checkResaleAvailability } from '@/lib/ticketmaster';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('eventId');

    if (!eventId) {
        return NextResponse.json(
            { error: 'eventId parameter er påkrevd' },
            { status: 400 }
        );
    }

    try {
        const result = await checkResaleAvailability(eventId);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to check resale:', error);
        return NextResponse.json(
            { error: 'Kunne ikke sjekke videresalg' },
            { status: 500 }
        );
    }
}
