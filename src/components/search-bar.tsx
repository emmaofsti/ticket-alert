'use client';

import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function SearchBar({
    value,
    onChange,
    placeholder = 'Søk etter artist eller sted...'
}: SearchBarProps) {
    return (
        <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-muted-foreground" />
            </div>
            <Input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="pl-12 pr-10 h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-base"
            />
            {value && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onChange('')}
                    className="absolute inset-y-0 right-0 h-full px-3 hover:bg-transparent"
                >
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                    <span className="sr-only">Tøm søk</span>
                </Button>
            )}
        </div>
    );
}
