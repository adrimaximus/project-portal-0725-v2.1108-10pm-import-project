import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Role } from '@/components/settings/RoleManagerDialog';

const fetchRoles = async (): Promise<Role[]> => {
  const { data, error } = await supabase.from('roles').select('*');
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const useRoles = () => {
  return useQuery<Role[], Error>({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  });
};