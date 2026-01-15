'use client';

import { useState } from 'react';
import { Concert, ArtistGroup } from '@/types/event';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, MapPin, Loader2, CheckCircle, XCircle, ChevronRight } from 'lucide-react';

interface TrackModalProps {
    artist: ArtistGroup | null;
    isOpen: boolean;
    onClose: () => void;
}

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

export function TrackModal({ artist, isOpen, onClose }: TrackModalProps) {
    const [selectedConcert, setSelectedConcert] = useState<Concert | null>(null);
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<SubmitStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Reset state when modal closes
    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setSelectedConcert(null);
            setStatus('idle');
            setEmail('');
            setErrorMessage('');
        }, 200);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const concertToTrack = selectedConcert || artist?.concerts[0];
        if (!concertToTrack || !email) return;

        setStatus('loading');
        setErrorMessage('');

        try {
            const response = await fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: concertToTrack.id,
                    eventName: concertToTrack.name,
                    email,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setTimeout(() => {
                    handleClose();
                }, 2000);
            } else {
                setStatus('error');
                setErrorMessage(data.error || 'Noe gikk galt');
            }
        } catch {
            setStatus('error');
            setErrorMessage('Kunne ikke koble til serveren');
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('nb-NO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        });
    };

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return null;
        return timeStr.slice(0, 5);
    };

    if (!artist) return null;

    const hasMultipleDates = artist.concerts.length > 1;
    const showDateSelection = hasMultipleDates && !selectedConcert;
    const concertToShow = selectedConcert || artist.concerts[0];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50 max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Bell className="w-5 h-5 text-primary" />
                        {showDateSelection ? 'Velg dato' : 'Spor billettsalg'}
                    </DialogTitle>
                    <DialogDescription>
                        {showDateSelection
                            ? `${artist.name} har ${artist.concerts.length} kommende konserter. Velg hvilken du vil spore.`
                            : 'Du vil motta en e-post når det dukker opp videresolgte billetter.'
                        }
                    </DialogDescription>
                </DialogHeader>

                {/* Date Selection */}
                {showDateSelection ? (
                    <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                        {artist.concerts.map((concert) => (
                            <button
                                key={concert.id}
                                onClick={() => setSelectedConcert(concert)}
                                className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 hover:border-primary/30 transition-all group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            <span className="capitalize">{formatDate(concert.date)}</span>
                                            {concert.time && (
                                                <span className="text-muted-foreground">
                                                    kl. {formatTime(concert.time)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <MapPin className="w-4 h-4" />
                                            <span>{concert.venue}, {concert.city}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Selected Event Summary */}
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <h4 className="font-semibold text-foreground line-clamp-2">
                                {artist.name}
                            </h4>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    <span className="capitalize">{formatDate(concertToShow.date)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" />
                                    <span>{concertToShow.venue}, {concertToShow.city}</span>
                                </div>
                            </div>
                            {concertToShow.priceRange && (
                                <Badge variant="outline" className="mt-2">
                                    fra {concertToShow.priceRange.min} {concertToShow.priceRange.currency}
                                </Badge>
                            )}

                            {/* Back button if multiple dates */}
                            {hasMultipleDates && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedConcert(null)}
                                    className="mt-2 text-primary hover:text-primary/80"
                                >
                                    ← Velg annen dato
                                </Button>
                            )}
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-foreground">
                                    E-postadresse
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="din@epost.no"
                                    required
                                    disabled={status === 'loading' || status === 'success'}
                                    className="bg-background/50 border-border/50 focus:border-primary/50"
                                />
                            </div>

                            {/* Status Messages */}
                            {status === 'success' && (
                                <div className="flex items-center gap-2 text-sm text-green-500 bg-green-500/10 p-3 rounded-lg">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Du følger nå dette arrangementet!</span>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                                    <XCircle className="w-4 h-4" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={status === 'loading'}
                                    className="flex-1"
                                >
                                    Avbryt
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={status === 'loading' || status === 'success' || !email}
                                    className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80"
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Lagrer...
                                        </>
                                    ) : status === 'success' ? (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Lagret!
                                        </>
                                    ) : (
                                        <>
                                            <Bell className="w-4 h-4" />
                                            Start sporing
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>

                        <p className="text-xs text-muted-foreground text-center">
                            Vi sender kun e-post når billetter blir tilgjengelige. Ingen spam.
                        </p>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
