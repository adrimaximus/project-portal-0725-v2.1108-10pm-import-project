-- Memperbarui kebijakan keamanan untuk mengizinkan semua pengguna yang terautentikasi melihat semua profil.
-- Ini diperlukan agar fitur "pengguna online" dapat mengambil nama dan avatar pengguna lain.
ALTER POLICY "profiles_select_policy" ON public.profiles USING (true);