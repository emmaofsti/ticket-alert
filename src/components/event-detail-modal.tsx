'use client';

import { useState } from 'react';
import { ArtistGroup, Concert } from '@/types/event';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Calendar,
    MapPin,
    ExternalLink,
    Bell,
    Ticket,
    AlertCircle,
    CheckCircle,
    Loader2,
    Mail
} from 'lucide-react';

interface EventDetailModalProps {
    artist: ArtistGroup | null;
    isOpen: boolean;
    onClose: () => void;
}

export function EventDetailModal({ artist, isOpen, onClose }: EventDetailModalProps) {
    const [selectedConcert, setSelectedConcert] = useState<Concert | null>(null);
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const [error, setError] = useState('');

    if (!artist) return null;

    const handleSubscribe = async (concert: Concert) => {
        if (!email || !email.includes('@')) {
            setError('Vennligst skriv inn en gyldig e-postadresse');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: concert.id,
                    eventName: concert.name,
                    email: email,
                }),
            });

            if (response.ok) {
                setSubscribed(true);
                setTimeout(() => {
                    setSubscribed(false);
                    setEmail('');
                }, 3000);
            } else {
                setError('Kunne ikke registrere varsling. Prøv igjen.');
            }
        } catch {
            setError('Noe gikk galt. Prøv igjen.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateStr: string, time?: string) => {
        const date = new Date(dateStr);
        const dateFormatted = date.toLocaleDateString('nb-NO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        if (time) {
            const [hours, minutes] = time.split(':');
            return `${dateFormatted} kl. ${hours}:${minutes}`;
        }
        return dateFormatted;
    };

    // Simulate ticket status (in a real app, you'd check this from the API)
    const getTicketStatus = (concert: Concert) => {
        // For demo: random status based on event ID hash
        const hash = concert.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        if (hash % 3 === 0) return 'available';
        if (hash % 3 === 1) return 'few-left';
        return 'sold-out';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold pr-8">
                        {artist.name}
                    </DialogTitle>
                </DialogHeader>

                {/* Artist Image */}
                <div className="relative aspect-video rounded-lg overflow-hidden -mx-6 -mt-2">
                    <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                {/* Concert List */}
                <div className="space-y-3 mt-4">
                    <h4 className="font-medium text-sm text-muted-foreground">
                        {artist.concerts.length === 1 ? 'Arrangement' : `${artist.concerts.length} arrangementer`}
                    </h4>

                    {artist.concerts.map((concert) => {
                        const status = getTicketStatus(concert);
                        const isSelected = selectedConcert?.id === concert.id;

                        return (
                            <div
                                key={concert.id}
                                className={`p-4 rounded-lg border transition-all cursor-pointer ${isSelected
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                    }`}
                                onClick={() => setSelectedConcert(isSelected ? null : concert)}
                            >
                                {/* Date and Venue */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            <span className="font-medium capitalize">
                                                {formatDate(concert.date, concert.time)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <MapPin className="w-4 h-4" />
                                            <span>{concert.venue}, {concert.city}</span>
                                        </div>
                                    </div>

                                    {/* Ticket Status Badge */}
                                    <Badge
                                        variant={status === 'sold-out' ? 'destructive' : 'secondary'}
                                        className={`shrink-0 ${status === 'available' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                                                status === 'few-left' ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' :
                                                    ''
                                            }`}
                                    >
                                        {status === 'available' && <CheckCircle className="w-3 h-3 mr-1" />}
                                        {status === 'few-left' && <AlertCircle className="w-3 h-3 mr-1" />}
                                        {status === 'sold-out' && <AlertCircle className="w-3 h-3 mr-1" />}
                                        {status === 'available' ? 'Ledige' :
                                            status === 'few-left' ? 'Få igjen' : 'Utsolgt'}
                                    </Badge>
                                </div>

                                {/* Expanded Content */}
                                {isSelected && (
                                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                                        {/* Price */}
                                        {concert.priceRange && (
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">Pris: </span>
                                                <span className="font-medium">
                                                    {concert.priceRange.min === concert.priceRange.max
                                                        ? `${concert.priceRange.min} ${concert.priceRange.currency}`
                                                        : `${concert.priceRange.min} - ${concert.priceRange.max} ${concert.priceRange.currency}`
                                                    }
                                                </span>
                                            </div>
                                        )}

                                        {/* Actions based on status */}
                                        {status !== 'sold-out' ? (
                                            <Button
                                                asChild
                                                className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80"
                                            >
                                                <a
                                                    href={concert.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Ticket className="w-4 h-4" />
                                                    Kjøp billetter på Ticketmaster
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </Button>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                                    <div className="flex items-center gap-2 text-orange-500 text-sm font-medium mb-1">
                                                        <Bell className="w-4 h-4" />
                                                        Få varsel om resale-billetter
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Vi varsler deg når noen legger ut billetter for videresalg
                                                    </p>
                                                </div>

                                                {subscribed ? (
                                                    <div className="flex items-center gap-2 text-green-500 text-sm p-3 bg-green-500/10 rounded-lg">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Du vil få varsel på e-post!
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <div className="relative flex-1">
                                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                            <Input
                                                                type="email"
                                                                placeholder="din@epost.no"
                                                                value={email}
                                                                onChange={(e) => setEmail(e.target.value)}
                                                                className="pl-9"
                                                            />
                                                        </div>
                                                        <Button
                                                            onClick={() => handleSubscribe(concert)}
                                                            disabled={isSubmitting}
                                                            className="gap-2"
                                                        >
                                                            {isSubmitting ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Bell className="w-4 h-4" />
                                                            )}
                                                            Varsle meg
                                                        </Button>
                                                    </div>
                                                )}

                                                {error && (
                                                    <p className="text-red-500 text-xs">{error}</p>
                                                )}

                                                <Button
                                                    variant="outline"
                                                    asChild
                                                    className="w-full gap-2"
                                                >
                                                    <a
                                                        href={concert.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                        Se på Ticketmaster (utsolgt)
                                                    </a>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
