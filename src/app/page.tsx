'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Concert, ArtistGroup } from '@/types/event';
import { Header } from '@/components/header';
import { SearchBar } from '@/components/search-bar';
import { CategoryFilter, Category, ArtistOrigin } from '@/components/category-filter';
import { CityFilter, City } from '@/components/city-filter';
import { ArtistGrid } from '@/components/artist-grid';
import { EventDetailModal } from '@/components/event-detail-modal';
import { SpotifyLoginButton } from '@/components/spotify-login-button';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Sparkles, ChevronDown, Music } from 'lucide-react';
import { normalizeArtistName } from '@/lib/spotify';

// Known Norwegian artists for filtering
const NORWEGIAN_ARTISTS = [
  'aurora', 'kygo', 'sigrid', 'a-ha', 'aha', 'astrid s', 'karpe', 'röyksopp',
  'madcon', 'ylvis', 'dagny', 'girl in red', 'lemaitre', 'highasakite',
  'susanne sundfør', 'sondre lerche', 'annie', 'maria mena', 'tone damli',
  'marcus & martinus', 'alan walker', 'matoma', 'odd nordstoga', 'sissel',
  'lene marlin', 'morten harket', 'cezinando', 'arif', 'gabrielle',
  'postgirobygget', 'raga rockers', 'oslo ess', 'kaizers orchestra',
  'kvelertak', 'turbonegro', 'enslaved', 'mayhem', 'dimmu borgir',
  'wardruna', 'burzum', 'satyricon', 'keep of kalessin', 'jaga jazzist',
  'd.d.e.', 'dde', 'vamp', 'hellbillies', 'vassendgutane', 'valkyrien allstars',
  'kari bremnes', 'bjørn eidsvåg', 'ole paus', 'halvdan sivertsen',
  'christine guldbrandsen', 'maria haukaas mittet', 'kurt nilsen',
  'espen lind', 'mods', 'jan eggum', 'lillebjørn nilsen', 'stein torleif bjella',
  'moddi', 'ane brun', 'ingrid olava', 'ingebjørg bratland', 'odd nordstoga',
  'stig brenner', 'anne grete preus', 'wenche myhre', 'kirsti sparboe',
  'jahn teigen', 'bobbysocks', 'secret garden', 'alexander rybak',
  'jon ranes', 'tix', 'tooji', 'stella mwangi', 'nico & vinz', 'donkeyboy',
  'datarock', 'kings of convenience', 'todd terje', 'lindstrøm', 'prins thomas',
  'morten abel', 'sivert høyem', 'madrugada', 'bigbang', 'seigmen', 'motorpsycho'
];

// Check if artist name contains Norwegian artist
function isNorwegianArtist(name: string): boolean {
  const lowerName = name.toLowerCase();
  return NORWEGIAN_ARTISTS.some(artist => lowerName.includes(artist));
}

// Group concerts by artist/event name
function groupConcertsByArtist(concerts: Concert[]): ArtistGroup[] {
  const groups = new Map<string, Concert[]>();

  for (const concert of concerts) {
    const existing = groups.get(concert.name);
    if (existing) {
      existing.push(concert);
    } else {
      groups.set(concert.name, [concert]);
    }
  }

  // Convert to array and sort concerts within each group by date
  return Array.from(groups.entries()).map(([name, concerts]) => ({
    name,
    imageUrl: concerts[0].imageUrl,
    locale: isNorwegianArtist(name) ? 'NO' : 'INT',
    listeningScore: 0, // Will be set later if Spotify connected
    concerts: concerts.sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ),
  }));
}

type SortMode = 'date' | 'forDeg';

interface SpotifyArtistMatch {
  name: string;
  score: number;
}

export default function Home() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [artistOrigin, setArtistOrigin] = useState<ArtistOrigin>('all');
  const [selectedArtist, setSelectedArtist] = useState<ArtistGroup | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);

  // Spotify state
  const [spotifyArtists, setSpotifyArtists] = useState<SpotifyArtistMatch[]>([]);
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [loadingSpotify, setLoadingSpotify] = useState(false);

  // City filter state
  const [selectedCity, setSelectedCity] = useState<City>('all');

  // Fetch concerts when category changes - automatically load all pages
  useEffect(() => {
    async function fetchAllConcerts() {
      setLoading(true);
      setCurrentPage(0);
      setConcerts([]);

      try {
        // First fetch to get total pages
        const firstResponse = await fetch(`/api/concerts?size=200&category=${category}&page=0`);
        const firstData = await firstResponse.json();

        if (!firstData.concerts || firstData.concerts.length === 0) {
          setConcerts([]);
          setTotalPages(0);
          setTotalEvents(0);
          setLoading(false);
          return;
        }

        let allConcerts = [...firstData.concerts];
        const totalPagesAvailable = firstData.totalPages || 1;
        setTotalPages(totalPagesAvailable);
        setTotalEvents(firstData.total || firstData.concerts.length);

        // Automatically fetch remaining pages (up to 5 pages = 1000 events max)
        const maxPages = Math.min(totalPagesAvailable, 5);

        if (maxPages > 1) {
          const pagePromises = [];
          for (let page = 1; page < maxPages; page++) {
            pagePromises.push(
              fetch(`/api/concerts?size=200&category=${category}&page=${page}`)
                .then(res => res.json())
                .catch(() => ({ concerts: [] }))
            );
          }

          const results = await Promise.all(pagePromises);
          for (const data of results) {
            if (data.concerts && data.concerts.length > 0) {
              allConcerts = [...allConcerts, ...data.concerts];
            }
          }
          setCurrentPage(maxPages - 1);
        }

        setConcerts(allConcerts);
      } catch (error) {
        console.error('Failed to fetch concerts:', error);
        setConcerts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAllConcerts();
  }, [category]);

  // Load more concerts
  async function loadMore() {
    if (loadingMore || currentPage >= totalPages - 1) return;

    setLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const response = await fetch(`/api/concerts?size=200&category=${category}&page=${nextPage}`);
      const data = await response.json();

      if (data.concerts && data.concerts.length > 0) {
        setConcerts(prev => [...prev, ...data.concerts]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to load more concerts:', error);
    } finally {
      setLoadingMore(false);
    }
  }

  // Reset artist origin when changing category
  useEffect(() => {
    if (category !== 'music') {
      setArtistOrigin('all');
    }
  }, [category]);

  // Fetch Spotify top artists
  const fetchSpotifyArtists = useCallback(async () => {
    // Check if user has spotify cookie
    const hasSpotifyCookie = document.cookie.includes('spotify_user=');
    if (!hasSpotifyCookie) {
      setIsSpotifyConnected(false);
      return;
    }

    setLoadingSpotify(true);
    try {
      const response = await fetch('/api/spotify-top-artists');
      if (response.ok) {
        const data = await response.json();
        setSpotifyArtists(data.artists || []);
        setIsSpotifyConnected(true);
      } else {
        setIsSpotifyConnected(false);
      }
    } catch {
      setIsSpotifyConnected(false);
    } finally {
      setLoadingSpotify(false);
    }
  }, []);

  useEffect(() => {
    fetchSpotifyArtists();

    // Re-check when URL changes (after OAuth callback)
    const checkConnection = () => {
      if (window.location.search.includes('spotify_connected=true')) {
        fetchSpotifyArtists();
      }
    };
    checkConnection();
  }, [fetchSpotifyArtists]);

  // Calculate listening score for an artist
  const getListeningScore = useCallback((eventName: string): number => {
    if (spotifyArtists.length === 0) return 0;

    const normalizedEvent = normalizeArtistName(eventName);

    for (const artist of spotifyArtists) {
      const normalizedArtist = normalizeArtistName(artist.name);
      if (normalizedEvent.includes(normalizedArtist) ||
        normalizedArtist.includes(normalizedEvent)) {
        return artist.score;
      }
    }
    return 0;
  }, [spotifyArtists]);

  // Group and filter concerts
  const artistGroups = useMemo(() => {
    let groups = groupConcertsByArtist(concerts);

    // Add listening scores
    groups = groups.map(group => ({
      ...group,
      listeningScore: getListeningScore(group.name),
    }));

    // Filter by artist origin if music category
    if (category === 'music' && artistOrigin !== 'all') {
      groups = groups.filter(artist =>
        artistOrigin === 'norwegian'
          ? artist.locale === 'NO'
          : artist.locale === 'INT'
      );
    }

    // Filter by city
    if (selectedCity !== 'all') {
      groups = groups.map(group => ({
        ...group,
        concerts: group.concerts.filter(c =>
          c.city.toLowerCase() === selectedCity.toLowerCase()
        ),
      })).filter(group => group.concerts.length > 0);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      groups = groups.filter(
        (artist) =>
          artist.name.toLowerCase().includes(query) ||
          artist.concerts.some(c =>
            c.venue.toLowerCase().includes(query) ||
            c.city.toLowerCase().includes(query)
          )
      );
    }

    // Sort by listening score if "For deg" mode
    if (sortMode === 'forDeg' && isSpotifyConnected) {
      groups = [...groups].sort((a, b) => {
        // Artists you listen to first
        if ((b.listeningScore || 0) !== (a.listeningScore || 0)) {
          return (b.listeningScore || 0) - (a.listeningScore || 0);
        }
        // Then by date of first concert
        return new Date(a.concerts[0].date).getTime() - new Date(b.concerts[0].date).getTime();
      });
    }

    return groups;
  }, [concerts, searchQuery, artistOrigin, category, sortMode, isSpotifyConnected, getListeningScore, selectedCity]);

  // Extract available cities from concerts
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    concerts.forEach(concert => {
      if (concert.city && concert.city !== 'Ukjent by') {
        cities.add(concert.city);
      }
    });
    return Array.from(cities).sort();
  }, [concerts]);

  const handleTrack = (artist: ArtistGroup) => {
    setSelectedArtist(artist);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedArtist(null);
  };

  // Count total concerts in current view
  const totalConcertsInView = artistGroups.reduce((sum, a) => sum + a.concerts.length, 0);
  const hasMore = currentPage < totalPages - 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      {/* Background Decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-8 pt-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">
              Aldri gå glipp av et arrangement igjen
            </span>
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
            Finn arrangementer i Norge
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Bla gjennom kommende arrangementer og motta varsel når videresolgte billetter
            blir tilgjengelige på Ticketmaster.
          </p>

          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Søk etter artist, show eller sted..."
          />
        </section>

        {/* Category Filter */}
        <section className="mb-4">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <CategoryFilter
              selected={category}
              onChange={setCategory}
              artistOrigin={artistOrigin}
              onArtistOriginChange={setArtistOrigin}
            />
            <CityFilter
              selected={selectedCity}
              onChange={setSelectedCity}
              availableCities={availableCities}
            />
          </div>
        </section>

        {/* Spotify Integration Section */}
        <section className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-[#1DB954]/10 to-transparent border border-[#1DB954]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1DB954]/20">
                <Music className="w-5 h-5 text-[#1DB954]" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">
                  {isSpotifyConnected ? 'Personalisert for deg' : 'Koble til Spotify'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isSpotifyConnected
                    ? `${spotifyArtists.length} artister hentet fra din profil`
                    : 'Se konserter med artistene du hører mest på først'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isSpotifyConnected && (
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                  <Button
                    variant={sortMode === 'date' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setSortMode('date')}
                    className="text-xs"
                  >
                    Dato
                  </Button>
                  <Button
                    variant={sortMode === 'forDeg' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setSortMode('forDeg')}
                    className="text-xs gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    For deg
                  </Button>
                </div>
              )}
              <SpotifyLoginButton />
            </div>
          </div>

          {/* Show matched artists count when in "For deg" mode */}
          {isSpotifyConnected && sortMode === 'forDeg' && (
            <div className="mt-3 text-sm text-muted-foreground">
              <span className="text-[#1DB954] font-medium">
                {artistGroups.filter(a => (a.listeningScore || 0) > 0).length}
              </span>
              {' '}arrangementer matcher artistene dine
            </div>
          )}
        </section>

        {/* Results Count */}
        {!loading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {artistGroups.length > 0 ? (
                <>
                  {artistGroups.length} arrangement{artistGroups.length !== 1 ? 'er' : ''}
                  {' '}({totalConcertsInView} dato{totalConcertsInView !== 1 ? 'er' : ''})
                  {totalEvents > concerts.length && (
                    <span className="text-primary"> • {totalEvents} totalt tilgjengelig</span>
                  )}
                  {artistOrigin === 'norwegian' && ' • Norske artister'}
                  {artistOrigin === 'international' && ' • Internasjonale artister'}
                  {searchQuery && ` • "${searchQuery}"`}
                </>
              ) : (
                'Ingen arrangementer funnet'
              )}
            </p>
          </div>
        )}

        {/* No results message */}
        {!loading && artistGroups.length === 0 && concerts.length > 0 && (
          <div className="max-w-xl mx-auto mb-8 p-4 rounded-lg bg-muted/50 border border-border/50 text-center">
            <p className="text-muted-foreground">
              Ingen {artistOrigin === 'norwegian' ? 'norske' : artistOrigin === 'international' ? 'internasjonale' : ''} artister funnet.
              {artistOrigin !== 'all' && ' Prøv "Alle artister".'}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && concerts.length === 0 && (
          <div className="max-w-xl mx-auto mb-8 p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-primary">
              <AlertCircle className="w-4 h-4" />
              <span>
                Ingen arrangementer funnet i denne kategorien.
              </span>
            </div>
          </div>
        )}

        {/* Artist Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Laster arrangementer...</p>
          </div>
        ) : (
          <>
            <ArtistGrid
              artists={artistGroups}
              onTrack={handleTrack}
            />

            {/* Load More Button */}
            {hasMore && !searchQuery && artistOrigin === 'all' && (
              <div className="flex justify-center mt-12">
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  variant="outline"
                  size="lg"
                  className="gap-2 min-w-[200px]"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Laster...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Last inn flere ({totalEvents - concerts.length} igjen)
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} TicketAlert Norge.
            Data fra Ticketmaster Discovery API.
          </p>
        </div>
      </footer>

      {/* Event Detail Modal */}
      <EventDetailModal
        artist={selectedArtist}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}
