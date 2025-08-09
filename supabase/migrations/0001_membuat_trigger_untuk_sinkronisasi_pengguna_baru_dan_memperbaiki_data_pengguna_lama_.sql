-- Langkah 1: Pastikan trigger untuk pengguna baru sudah aktif dan benar.
-- Ini akan menghapus trigger lama (jika ada) dan membuat yang baru.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Langkah 2: Jalankan skrip satu kali untuk memperbaiki data pengguna yang sudah ada.
-- Skrip ini akan mengambil data dari auth.users dan mengisinya ke public.profiles
-- untuk baris yang nama depannya masih kosong.
DO $$
DECLARE
    r RECORD;
    first_name_val TEXT;
    last_name_val TEXT;
BEGIN
    FOR r IN 
        SELECT u.id, u.email, u.raw_user_meta_data 
        FROM auth.users u JOIN public.profiles p ON u.id = p.id 
        WHERE p.first_name IS NULL
    LOOP
        -- Logika yang sama persis dengan fungsi handle_new_user
        first_name_val := r.raw_user_meta_data ->> 'first_name';
        last_name_val := r.raw_user_meta_data ->> 'last_name';

        IF first_name_val IS NULL AND r.raw_user_meta_data ->> 'full_name' IS NOT NULL THEN
            first_name_val := split_part(r.raw_user_meta_data ->> 'full_name', ' ', 1);
            last_name_val := substring(r.raw_user_meta_data ->> 'full_name' from position(' ' in r.raw_user_meta_data ->> 'full_name') + 1);
        END IF;

        -- Perbarui profil yang ada
        UPDATE public.profiles
        SET 
            first_name = first_name_val,
            last_name = last_name_val,
            avatar_url = COALESCE(avatar_url, r.raw_user_meta_data ->> 'avatar_url'),
            email = COALESCE(email, r.email)
        WHERE id = r.id;
    END LOOP;
END $$;