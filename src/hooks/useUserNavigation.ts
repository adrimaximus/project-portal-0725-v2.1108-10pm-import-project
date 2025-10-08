import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { NavItem as DbNavItem } from '@/pages/NavigationSettingsPage';

export const useUserNavigation = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user_navigation_items', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('get_user_navigation_items');
      if (error) {
        console.error("Error fetching navigation items:", error);
        return [];
      }
      return data as DbNavItem[];
    },
    enabled: !!user,
  });
};