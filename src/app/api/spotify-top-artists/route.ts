import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTopArtists, refreshAccessToken, createArtistMatchMap } from '@/lib/spotify';

export async function GET() {
    try {
        const cookieStore = await cookies();
        let accessToken = cookieStore.get('spotify_access_token')?.value;
        const refreshToken = cookieStore.get('spotify_refresh_token')?.value;

        if (!accessToken && !refreshToken) {
            return NextResponse.json(
                { error: 'Not authenticated with Spotify' },
                { status: 401 }
            );
        }

        // Try to refresh token if access token is missing but refresh token exists
        if (!accessToken && refreshToken) {
            try {
                const newTokens = await refreshAccessToken(refreshToken);
                accessToken = newTokens.access_token;

                // Update cookie with new access token
                // Note: We can't set cookies in GET, but the token will work for this request
            } catch {
                return NextResponse.json(
                    { error: 'Session expired, please login again' },
                    { status: 401 }
                );
            }
        }

        if (!accessToken) {
            return NextResponse.json(
                { error: 'No access token available' },
                { status: 401 }
            );
        }

        // Fetch top artists from all time ranges for better coverage
        const [shortTerm, mediumTerm, longTerm] = await Promise.all([
            getTopArtists(accessToken, 'short_term', 50).catch(() => []),
            getTopArtists(accessToken, 'medium_term', 50).catch(() => []),
            getTopArtists(accessToken, 'long_term', 50).catch(() => []),
        ]);

        // Combine and deduplicate artists, prioritizing recent listening
        const artistMap = new Map<string, { name: string; score: number; image?: string }>();

        // Process in order of priority (recent first)
        const processArtists = (artists: typeof shortTerm, baseScore: number) => {
            artists.forEach((artist, index) => {
                if (!artistMap.has(artist.id)) {
                    const positionScore = ((artists.length - index) / artists.length) * 50;
                    artistMap.set(artist.id, {
                        name: artist.name,
                        score: Math.round(baseScore + positionScore),
                        image: artist.images?.[0]?.url,
                    });
                }
            });
        };

        processArtists(shortTerm, 50);  // Recent: 50-100 score
        processArtists(mediumTerm, 25); // Medium: 25-75 score
        processArtists(longTerm, 0);    // Long: 0-50 score

        const artists = Array.from(artistMap.values())
            .sort((a, b) => b.score - a.score);

        // Create match map for event matching
        const matchMap = createArtistMatchMap(
            artists.map((a, i) => ({
                id: String(i),
                name: a.name,
                popularity: a.score,
                images: a.image ? [{ url: a.image, height: 300, width: 300 }] : [],
                genres: [],
            }))
        );

        return NextResponse.json({
            artists,
            matchMap: Object.fromEntries(matchMap),
            total: artists.length,
        });
    } catch (error) {
        console.error('Failed to fetch top artists:', error);
        return NextResponse.json(
            { error: 'Failed to fetch top artists' },
            { status: 500 }
        );
    }
}
