-- Langkah 1: Tambahkan kolom email yang unik ke tabel profil untuk mencegah duplikasi.
ALTER TABLE public.profiles ADD COLUMN email TEXT UNIQUE;

-- Langkah 2: Perbarui fungsi untuk menangani konflik saat email sudah ada.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  first_name_val TEXT;
  last_name_val TEXT;
BEGIN
  -- Coba dapatkan nama depan dan belakang secara langsung
  first_name_val := new.raw_user_meta_data ->> 'first_name';
  last_name_val := new.raw_user_meta_data ->> 'last_name';

  -- Jika kosong, coba urai dari nama lengkap (umum untuk Google Auth)
  IF first_name_val IS NULL AND new.raw_user_meta_data ->> 'full_name' IS NOT NULL THEN
    first_name_val := split_part(new.raw_user_meta_data ->> 'full_name', ' ', 1);
    last_name_val := substring(new.raw_user_meta_data ->> 'full_name' from position(' ' in new.raw_user_meta_data ->> 'full_name') + 1);
  END IF;

  -- Sisipkan profil baru, tetapi jika email sudah ada, jangan lakukan apa-apa.
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url, email)
  VALUES (
    new.id,
    first_name_val,
    last_name_val,
    new.raw_user_meta_data ->> 'avatar_url',
    new.email
  )
  ON CONFLICT (email) DO NOTHING;
  
  RETURN new;
END;
$$;