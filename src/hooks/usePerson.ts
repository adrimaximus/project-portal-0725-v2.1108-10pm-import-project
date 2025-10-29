import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Person } from '@/types';

export const usePerson = (slug: string) => {
  return useQuery<Person | null>({
    queryKey: ['person', slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .rpc('get_person_details_by_slug', { p_slug: slug })
        .single();

      if (error) {
        // PGRST116: No rows found, which is not an error for a .single() call that might find nothing.
        if (error.code === 'PGRST116') {
          console.warn(`Person with slug "${slug}" not found.`);
          return null;
        }
        console.error('Error fetching person by slug:', error);
        throw error;
      }
      return data as Person;
    },
    enabled: !!slug,
  });
};