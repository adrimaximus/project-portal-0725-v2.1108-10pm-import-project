import { supabase } from '@/integrations/supabase/client';
import { Person } from '@/types';

export const getPeople = async (): Promise<Person[]> => {
  const { data, error } = await supabase.rpc('get_people_with_details');
  if (error) throw error;
  return data as Person[];
};