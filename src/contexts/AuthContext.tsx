import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Collaborator } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { RealtimeChannel, Session } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  onlineCollaborators: Collaborator[];
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [onlineCollaborators, setOnlineCollaborators] = useState<Collaborator[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['userProfile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      return data as User;
    },
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !channel) {
      const newChannel = supabase.channel(`online-users`, {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      newChannel
        .on('presence', { event: 'sync' }, () => {
          const newState = newChannel.presenceState<Collaborator>();
          const collaborators = Object.values(newState)
            .flat()
            .filter(c => c.id !== user.id);
          setOnlineCollaborators(collaborators);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await newChannel.track({
              id: user.id,
              name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
              initials: `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase(),
              avatar_url: user.avatar_url,
            });
          }
        });
      
      setChannel(newChannel);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        setChannel(null);
      }
    };
  }, [user, channel]);

  return (
    <AuthContext.Provider value={{ user, session, isLoading: isUserLoading, onlineCollaborators }}>
      {!isUserLoading && children}
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