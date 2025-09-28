import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "./LoadingScreen";
import React, { useEffect, useRef } from "react";
import { supabase } from '@/integrations/supabase/client';
import { defaultNavItems } from '@/lib/defaultNavItems';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";
import ImpersonationBanner from "./ImpersonationBanner";

const ProtectedRouteLayout = () => {
  const { session, user, loading, hasPermission } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const navSyncAttempted = useRef(false);
  const sessionCheckAttempted = useRef(false);

  useEffect(() => {
    // Debug logging
    console.log('ProtectedRoute: Loading:', loading, 'Session:', !!session, 'User:', !!user);
    
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.error('Auth loading timeout - forcing redirect to login');
        toast.error('Authentication timeout. Please try logging in again.');
        window.location.href = '/login';
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading, session, user]);

  // Additional session check for Arc browser compatibility
  useEffect(() => {
    const checkSessionManually = async () => {
      if (sessionCheckAttempted.current || loading || session) return;
      
      sessionCheckAttempted.current = true;
      console.log('ProtectedRoute: Manually checking session for Arc browser compatibility...');
      
      try {
        const { data: { session: manualSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Manual session check error:', error);
          return;
        }
        
        if (manualSession && !session) {
          console.log('Found session manually that AuthContext missed - this might be an Arc browser issue');
          toast.info('Detected authentication session, refreshing...');
          window.location.reload();
        }
      } catch (error: any) {
        console.error('Manual session check failed:', error);
      }
    };

    // Only run this check if we're not loading and don't have a session
    if (!loading && !session) {
      setTimeout(checkSessionManually, 1000);
    }
  }, [loading, session]);

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
      } catch (error: any) {
        console.error("Error syncing nav items:", error);
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
    console.log('No session or user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return (
    <>
      <Outlet />
      <ImpersonationBanner />
    </>
  );
};

export default ProtectedRouteLayout;