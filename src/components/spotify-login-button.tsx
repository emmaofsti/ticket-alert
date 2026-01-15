'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Music, LogOut, User } from 'lucide-react';

interface SpotifyUser {
    id: string;
    name: string;
    image?: string;
}

export function SpotifyLoginButton() {
    const [user, setUser] = useState<SpotifyUser | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check for existing session from cookie
        const checkSession = () => {
            const userCookie = document.cookie
                .split('; ')
                .find(row => row.startsWith('spotify_user='));

            if (userCookie) {
                try {
                    const userData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
                    setUser(userData);
                } catch {
                    setUser(null);
                }
            }
        };

        checkSession();

        // Check URL params for connection status
        const params = new URLSearchParams(window.location.search);
        if (params.get('spotify_connected') === 'true') {
            checkSession();
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
        }
        if (params.get('spotify_error')) {
            console.error('Spotify auth error:', params.get('spotify_error'));
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const handleLogin = () => {
        const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
        if (!clientId) {
            alert('Spotify er ikke konfigurert ennå. Legg til SPOTIFY_CLIENT_ID i .env.local');
            return;
        }

        const redirectUri = `${window.location.origin}/api/spotify-callback`;
        const scopes = ['user-top-read', 'user-read-private'];

        const authUrl = new URL('https://accounts.spotify.com/authorize');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', scopes.join(' '));
        authUrl.searchParams.set('show_dialog', 'true');

        window.location.href = authUrl.toString();
    };

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await fetch('/api/spotify-logout', { method: 'POST' });
            setUser(null);
            // Clear cookie on client side too
            document.cookie = 'spotify_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.reload();
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (user) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1DB954]/10 rounded-full border border-[#1DB954]/30">
                    {user.image ? (
                        <img
                            src={user.image}
                            alt={user.name}
                            className="w-6 h-6 rounded-full"
                        />
                    ) : (
                        <User className="w-4 h-4 text-[#1DB954]" />
                    )}
                    <span className="text-sm font-medium text-[#1DB954]">
                        {user.name}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <LogOut className="w-4 h-4" />
                </Button>
            </div>
        );
    }

    return (
        <Button
            onClick={handleLogin}
            className="gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-medium"
        >
            <Music className="w-4 h-4" />
            Koble til Spotify
        </Button>
    );
}
