import { createClient } from '@supabase/supabase-js'

// Ambil URL dan kunci anon dari variabel lingkungan
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Pastikan variabel lingkungan telah diatur
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL and Anon Key are missing. Make sure to set them in your .env file.");
  // Anda bisa menampilkan pesan di UI di sini jika mau
}

// Buat dan ekspor klien Supabase
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!)