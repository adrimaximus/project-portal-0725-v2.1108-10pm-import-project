import { createClient } from '@supabase/supabase-js';
import SafeLocalStorage from '@/lib/localStorage';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Supabase URL and Anon Key must be defined in the environment variables.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { 
    persistSession: true, 
    autoRefreshToken: true, 
    detectSessionInUrl: true, 
    flowType: 'pkce',
    storage: {
      getItem: (key: string) => {
        return SafeLocalStorage.getItem<string>(key);
      },
      setItem: (key: string, value: string) => {
        SafeLocalStorage.setItem(key, value);
      },
      removeItem: (key: string) => {
        SafeLocalStorage.removeItem(key);
      },
    },
    storageKey: 'sb-auth-token',
    debug: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'client-portal-app',
    },
  },
});