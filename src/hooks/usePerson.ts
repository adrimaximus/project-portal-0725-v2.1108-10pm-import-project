import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Person } from '@/types';
import { getAvatarUrl } from '@/lib/utils';

export const usePerson = (personId: string | null) => {
  return useQuery({
    queryKey: ['person', personId],
    queryFn: async (): Promise<Person | null> => {
      if (!personId) return null;
      const { data, error } = await supabase
        .rpc('get_person_details_by_id', { p_id: personId });
      
      if (error) throw error;
      if (!data || data.length === 0) return null;

      const personData = data[0] as Person;
      personData.avatar_url = getAvatarUrl(personData);
      return personData;
    },
    enabled: !!personId,
  });
};