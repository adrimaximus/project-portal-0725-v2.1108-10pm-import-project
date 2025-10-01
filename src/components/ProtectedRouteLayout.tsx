import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "./LoadingScreen";
import React, { useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';
import { defaultNavItems } from '@/lib/defaultNavItems';
import { useQueryClient } from '@tanstack/react-query';
import { NavItem as DbNavItem } from "@/pages/NavigationSettingsPage";

const ProtectedRouteLayout = () => {
  const { session, user, loading, hasPermission } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const syncDefaultNavItems = async () => {
      if (!user || !user.permissions) return;

      const syncFlag = `navSyncAttempted_${user.id}`;
      if (sessionStorage.getItem(syncFlag)) {
        return;
      }
      sessionStorage.setItem(syncFlag, 'true');

      try {
        const permittedDefaultItems = defaultNavItems.filter(defaultItem => {
          const path = defaultItem.url.split('?')[0];
          if (['/dashboard', '/profile', '/settings'].includes(path)) return true;
          const permission = `module:${path.replace('/', '')}`;
          return hasPermission(permission);
        });

        const { data: allUserItemsData, error: fetchError } = await supabase
          .rpc('get_user_navigation_items');

        if (fetchError) {
          console.error("Error fetching nav items:", fetchError);
          return;
        }
        const allUserItems = allUserItemsData as DbNavItem[];
        
        const existingDefaultItems = allUserItems.filter(item => item.is_deletable === false);

        const existingItemsMap = new Map(existingDefaultItems.map(item => [item.name, item]));
        const permittedItemsMap = new Map(permittedDefaultItems.map(item => [item.name, item]));

        const itemsToUpsert: any[] = [];
        const idsToDelete: string[] = [];

        // Check what should exist based on permissions
        for (const permittedItem of permittedDefaultItems) {
          const existing = existingItemsMap.get(permittedItem.name);
          const position = defaultNavItems.findIndex(i => i.name === permittedItem.name);
          
          const updates: any = {};
          let needsUpdate = false;

          if (!existing) {
            // Add item if it's permitted but doesn't exist
            itemsToUpsert.push({
              user_id: user.id,
              name: permittedItem.name,
              url: permittedItem.url,
              icon: permittedItem.icon,
              position,
              is_enabled: true,
              is_deletable: false,
              is_editable: false,
              type: 'url_embed' as const,
              folder_id: null,
            });
          } else {
            // Check for updates on existing items
            if (existing.url !== permittedItem.url) updates.url = permittedItem.url;
            if (existing.icon !== permittedItem.icon) updates.icon = permittedItem.icon;
            if (existing.position !== position) updates.position = position;
            if (!existing.is_enabled) updates.is_enabled = true; // Re-enable if permissions are back

            if (Object.keys(updates).length > 0) {
              itemsToUpsert.push({ id: existing.id, ...updates });
            }
          }
        }

        // Check what should be removed
        for (const existingItem of existingDefaultItems) {
          if (!permittedItemsMap.has(existingItem.name)) {
            idsToDelete.push(existingItem.id);
          }
        }

        let itemsChanged = false;

        if (idsToDelete.length > 0) {
          itemsChanged = true;
          const { error } = await supabase.from('user_navigation_items').delete().in('id', idsToDelete);
          if (error) console.error("Error deleting stale nav items:", error);
        }

        if (itemsToUpsert.length > 0) {
          itemsChanged = true;
          const { error } = await supabase.from('user_navigation_items').upsert(itemsToUpsert);
          if (error) console.error("Error upserting nav items:", error);
        }

        if (itemsChanged) {
          queryClient.invalidateQueries({ queryKey: ['user_navigation_items', user.id] });
          queryClient.invalidateQueries({ queryKey: ['navigation_folders', user.id] });
        }
      } catch (error) {
        console.error("Error in syncDefaultNavItems:", error);
      }
    };

    if (user && !loading) {
      syncDefaultNavItems();
    }
  }, [user, loading, queryClient, hasPermission]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (location.pathname === '/') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRouteLayout;