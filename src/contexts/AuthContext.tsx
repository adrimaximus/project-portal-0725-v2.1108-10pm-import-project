"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { User as AppUser } from "@/types";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import SafeLocalStorage from "@/lib/localStorage";

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  isImpersonating: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  startImpersonation: (targetUser: AppUser) => Promise<void>;
  stopImpersonation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);

  const fetchUserProfile = useCallback(async (authUser: SupabaseUser | null): Promise<AppUser | null> => {
    if (!authUser) return null;
    
    const { data, error } = await supabase
      .rpc('get_user_profile_with_permissions', { p_user_id: authUser.id })
      .single();

    if (error) {
      console.error("Error fetching user profile with permissions:", error);
      // Fallback to basic profile fetch if RPC fails
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (profileError) {
        console.error("Fallback profile fetch also failed:", profileError);
        return null;
      }
      
      const fullName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
      return {
        ...profileData,
        name: fullName || profileData.email,
        initials: getInitials(fullName, profileData.email),
        permissions: [],
      } as AppUser;
    }
    
    return data as AppUser;
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const profile = await fetchUserProfile(authUser);
      setUser(profile);
      if (profile) {
        SafeLocalStorage.setItem('lastUserName', profile.name);
      }
    }
  }, [fetchUserProfile]);
  
  const stopImpersonation = async () => {
    const originalSession = SafeLocalStorage.getItem<{ access_token: string, refresh_token: string | undefined }>('original_session');
    if (originalSession) {
      const { error } = await supabase.auth.setSession({
        access_token: originalSession.access_token,
        refresh_token: originalSession.refresh_token!,
      });
      SafeLocalStorage.removeItem('original_session');
      setIsImpersonating(false);
      if (error) {
        toast.error("Failed to restore session. Please log in again.");
        await supabase.auth.signOut();
      } else {
        toast.info("Returned to your original session.");
      }
    }
  };

  const logout = async () => {
    await stopImpersonation();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout failed", { description: error.message });
    }
  };

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user || !user.permissions) {
      return false;
    }
    if (user.permissions.includes('*')) {
      return true;
    }
    const [module, action] = permission.split(':');
    if (action) {
      if (user.permissions.includes(`${module}:*`)) {
        return true;
      }
    }
    return user.permissions.includes(permission);
  }, [user]);

  const startImpersonation = async (targetUser: AppUser) => {
    if (!session) {
      toast.error("You must be logged in to impersonate.");
      return;
    }
    try {
      const originalSession = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      };
      SafeLocalStorage.setItem('original_session', originalSession);

      const { data, error } = await supabase.functions.invoke('impersonate-user', {
        body: { target_user_id: targetUser.id },
      });
      if (error) throw error;

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (sessionError) throw sessionError;

      setIsImpersonating(true);
      toast.success(`Now viewing as ${targetUser.name}.`);
    } catch (error: any) {
      toast.error("Failed to impersonate user.", { description: error.message });
      SafeLocalStorage.removeItem('original_session');
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      const profile = await fetchUserProfile(session?.user ?? null);
      setUser(profile);
      setIsImpersonating(!!SafeLocalStorage.getItem('original_session'));
      setIsLoading(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        const profile = await fetchUserProfile(session?.user ?? null);
        setUser(profile);
        setIsImpersonating(!!SafeLocalStorage.getItem('original_session'));
        if (_event === 'SIGNED_IN' || _event === 'USER_UPDATED' || _event === 'TOKEN_REFRESHED') {
          setIsLoading(false);
        }
        if (_event === 'SIGNED_OUT') {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const value = {
    user,
    session,
    isLoading,
    isImpersonating,
    refreshUser,
    logout,
    hasPermission,
    startImpersonation,
    stopImpersonation,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};