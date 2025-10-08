import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { Person } from '@/types';
import { getAvatarUrl } from '@/lib/utils';

export const usePerson = (personId: string) => {
  return useQuery<Person>({
    queryKey: ['person', personId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_person_details_by_id', { p_id: personId })
        .single();

      if (error) throw error;
      if (!data) throw new Error('Person not found');

      const personData = data as Person;
      personData.avatar_url = getAvatarUrl(personData.avatar_url);
      return personData;
    },
    enabled: !!personId,
  });
};