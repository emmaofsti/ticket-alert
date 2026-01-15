import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getSpotifyProfile } from '@/lib/spotify';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle errors from Spotify
    if (error) {
        console.error('Spotify auth error:', error);
        return NextResponse.redirect(new URL('/?spotify_error=access_denied', request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/?spotify_error=no_code', request.url));
    }

    try {
        // Exchange code for tokens
        const tokens = await exchangeCodeForToken(code);

        // Get user profile
        const profile = await getSpotifyProfile(tokens.access_token);

        // Store tokens in cookies (httpOnly for security)
        const cookieStore = await cookies();

        cookieStore.set('spotify_access_token', tokens.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: tokens.expires_in,
            path: '/',
        });

        cookieStore.set('spotify_refresh_token', tokens.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        });

        // Store user info in a non-httpOnly cookie for client access
        cookieStore.set('spotify_user', JSON.stringify({
            id: profile.id,
            name: profile.display_name,
            image: profile.images?.[0]?.url,
        }), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: tokens.expires_in,
            path: '/',
        });

        // Redirect back to home with success
        return NextResponse.redirect(new URL('/?spotify_connected=true', request.url));
    } catch (err) {
        console.error('Failed to complete Spotify auth:', err);
        return NextResponse.redirect(new URL('/?spotify_error=token_exchange', request.url));
    }
}
