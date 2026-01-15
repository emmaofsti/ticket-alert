import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only create client if credentials are available
export const supabase: SupabaseClient | null =
    supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey)
        : null;

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
    return supabase !== null;
}

// Type for our tracked events table
export interface TrackedEvent {
    id: string;
    event_id: string;
    event_name: string;
    email: string;
    created_at: string;
    notified_at: string | null;
}

/**
 * Save a new tracking subscription
 */
export async function saveTrackingSubscription(
    eventId: string,
    eventName: string,
    email: string
): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
        console.log('Supabase not configured, subscription saved locally only');
        // For demo purposes, just return success when Supabase isn't configured
        return { success: true };
    }

    try {
        const { error } = await supabase
            .from('tracked_events')
            .insert({
                event_id: eventId,
                event_name: eventName,
                email: email,
            });

        if (error) {
            // Check for unique constraint violation (already subscribed)
            if (error.code === '23505') {
                return {
                    success: false,
                    error: 'Du følger allerede dette arrangementet'
                };
            }
            console.error('Supabase error:', error);
            return { success: false, error: 'Kunne ikke lagre abonnement' };
        }

        return { success: true };
    } catch (err) {
        console.error('Failed to save subscription:', err);
        return { success: false, error: 'En feil oppstod' };
    }
}

/**
 * Get all tracked events for checking
 */
export async function getTrackedEvents(): Promise<TrackedEvent[]> {
    if (!supabase) {
        return [];
    }

    const { data, error } = await supabase
        .from('tracked_events')
        .select('*')
        .is('notified_at', null);

    if (error) {
        console.error('Failed to get tracked events:', error);
        return [];
    }

    return data || [];
}

/**
 * Mark an event as notified
 */
export async function markEventNotified(trackingId: string): Promise<void> {
    if (!supabase) {
        return;
    }

    await supabase
        .from('tracked_events')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', trackingId);
}

