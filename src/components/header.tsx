import { Ticket } from 'lucide-react';
import Link from 'next/link';

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link
                    href="/"
                    className="flex items-center gap-2 group"
                >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
                        <Ticket className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg leading-tight text-foreground">
                            TicketAlert
                        </span>
                        <span className="text-xs text-muted-foreground leading-tight">
                            Norge
                        </span>
                    </div>
                </Link>

                {/* Navigation (expandable for future) */}
                <nav className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground hidden sm:block">
                        Finn konserter • Spor billetter • Få varsel
                    </span>
                </nav>
            </div>
        </header>
    );
}
