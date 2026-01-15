'use client';

import { ArtistGroup } from '@/types/event';
import { ArtistCard } from './artist-card';

interface ArtistGridProps {
    artists: ArtistGroup[];
    onTrack: (artist: ArtistGroup) => void;
}

export function ArtistGrid({ artists, onTrack }: ArtistGridProps) {
    if (artists.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <span className="text-3xl">🎵</span>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                    Ingen konserter funnet
                </h3>
                <p className="text-muted-foreground max-w-sm">
                    Vi fant ingen kommende konserter. Prøv å søke etter en annen artist eller et annet sted.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {artists.map((artist) => (
                <ArtistCard
                    key={artist.name}
                    artist={artist}
                    onTrack={onTrack}
                />
            ))}
        </div>
    );
}
