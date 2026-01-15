// Event types for Ticketmaster API

export interface Concert {
  id: string;
  name: string;
  date: string;
  time?: string;
  venue: string;
  city: string;
  imageUrl: string;
  url: string;
  hasResale?: boolean;
  locale?: string; // Country code of the artist/attraction
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
}

// Group of concerts by the same artist/event name
export interface ArtistGroup {
  name: string;
  imageUrl: string;
  locale?: string;
  listeningScore?: number; // Score from Spotify (0-100, higher = listens more)
  concerts: Concert[];
}

export interface TrackingSubscription {
  id: string;
  event_id: string;
  event_name: string;
  email: string;
  created_at: string;
  notified_at?: string;
}

// Ticketmaster API response types
export interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
    };
    status?: {
      code: string;
    };
  };
  images: Array<{
    url: string;
    width: number;
    height: number;
    ratio?: string;
  }>;
  _embedded?: {
    venues?: Array<{
      name: string;
      city?: {
        name: string;
      };
      country?: {
        name: string;
        countryCode: string;
      };
    }>;
  };
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  ticketLimit?: {
    info?: string;
  };
}

export interface TicketmasterResponse {
  _embedded?: {
    events: TicketmasterEvent[];
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}
