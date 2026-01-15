'use client';

import { Button } from '@/components/ui/button';
import { MapPin, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export type City = 'all' | string;

// Norwegian cities commonly used for events
const NORWEGIAN_CITIES = [
    'Oslo',
    'Bergen',
    'Trondheim',
    'Stavanger',
    'Kristiansand',
    'Tromsø',
    'Drammen',
    'Fredrikstad',
    'Sandnes',
    'Ålesund',
    'Bodø',
    'Hamar',
    'Lillehammer',
    'Tønsberg',
    'Sandefjord',
    'Sarpsborg',
    'Larvik',
    'Molde',
    'Haugesund',
    'Kongsberg',
];

interface CityFilterProps {
    selected: City;
    onChange: (city: City) => void;
    availableCities?: string[]; // Cities that actually have events
}

export function CityFilter({ selected, onChange, availableCities }: CityFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Use available cities if provided, otherwise use common Norwegian cities
    const cities = availableCities && availableCities.length > 0
        ? availableCities.sort()
        : NORWEGIAN_CITIES;

    const selectedLabel = selected === 'all' ? 'Alle byer' : selected;

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className={`gap-2 min-w-[140px] justify-between ${selected !== 'all'
                        ? 'border-primary/50 bg-primary/5 text-primary'
                        : 'bg-background/50 border-border/50'
                    }`}
            >
                <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {selectedLabel}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 max-h-64 overflow-y-auto bg-background border border-border rounded-lg shadow-lg z-50">
                    <div className="p-1">
                        <button
                            onClick={() => {
                                onChange('all');
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selected === 'all'
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'hover:bg-muted'
                                }`}
                        >
                            Alle byer
                        </button>

                        <div className="h-px bg-border my-1" />

                        {cities.map((city) => (
                            <button
                                key={city}
                                onClick={() => {
                                    onChange(city);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selected === city
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'hover:bg-muted'
                                    }`}
                            >
                                {city}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
