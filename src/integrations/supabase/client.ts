import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Supabase URL and Anon Key must be defined in the environment variables.");
}

// Menggunakan konfigurasi auth default yang direkomendasikan untuk keandalan multi-tab.
// Ini menggunakan localStorage secara internal, yang merupakan perilaku yang benar.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { 
    persistSession: true, 
    autoRefreshToken: true, 
    detectSessionInUrl: true, 
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'client-portal-app',
    },
  },
});