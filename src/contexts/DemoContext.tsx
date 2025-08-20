import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DemoContextType {
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => Promise<void>;
  isLoading: boolean;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDemoMode = useCallback(async () => {
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'DEMO_MODE')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
      console.error("Failed to fetch demo mode status", error);
    }
    
    setIsDemoMode(data?.value === 'true');
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDemoMode();

    const channel = supabase
      .channel('app_config_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_config', filter: 'key=eq.DEMO_MODE' },
        (payload) => {
          const newValue = (payload.new as { value: string })?.value;
          setIsDemoMode(newValue === 'true');
          toast.info(`Demo mode has been ${newValue === 'true' ? 'enabled' : 'disabled'} by an admin.`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDemoMode]);

  const setDemoMode = async (enabled: boolean) => {
    const { error } = await supabase
      .from('app_config')
      .upsert({ key: 'DEMO_MODE', value: String(enabled) }, { onConflict: 'key' });

    if (error) {
      toast.error("Failed to update demo mode setting.");
      throw error;
    }
    // The realtime subscription will handle the state update for all clients, including this one.
  };

  return (
    <DemoContext.Provider value={{ isDemoMode, setDemoMode, isLoading }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};