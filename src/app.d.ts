import { SupabaseClient, Session } from '@supabase/supabase-js';
import { Database } from '$lib/supabase.types';

declare global {
    namespace App {
        interface Locals {
            supabase: SupabaseClient
            getSession(): Promise<Session | null>
        }
        interface PageData {
            session: Session | null
        }
    }
}

export {};