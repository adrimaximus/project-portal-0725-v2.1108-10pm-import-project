import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "./LoadingScreen";
import React, { useEffect } from "react";
import { useLocationSaver } from '@/hooks/useLocationSaver';
import { supabase } from '@/integrations/supabase/client';
import { defaultNavItems } from '@/lib/defaultNavItems';
import { useQueryClient } from '@tanstack/react-query';

const ProtectedRouteLayout = () => {
  const { session, user, loading } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  useLocationSaver();

  useEffect(() => {
    const backfillNavItems = async () => {
      if (!user) return;

      const { count, error: countError } = await supabase
        .from('user_navigation_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        console.error("Error checking nav items:", countError);
        return;
      }

      if (count === 0) {
        console.log("No navigation items found for user, backfilling defaults.");
        const itemsToInsert = defaultNavItems.map((item, index) => ({
          user_id: user.id,
          name: item.name,
          url: item.url,
          icon: item.icon,
          position: index,
          is_enabled: true,
          is_deletable: false,
          is_editable: false,
        }));

        const { error: insertError } = await supabase
          .from('user_navigation_items')
          .insert(itemsToInsert);

        if (insertError) {
          console.error("Error backfilling nav items:", insertError);
        } else {
          queryClient.invalidateQueries({ queryKey: ['user_navigation_items', user.id] });
        }
      }
    };

    if (user && !loading) {
      backfillNavItems();
    }
  }, [user, loading, queryClient]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (!user) {
    return <LoadingScreen />;
  }

  return <Outlet />;
};

export default ProtectedRouteLayout;