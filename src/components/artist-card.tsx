'use client';

import { ArtistGroup } from '@/types/event';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, ChevronRight, Ticket } from 'lucide-react';

interface ArtistCardProps {
    artist: ArtistGroup;
    onTrack: (artist: ArtistGroup) => void;
}

export function ArtistCard({ artist, onTrack }: ArtistCardProps) {
    const concertCount = artist.concerts.length;
    const nextConcert = artist.concerts[0]; // Sorted by date, first is soonest

    // Get unique cities
    const cities = [...new Set(artist.concerts.map(c => c.city))];
    const citiesText = cities.length > 2
        ? `${cities.slice(0, 2).join(', ')} +${cities.length - 2}`
        : cities.join(', ');

    // Format date in Norwegian
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('nb-NO', {
            day: 'numeric',
            month: 'short',
        });
    };

    // Get price range across all concerts
    const allPrices = artist.concerts
        .filter(c => c.priceRange)
        .map(c => c.priceRange!);

    const minPrice = allPrices.length > 0
        ? Math.min(...allPrices.map(p => p.min))
        : null;

    return (
        <Card
            onClick={() => onTrack(artist)}
            className="group overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer"
        >
            {/* Image Container */}
            <div className="relative aspect-[16/9] overflow-hidden">
                <img
                    src={artist.imageUrl}
                    alt={artist.name}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Concert Count Badge */}
                {concertCount > 1 && (
                    <Badge
                        variant="secondary"
                        className="absolute top-3 right-3 bg-primary/90 text-primary-foreground border-0"
                    >
                        {concertCount} datoer
                    </Badge>
                )}

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-bold text-lg text-white line-clamp-2 leading-tight">
                        {artist.name}
                    </h3>
                </div>
            </div>

            <CardContent className="p-4 space-y-3">
                {/* Next Date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    {concertCount > 1 ? (
                        <span>
                            {formatDate(nextConcert.date)} – {formatDate(artist.concerts[concertCount - 1].date)}
                        </span>
                    ) : (
                        <span className="capitalize">
                            {new Date(nextConcert.date).toLocaleDateString('nb-NO', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                            })}
                        </span>
                    )}
                </div>

                {/* Venues/Cities */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{citiesText}</span>
                </div>

                {/* Price */}
                {minPrice && (
                    <div className="text-sm text-muted-foreground">
                        fra <span className="text-foreground font-medium">{minPrice} NOK</span>
                    </div>
                )}

                {/* Click hint */}
                <div className="pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-primary font-medium">
                        <Ticket className="w-4 h-4" />
                        Se billetter
                    </div>
                    <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                </div>
            </CardContent>
        </Card>
    );
}

