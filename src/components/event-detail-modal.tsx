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
    Mail,
    ChevronDown
} from 'lucide-react';

interface EventDetailModalProps {
    artist: ArtistGroup | null;
    isOpen: boolean;
    onClose: () => void;
}

export function EventDetailModal({ artist, isOpen, onClose }: EventDetailModalProps) {
    const [selectedConcertId, setSelectedConcertId] = useState<string | null>(null);
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

    const toggleConcert = (concertId: string) => {
        setSelectedConcertId(prev => prev === concertId ? null : concertId);
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

    const getTicketStatus = (concert: Concert) => {
        const hash = concert.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        if (hash % 3 === 0) return 'available';
        if (hash % 3 === 1) return 'few-left';
        return 'sold-out';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto p-0 gap-0">
                {/* Header Image */}
                <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <DialogHeader className="absolute bottom-0 left-0 right-0 p-6">
                        <DialogTitle className="text-2xl font-bold text-white">
                            {artist.name}
                        </DialogTitle>
                    </DialogHeader>
                </div>

                {/* Concert List */}
                <div className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                        {artist.concerts.length} {artist.concerts.length === 1 ? 'arrangement' : 'arrangementer'}
                    </p>

                    {artist.concerts.map((concert) => {
                        const status = getTicketStatus(concert);
                        const isSelected = selectedConcertId === concert.id;

                        return (
                            <div
                                key={concert.id}
                                className={`rounded-xl border-2 transition-all overflow-hidden ${isSelected
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border/50 hover:border-border'
                                    }`}
                            >
                                {/* Header - This is the ONLY clickable part */}
                                <button
                                    type="button"
                                    className="w-full p-4 text-left flex items-start justify-between gap-3"
                                    onClick={() => toggleConcert(concert.id)}
                                >
                                    <div className="space-y-1.5 flex-1">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <Calendar className="w-4 h-4 text-primary shrink-0" />
                                            <span className="capitalize">
                                                {formatDate(concert.date, concert.time)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <MapPin className="w-4 h-4 shrink-0" />
                                            <span>{concert.venue}, {concert.city}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Badge
                                            className={`shrink-0 ${status === 'available'
                                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                                    : status === 'few-left'
                                                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                                        : 'bg-red-500/15 text-red-400 border-red-500/30'
                                                }`}
                                        >
                                            {status === 'available' && <CheckCircle className="w-3 h-3 mr-1" />}
                                            {status === 'few-left' && <AlertCircle className="w-3 h-3 mr-1" />}
                                            {status === 'sold-out' && <AlertCircle className="w-3 h-3 mr-1" />}
                                            {status === 'available' ? 'Ledige' :
                                                status === 'few-left' ? 'Få igjen' : 'Utsolgt'}
                                        </Badge>
                                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>

                                {/* Expanded Content - NOT inside button, so clicks work normally */}
                                {isSelected && (
                                    <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-4">
                                        {/* Price */}
                                        {concert.priceRange && (
                                            <p className="text-sm">
                                                <span className="text-muted-foreground">Pris: </span>
                                                <span className="font-semibold">
                                                    {concert.priceRange.min === concert.priceRange.max
                                                        ? `${concert.priceRange.min} ${concert.priceRange.currency}`
                                                        : `${concert.priceRange.min} - ${concert.priceRange.max} ${concert.priceRange.currency}`
                                                    }
                                                </span>
                                            </p>
                                        )}

                                        {/* Actions based on status */}
                                        {status !== 'sold-out' ? (
                                            <Button
                                                asChild
                                                className="w-full gap-2 h-12 text-base bg-gradient-to-r from-primary to-primary/80"
                                            >
                                                <a
                                                    href={concert.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Ticket className="w-5 h-5" />
                                                    Kjøp billetter
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </Button>
                                        ) : (
                                            <div className="space-y-3">
                                                {/* Resale Alert Box */}
                                                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                                                    <div className="flex items-center gap-2 text-amber-400 font-medium mb-2">
                                                        <Bell className="w-5 h-5" />
                                                        Få varsel om resale
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-4">
                                                        Vi sender deg en e-post når billetter blir tilgjengelig
                                                    </p>

                                                    {subscribed ? (
                                                        <div className="flex items-center gap-2 text-emerald-400 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                                            <CheckCircle className="w-5 h-5" />
                                                            <span className="font-medium">Du vil få varsel!</span>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            <div className="relative">
                                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                                <Input
                                                                    type="email"
                                                                    placeholder="din@epost.no"
                                                                    value={email}
                                                                    onChange={(e) => setEmail(e.target.value)}
                                                                    className="pl-10 h-12 bg-background/50 border-border/50 text-base"
                                                                />
                                                            </div>
                                                            <Button
                                                                onClick={() => handleSubscribe(concert)}
                                                                disabled={isSubmitting}
                                                                className="w-full gap-2 h-12"
                                                            >
                                                                {isSubmitting ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Bell className="w-4 h-4" />
                                                                )}
                                                                Varsle meg når billetter er tilgjengelig
                                                            </Button>
                                                            {error && (
                                                                <p className="text-red-400 text-sm">{error}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <Button
                                                    variant="outline"
                                                    asChild
                                                    className="w-full gap-2 h-11"
                                                >
                                                    <a
                                                        href={concert.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                        Se på Ticketmaster
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
