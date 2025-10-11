import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Person } from '@/types';
import { getAvatarUrl } from '@/lib/utils';

const fetchPersonBySlug = async (slug: string): Promise<Person | null> => {
  const { data, error } = await supabase
    .rpc('get_person_details_by_slug', { p_slug: slug })
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error("Error fetching person:", error);
    throw new Error(error.message);
  }
  if (!data) return null;

  const personData = data as Person;
  personData.avatar_url = getAvatarUrl(personData.avatar_url, personData.id);
  return personData;
};

export const usePerson = (slug: string) => {
  return useQuery<Person | null>({
    queryKey: ["person", slug],
    queryFn: () => fetchPersonBySlug(slug),
    enabled: !!slug,
  });
};