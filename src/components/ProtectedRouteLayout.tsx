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
            });
          } else {
            const updates: any = {};
            if (existing.url !== permittedItem.url) updates.url = permittedItem.url;
            if (existing.icon !== permittedItem.icon) updates.icon = permittedItem.icon;
            if (existing.position !== position) updates.position = position;
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
        }
      } catch (error) {
        console.error("Error in syncDefaultNavItems:", error);
      }
    };

    if (user && !loading) {
      syncDefaultNavItems();
    }
  }, [user, loading, queryClient, hasPermission]);

  useEffect(() => {
    if (!loading && session && !user) {
      toast.error("Could not load your user profile. Please log in again.", {
        description: "Your session might be invalid or there could be a network issue.",
      });
      logout();
    }
  }, [loading, session, user, logout]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session || !user) {
    // The useEffect above will handle the logout. In the meantime, show a loading screen.
    // A direct redirect here can cause loops if the state is flickering.
    return <LoadingScreen />;
  }
  
  if (location.pathname === '/') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRouteLayout;