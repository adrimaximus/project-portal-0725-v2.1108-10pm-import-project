import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "./LoadingScreen";
import React, { useEffect, useRef } from "react";
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
  const navSyncAttempted = useRef(false);

  useEffect(() => {
    const syncDefaultNavItems = async () => {
      if (!user || navSyncAttempted.current) return;
      navSyncAttempted.current = true;

      const { data: existingItems, error: fetchError } = await supabase
        .from('user_navigation_items')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error("Error fetching nav items:", fetchError);
        return;
      }

      let itemsChanged = false;
      const itemsToUpsert = [];
      const idsToDelete = [];
      
      const highestPosition = existingItems.reduce((max, item) => Math.max(max, item.position), -1);
      let positionCounter = 1;

      for (const defaultItem of defaultNavItems) {
        // Match only top-level items that are not in a folder
        const matchingItems = existingItems.filter(item => item.name.trim() === defaultItem.name && !item.folder_id);

        if (matchingItems.length === 0) {
          itemsToUpsert.push({
            user_id: user.id,
            name: defaultItem.name,
            url: defaultItem.url,
            icon: defaultItem.icon,
            position: highestPosition + positionCounter++,
            is_enabled: true,
            is_deletable: false,
            is_editable: false,
          });
          itemsChanged = true;
        } else {
          const primaryItem = matchingItems[0];
          const updates: any = {};

          if (primaryItem.url !== defaultItem.url) updates.url = defaultItem.url;
          if (primaryItem.is_deletable !== false) updates.is_deletable = false;
          if (primaryItem.is_editable !== false) updates.is_editable = false;
          if (primaryItem.icon !== defaultItem.icon) updates.icon = defaultItem.icon;

          if (Object.keys(updates).length > 0) {
            itemsToUpsert.push({ id: primaryItem.id, ...updates });
            itemsChanged = true;
          }

          if (matchingItems.length > 1) {
            idsToDelete.push(...matchingItems.slice(1).map(d => d.id));
            itemsChanged = true;
          }
        }
      }

      if (idsToDelete.length > 0) {
        const { error } = await supabase.from('user_navigation_items').delete().in('id', idsToDelete);
        if (error) console.error("Error deleting duplicate nav items:", error);
      }

      if (itemsToUpsert.length > 0) {
        const { error } = await supabase.from('user_navigation_items').upsert(itemsToUpsert);
        if (error) console.error("Error upserting nav items:", error);
      }

      if (itemsChanged) {
        toast.info("Your navigation sidebar has been updated.");
        queryClient.invalidateQueries({ queryKey: ['user_navigation_items', user.id] });
      }
    };

    if (user && !loading) {
      syncDefaultNavItems();
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