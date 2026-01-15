'use client';

import { Concert } from '@/types/event';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Bell, ExternalLink } from 'lucide-react';

interface ConcertCardProps {
    concert: Concert;
    onTrack: (concert: Concert) => void;
}

export function ConcertCard({ concert, onTrack }: ConcertCardProps) {
    // Format date in Norwegian
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('nb-NO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return null;
        return timeStr.slice(0, 5); // HH:MM
    };

    return (
        <Card className="group overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
            {/* Image Container */}
            <div className="relative aspect-[16/9] overflow-hidden">
                <img
                    src={concert.imageUrl}
                    alt={concert.name}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Price Badge */}
                {concert.priceRange && (
                    <Badge
                        variant="secondary"
                        className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm border-0 text-white"
                    >
                        fra {concert.priceRange.min} {concert.priceRange.currency}
                    </Badge>
                )}

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-bold text-lg text-white line-clamp-2 leading-tight">
                        {concert.name}
                    </h3>
                </div>
            </div>

            <CardContent className="p-4 space-y-3">
                {/* Date & Time */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="capitalize">{formatDate(concert.date)}</span>
                    {concert.time && (
                        <span className="text-primary font-medium">
                            kl. {formatTime(concert.time)}
                        </span>
                    )}
                </div>

                {/* Venue */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>
                        {concert.venue}, {concert.city}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <Button
                        onClick={() => onTrack(concert)}
                        className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
                    >
                        <Bell className="w-4 h-4" />
                        Spor billettsalg
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        asChild
                        className="shrink-0 border-border/50 hover:border-primary/50 hover:bg-primary/5"
                    >
                        <a href={concert.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                            <span className="sr-only">Se på Ticketmaster</span>
                        </a>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
