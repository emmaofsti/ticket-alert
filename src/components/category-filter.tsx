'use client';

import { Button } from '@/components/ui/button';
import { Music, Theater, Trophy, Users, Sparkles, Flag, Globe } from 'lucide-react';

export type Category = 'all' | 'music' | 'arts' | 'sports' | 'family';
export type ArtistOrigin = 'all' | 'norwegian' | 'international';

interface CategoryFilterProps {
    selected: Category;
    onChange: (category: Category) => void;
    artistOrigin?: ArtistOrigin;
    onArtistOriginChange?: (origin: ArtistOrigin) => void;
}

const categories: { id: Category; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Alle', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'music', label: 'Musikk', icon: <Music className="w-4 h-4" /> },
    { id: 'arts', label: 'Show & Teater', icon: <Theater className="w-4 h-4" /> },
    { id: 'sports', label: 'Sport', icon: <Trophy className="w-4 h-4" /> },
    { id: 'family', label: 'Familie', icon: <Users className="w-4 h-4" /> },
];

const artistOrigins: { id: ArtistOrigin; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Alle artister', icon: <Sparkles className="w-3 h-3" /> },
    { id: 'norwegian', label: 'Norske', icon: <Flag className="w-3 h-3" /> },
    { id: 'international', label: 'Internasjonale', icon: <Globe className="w-3 h-3" /> },
];

export function CategoryFilter({
    selected,
    onChange,
    artistOrigin = 'all',
    onArtistOriginChange
}: CategoryFilterProps) {
    return (
        <div className="space-y-4">
            {/* Main Categories */}
            <div className="flex flex-wrap justify-center gap-2">
                {categories.map((cat) => (
                    <Button
                        key={cat.id}
                        variant={selected === cat.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onChange(cat.id)}
                        className={`gap-2 transition-all ${selected === cat.id
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-background/50 border-border/50 hover:border-primary/50 hover:bg-primary/5'
                            }`}
                    >
                        {cat.icon}
                        {cat.label}
                    </Button>
                ))}
            </div>

            {/* Artist Origin Sub-filter (only for music) */}
            {selected === 'music' && onArtistOriginChange && (
                <div className="flex flex-wrap justify-center gap-2">
                    {artistOrigins.map((origin) => (
                        <Button
                            key={origin.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => onArtistOriginChange(origin.id)}
                            className={`gap-1.5 text-xs transition-all ${artistOrigin === origin.id
                                    ? 'bg-primary/10 text-primary border border-primary/30'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {origin.icon}
                            {origin.label}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}
