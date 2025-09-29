import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "./LoadingScreen";
import React, { useEffect, useRef } from "react";
import { supabase } from '@/integrations/supabase/client';
import { defaultNavItems } from '@/lib/defaultNavItems';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";

const ProtectedRouteLayout = () => {
  const { session, user, loading, logout, hasPermission } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const navSyncAttempted = useRef(false);

  useEffect(() => {
    const syncDefaultNavItems = async () => {
      if (!user || !user.permissions || navSyncAttempted.current) return;
      navSyncAttempted.current = true;

      try {
        const permittedDefaultItems = defaultNavItems.filter(defaultItem => {
          const path = defaultItem.url.split('?')[0];
          if (['/dashboard', '/profile', '/settings'].includes(path)) return true;
          const permission = `module:${path.replace('/', '')}`;
          return hasPermission(permission);
        });

        const { data: existingItems, error: fetchError } = await supabase
          .from('user_navigation_items')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_deletable', false);

        if (fetchError) {
          console.error("Error fetching nav items:", fetchError);
          return;
        }

        const { data: folderId, error: rpcError } = await supabase.rpc('get_or_create_default_nav_folder', { p_user_id: user.id });
        if (rpcError) {
            console.error("Could not get or create default folder during nav sync:", rpcError);
            return;
        }
        if (!folderId) {
            console.error("Default folder ID was not returned from RPC.");
            return;
        }

        const existingItemsMap = new Map(existingItems.map(item => [item.name, item]));
        const permittedItemsMap = new Map(permittedDefaultItems.map(item => [item.name, item]));

        const itemsToUpsert = [];
        const idsToDelete = [];

        for (const permittedItem of permittedDefaultItems) {
          const existing = existingItemsMap.get(permittedItem.name);
          const position = defaultNavItems.findIndex(i => i.name === permittedItem.name);
          if (!existing) {
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
              folder_id: folderId,
            });
          } else {
            const updates: any = {};
            if (existing.url !== permittedItem.url) updates.url = permittedItem.url;
            if (existing.icon !== permittedItem.icon) updates.icon = permittedItem.icon;
            if (existing.position !== position) updates.position = position;
            if (!existing.folder_id) updates.folder_id = folderId;
            
            if (Object.keys(updates).length > 0) {
              itemsToUpsert.push({ id: existing.id, ...updates });
            }
          }
        }

        for (const existingItem of existingItems) {
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
    // Covers the initial app load while session is being checked.
    return <LoadingScreen />;
  }

  if (!session) {
    // If after the initial load there's no session, redirect to login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user) {
    // If there's a session but no user profile, it means the profile fetch failed.
    // AuthContext will handle the logout. In the meantime, show a loading screen.
    return <LoadingScreen />;
  }
  
  if (location.pathname === '/') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRouteLayout;