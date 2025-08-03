import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { initialFeatures, Feature } from '@/data/features';

const getStoredFeatures = (): Feature[] => {
  try {
    const stored = localStorage.getItem('features');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every(item => 'id' in item && 'status' in item)) {
        const featureMap = new Map(parsed.map(f => [f.id, f]));
        return initialFeatures.map(f => featureMap.has(f.id) ? { ...f, status: featureMap.get(f.id).status } : f);
      }
    }
  } catch (error) {
    console.error("Failed to parse features from localStorage", error);
  }
  return initialFeatures;
};

interface FeaturesContextType {
  features: Feature[];
  toggleFeatureStatus: (featureId: string) => void;
  isFeatureEnabled: (featureId: string) => boolean;
}

const FeaturesContext = createContext<FeaturesContextType | undefined>(undefined);

export const FeaturesProvider = ({ children }: { children: ReactNode }) => {
  const [features, setFeatures] = useState<Feature[]>(getStoredFeatures);

  useEffect(() => {
    try {
      localStorage.setItem('features', JSON.stringify(features));
    } catch (error) {
      console.error("Failed to save features to localStorage", error);
    }
  }, [features]);

  const toggleFeatureStatus = (featureId: string) => {
    if (featureId === 'settings') return;
    setFeatures(prevFeatures =>
      prevFeatures.map(feature =>
        feature.id === featureId
          ? { ...feature, status: feature.status === 'enabled' ? 'disabled' : 'enabled' }
          : feature
      )
    );
  };

  const isFeatureEnabled = useCallback((featureId: string): boolean => {
    const feature = features.find(f => f.id === featureId);
    return feature ? feature.status === 'enabled' : false;
  }, [features]);

  return (
    <FeaturesContext.Provider value={{ features, toggleFeatureStatus, isFeatureEnabled }}>
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