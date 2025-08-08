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

  -- Jika kosong, cobaurai dari nama lengkap (umum untuk Google Auth)
  IF first_name_val IS NULL AND new.raw_user_meta_data ->> 'full_name' IS NOT NULL THEN
    first_name_val := split_part(new.raw_user_meta_data ->> 'full_name', ' ', 1);
    last_name_val := substring(new.raw_user_meta_data ->> 'full_name' from position(' ' in new.raw_user_meta_data ->> 'full_name') + 1);
  END IF;

  INSERT INTO public.profiles (id, first_name, last_name, avatar_url)
  VALUES (
    new.id,
    first_name_val,
    last_name_val,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN new;
END;
$$;