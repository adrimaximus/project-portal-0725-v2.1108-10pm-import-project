import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "./LoadingScreen";
import React, { useEffect } from "react";
import { useLocationSaver } from '@/hooks/useLocationSaver';
import { supabase } from '@/integrations/supabase/client';
import { defaultNavItems } from '@/lib/defaultNavItems';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";

const ProtectedRouteLayout = () => {
  const { session, user, loading } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  useLocationSaver();

  useEffect(() => {
    const backfillNavItems = async () => {
      if (!user) return;

      const { data: existingItems, error: fetchError } = await supabase
        .from('user_navigation_items')
        .select('name, position')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error("Error checking nav items:", fetchError);
        return;
      }

      const existingDefaultItemNames = new Set(
        existingItems.map(item => item.name)
      );
      
      const highestPosition = existingItems.reduce((max, item) => Math.max(max, item.position), -1);

      const missingDefaultItems = defaultNavItems.filter(
        defaultItem => !existingDefaultItemNames.has(defaultItem.name)
      );

      if (missingDefaultItems.length > 0) {
        console.log("Missing default navigation items found, backfilling:", missingDefaultItems.map(i => i.name));
        
        const itemsToInsert = missingDefaultItems.map((item, index) => ({
          user_id: user.id,
          name: item.name,
          url: item.url,
          icon: item.icon,
          position: highestPosition + 1 + index,
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
          toast.success("Navigation updated with new items.");
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