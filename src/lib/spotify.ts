/**
 * Spotify API integration for fetching user's top artists
 */

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export interface SpotifyArtist {
    id: string;
    name: string;
    popularity: number;
    images: { url: string; height: number; width: number }[];
    genres: string[];
}

export interface SpotifyUserProfile {
    id: string;
    display_name: string;
    images: { url: string }[];
}

export interface SpotifyTopArtistsResponse {
    items: SpotifyArtist[];
    total: number;
    limit: number;
    offset: number;
}

/**
 * Generate Spotify OAuth authorization URL
 */
export function getSpotifyAuthUrl(): string {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI ||
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/spotify-callback`;

    if (!clientId) {
        throw new Error('Missing SPOTIFY_CLIENT_ID environment variable');
    }

    const scopes = ['user-top-read', 'user-read-private'];

    const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: scopes.join(' '),
        show_dialog: 'true',
    });

    return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
}> {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI ||
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/spotify-callback`;

    if (!clientId || !clientSecret) {
        throw new Error('Missing Spotify credentials');
    }

    const response = await fetch(SPOTIFY_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to exchange code: ${error}`);
    }

    return response.json();
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
}> {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('Missing Spotify credentials');
    }

    const response = await fetch(SPOTIFY_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to refresh token');
    }

    return response.json();
}

/**
 * Fetch user's Spotify profile
 */
export async function getSpotifyProfile(accessToken: string): Promise<SpotifyUserProfile> {
    const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch Spotify profile');
    }

    return response.json();
}

/**
 * Fetch user's top artists from Spotify
 * @param accessToken - Spotify access token
 * @param timeRange - 'short_term' (4 weeks), 'medium_term' (6 months), 'long_term' (years)
 * @param limit - Number of artists to fetch (max 50)
 */
export async function getTopArtists(
    accessToken: string,
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
    limit: number = 50
): Promise<SpotifyArtist[]> {
    const response = await fetch(
        `${SPOTIFY_API_BASE}/me/top/artists?time_range=${timeRange}&limit=${limit}`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch top artists');
    }

    const data: SpotifyTopArtistsResponse = await response.json();
    return data.items;
}

/**
 * Calculate listening score based on position in top artists list
 * Artists at the top get higher scores
 */
export function calculateListeningScore(position: number, total: number): number {
    // Score from 100 (top) to 1 (bottom)
    return Math.round(((total - position) / total) * 100);
}

/**
 * Normalize artist name for matching
 * Removes special characters, converts to lowercase
 */
export function normalizeArtistName(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9\s]/g, '') // Remove special chars
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Match Spotify artists with concert/event names
 * Returns a map of normalized artist names to their listening scores
 */
export function createArtistMatchMap(
    spotifyArtists: SpotifyArtist[]
): Map<string, { score: number; originalName: string }> {
    const matchMap = new Map<string, { score: number; originalName: string }>();

    spotifyArtists.forEach((artist, index) => {
        const normalizedName = normalizeArtistName(artist.name);
        const score = calculateListeningScore(index, spotifyArtists.length);

        matchMap.set(normalizedName, {
            score,
            originalName: artist.name,
        });
    });

    return matchMap;
}

/**
 * Check if an event name matches any Spotify artist
 * Returns the listening score if matched, 0 otherwise
 */
export function getEventListeningScore(
    eventName: string,
    artistMatchMap: Map<string, { score: number; originalName: string }>
): { score: number; matchedArtist?: string } {
    const normalizedEventName = normalizeArtistName(eventName);

    // Check for exact match first
    if (artistMatchMap.has(normalizedEventName)) {
        const match = artistMatchMap.get(normalizedEventName)!;
        return { score: match.score, matchedArtist: match.originalName };
    }

    // Check if event name contains any artist name
    for (const [normalizedArtist, data] of artistMatchMap.entries()) {
        if (normalizedEventName.includes(normalizedArtist) ||
            normalizedArtist.includes(normalizedEventName)) {
            return { score: data.score, matchedArtist: data.originalName };
        }
    }

    return { score: 0 };
}
