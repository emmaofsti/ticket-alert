# TicketAlert Norge 🎫

En moderne web-app for å spore videresolgte billetter til konserter i Norge.

## Funksjoner

- 🎵 **Konsertliste** - Se kommende konserter i Norge fra Ticketmaster
- 🔍 **Søk** - Finn artister og steder raskt
- 🔔 **Varsler** - Abonner på e-postvarsler når videresolgte billetter blir tilgjengelige
- 🌙 **Mørk modus** - Moderne, stilrent design

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + Shadcn UI
- **Backend:** Supabase
- **API:** Ticketmaster Discovery API
- **Icons:** Lucide React

## Kom i gang

### 1. Installer avhengigheter

```bash
npm install
```

### 2. Konfigurer miljøvariabler

Opprett en `.env.local` fil i rotmappen:

```env
# Ticketmaster Discovery API
# Registrer deg på: https://developer.ticketmaster.com/
TICKETMASTER_API_KEY=din_api_nøkkel_her

# Supabase
# Opprett prosjekt på: https://supabase.com/
NEXT_PUBLIC_SUPABASE_URL=din_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=din_supabase_anon_key
```

### 3. Sett opp Supabase database

Kjør denne SQL-spørringen i Supabase SQL Editor:

```sql
CREATE TABLE tracked_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL,
  event_name TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notified_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(event_id, email)
);
```

### 4. Start utviklingsserver

```bash
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren.

## Prosjektstruktur

```
src/
├── app/
│   ├── api/
│   │   ├── concerts/route.ts    # Hent konserter fra Ticketmaster
│   │   ├── check-resale/route.ts # Sjekk videresalg-status
│   │   └── track/route.ts        # Lagre sporing til Supabase
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                       # Shadcn komponenter
│   ├── concert-card.tsx
│   ├── concert-grid.tsx
│   ├── header.tsx
│   ├── search-bar.tsx
│   └── track-modal.tsx
├── lib/
│   ├── supabase.ts
│   ├── ticketmaster.ts
│   └── utils.ts
└── types/
    └── event.ts
```

## Veien videre

Når basisappen er på plass, kan du:

1. **Legg til Framer Motion** for smidige animasjoner
2. **Sett opp Supabase Edge Functions** for periodisk sjekk av videresalg
3. **Integrer Resend** for e-postvarsler
4. **Legg til lys/mørk modus-toggle**

## Lisens

MIT
