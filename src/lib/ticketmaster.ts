import { Concert, TicketmasterEvent, TicketmasterResponse } from '@/types/event';

const TICKETMASTER_API_BASE = 'https://app.ticketmaster.com/discovery/v2';

/**
 * Transform Ticketmaster event to our Concert type
 */
function transformEvent(event: TicketmasterEvent): Concert {
    const venue = event._embedded?.venues?.[0];
    const image = event.images?.find(img => img.ratio === '16_9' && img.width >= 500)
        || event.images?.[0];

    return {
        id: event.id,
        name: event.name,
        date: event.dates.start.localDate,
        time: event.dates.start.localTime,
        venue: venue?.name || 'Ukjent sted',
        city: venue?.city?.name || 'Ukjent by',
        imageUrl: image?.url || '/placeholder-concert.jpg',
        url: event.url,
        priceRange: event.priceRanges?.[0] ? {
            min: event.priceRanges[0].min,
            max: event.priceRanges[0].max,
            currency: event.priceRanges[0].currency,
        } : undefined,
    };
}

/**
 * Fetch upcoming events in Norway
 * Categories: music, arts & theatre, sports, family, miscellaneous
 */
export async function getUpcomingConcerts(options?: {
    keyword?: string;
    size?: number;
    page?: number;
    category?: string; // 'music' | 'arts' | 'sports' | 'family' | 'miscellaneous' | 'all'
}): Promise<{ concerts: Concert[]; totalPages: number; totalElements: number; currentPage: number }> {
    const apiKey = process.env.TICKETMASTER_API_KEY;

    if (!apiKey) {
        console.error('Missing TICKETMASTER_API_KEY environment variable');
        return { concerts: [], totalPages: 0, totalElements: 0, currentPage: 0 };
    }

    const params = new URLSearchParams({
        apikey: apiKey,
        countryCode: 'NO',
        size: String(options?.size || 200),
        page: String(options?.page || 0),
        sort: 'date,asc',
    });

    // Add category filter if specified (not 'all')
    if (options?.category && options.category !== 'all') {
        params.set('classificationName', options.category);
    }

    if (options?.keyword) {
        params.set('keyword', options.keyword);
    }

    try {
        const response = await fetch(
            `${TICKETMASTER_API_BASE}/events.json?${params}`,
            { next: { revalidate: 300 } } // Cache for 5 minutes
        );

        if (!response.ok) {
            console.error('Ticketmaster API error:', response.status);
            return { concerts: [], totalPages: 0, totalElements: 0, currentPage: 0 };
        }

        const data: TicketmasterResponse = await response.json();

        if (!data._embedded?.events) {
            return { concerts: [], totalPages: 0, totalElements: 0, currentPage: 0 };
        }

        return {
            concerts: data._embedded.events.map(transformEvent),
            totalPages: data.page?.totalPages || 1,
            totalElements: data.page?.totalElements || data._embedded.events.length,
            currentPage: data.page?.number || 0,
        };
    } catch (error) {
        console.error('Failed to fetch concerts:', error);
        return { concerts: [], totalPages: 0, totalElements: 0, currentPage: 0 };
    }
}

/**
 * Get details for a specific event
 */
export async function getEventDetails(eventId: string): Promise<Concert | null> {
    const apiKey = process.env.TICKETMASTER_API_KEY;

    if (!apiKey) {
        console.error('Missing TICKETMASTER_API_KEY environment variable');
        return null;
    }

    try {
        const response = await fetch(
            `${TICKETMASTER_API_BASE}/events/${eventId}.json?apikey=${apiKey}`,
            { next: { revalidate: 60 } }
        );

        if (!response.ok) {
            return null;
        }

        const event: TicketmasterEvent = await response.json();
        return transformEvent(event);
    } catch (error) {
        console.error('Failed to fetch event details:', error);
        return null;
    }
}

/**
 * Check if resale tickets are available for an event
 * This checks the event details for resale indicators
 */
export async function checkResaleAvailability(eventId: string): Promise<{
    hasResale: boolean;
    info?: string;
}> {
    const apiKey = process.env.TICKETMASTER_API_KEY;

    if (!apiKey) {
        return { hasResale: false };
    }

    try {
        const response = await fetch(
            `${TICKETMASTER_API_BASE}/events/${eventId}.json?apikey=${apiKey}`,
            { cache: 'no-store' } // Always fetch fresh for resale check
        );

        if (!response.ok) {
            return { hasResale: false };
        }

        const event: TicketmasterEvent = await response.json();

        // Check for resale indicators:
        // 1. ticketLimit info mentioning resale
        // 2. priceRanges with type containing 'resale'
        // 3. Event status

        const hasResalePriceRange = event.priceRanges?.some(
            pr => pr.type?.toLowerCase().includes('resale')
        );

        const ticketLimitMentionsResale = event.ticketLimit?.info
            ?.toLowerCase()
            .includes('resale');

        const hasResale = Boolean(hasResalePriceRange || ticketLimitMentionsResale);

        return {
            hasResale,
            info: hasResale
                ? 'Videresolgte billetter tilgjengelig!'
                : 'Ingen videresolgte billetter funnet',
        };
    } catch (error) {
        console.error('Failed to check resale:', error);
        return { hasResale: false };
    }
}
