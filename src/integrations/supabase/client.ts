import { createClient } from '@supabase/supabase-js';

// Mengambil variabel dari environment.
// Untuk Vite, variabel harus diawali dengan VITE_
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Memastikan variabel ada sebelum membuat klien
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Supabase URL and Anon Key must be defined in the environment variables.");
}

console.log('Supabase client initializing with URL:', SUPABASE_URL);

// Mengimpor klien Supabase seperti ini:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { 
    persistSession: true, 
    autoRefreshToken: true, 
    detectSessionInUrl: true, 
    flowType: 'pkce',
    debug: true, // Enable debug mode
  }
});

// Add event listeners for debugging
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth state change:', event, {
    hasSession: !!session,
    userEmail: session?.user?.email,
    accessToken: session?.access_token ? 'present' : 'missing'
  });
});