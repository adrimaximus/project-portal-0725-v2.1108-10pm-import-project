import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export interface FeatureFlag {
  id: string;
  is_enabled: boolean;
  name: string;
  description: string;
}

interface FeaturesContextType {
  features: FeatureFlag[];
  toggleFeatureStatus: (featureId: string, currentState: boolean) => Promise<void>;
  isFeatureEnabled: (featureId: string) => boolean;
  isLoading: boolean;
}

const FeaturesContext = createContext<FeaturesContextType | undefined>(undefined);

export const FeaturesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeatures = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('feature_flags').select('*');
    if (error) {
      console.error("Failed to fetch feature flags", error);
      setFeatures([]);
    } else {
      setFeatures(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchFeatures();
    }
  }, [user, fetchFeatures]);

  const toggleFeatureStatus = async (featureId: string, currentState: boolean) => {
    const { error } = await supabase
      .from('feature_flags')
      .update({ is_enabled: !currentState })
      .eq('id', featureId);

    if (error) {
      toast.error(`Failed to update feature: ${error.message}`);
    } else {
      toast.success("Feature status updated.");
      await fetchFeatures();
    }
  };

  const isFeatureEnabled = useCallback((featureId: string): boolean => {
    const feature = features.find(f => f.id === featureId);
    return feature ? feature.is_enabled : false;
  }, [features]);

  return (
    <FeaturesContext.Provider value={{ features, toggleFeatureStatus, isFeatureEnabled, isLoading }}>
      {children}
    </FeaturesContext.Provider>
  );
};

export const useFeatures = () => {
  const context = useContext(FeaturesContext);
  if (context === undefined) {
    throw new Error('useFeatures must be used within a FeaturesProvider');
  }
  return context;
};