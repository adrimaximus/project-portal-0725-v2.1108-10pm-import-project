import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, SupabaseSession, SupabaseUser, Collaborator } from '@/types';
import { toast } from 'sonner';

interface AuthContextType {
  session: SupabaseSession | null;
  user: User | null;
  collaborators: Collaborator[];
  loading: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await fetchUserProfile(session.user);
        await fetchCollaborators(session.user.id);
      }
      setLoading(false);
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchUserProfile(session.user);
        await fetchCollaborators(session.user.id);
      } else {
        setUser(null);
        setCollaborators([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    if (!supabaseUser) {
      setUser(null);
      return;
    }
    try {
      const { data: profile, error } = await supabase
        .rpc('get_user_profile_with_permissions', { p_user_id: supabaseUser.id });

      if (error) {
        throw error;
      }

      if (profile && profile.length > 0) {
        const userProfile = profile[0];
        const fullName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
        setUser({
          id: userProfile.id,
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          name: fullName,
          email: userProfile.email || undefined,
          avatar_url: userProfile.avatar_url,
          role: userProfile.role || undefined,
          status: userProfile.status || undefined,
          sidebar_order: userProfile.sidebar_order || undefined,
          permissions: userProfile.permissions || [],
        });
      } else {
        // Fallback for user without profile entry yet
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email,
          first_name: null,
          last_name: null,
          avatar_url: null,
          name: supabaseUser.email,
        });
      }
    } catch (error: any) {
      toast.error("Failed to fetch user profile", { description: error.message });
      setUser(null);
    }
  };

  const fetchCollaborators = async (currentUserId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('id, first_name, last_name, email, avatar_url');
      if (error) throw error;
      if (data) {
        const allUsers = data.map(p => {
          const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
          return {
            id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
            name: fullName || p.email,
            email: p.email,
            avatar_url: p.avatar_url,
          };
        });
        setCollaborators(allUsers.filter(u => u.id !== currentUserId));
      }
    } catch (error: any) {
      toast.error("Failed to fetch collaborators", { description: error.message });
    }
  };

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'master admin') return true;
    return user.permissions?.includes(permission) ?? false;
  }, [user]);

  return (
    <AuthContext.Provider value={{ session, user, collaborators, loading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};