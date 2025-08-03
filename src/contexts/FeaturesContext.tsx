import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { defaultFeatures, Feature } from '@/data/features';

const FEATURES_STORAGE_KEY = 'app_features';

interface FeaturesContextType {
  features: Feature[];
  toggleFeatureStatus: (featureId: string) => void;
  isFeatureEnabled: (featureId: string) => boolean;
}

const FeaturesContext = createContext<FeaturesContextType | undefined>(undefined);

export const FeaturesProvider = ({ children }: { children: ReactNode }) => {
  const [features, setFeatures] = useState<Feature[]>(() => {
    try {
      const storedFeatures = localStorage.getItem(FEATURES_STORAGE_KEY);
      if (storedFeatures) {
        // Basic validation to ensure stored data structure is not completely off
        const parsed = JSON.parse(storedFeatures);
        if (Array.isArray(parsed) && parsed.length > 0 && 'id' in parsed[0]) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Failed to load features from localStorage", error);
    }
    return defaultFeatures;
  });

  useEffect(() => {
    try {
      localStorage.setItem(FEATURES_STORAGE_KEY, JSON.stringify(features));
    } catch (error) {
      console.error("Failed to save features to localStorage", error);
    }
  }, [features]);

  const toggleFeatureStatus = (featureId: string) => {
    // Prevent disabling the settings page itself
    if (featureId === 'settings') return;

    setFeatures(prevFeatures =>
      prevFeatures.map(feature =>
        feature.id === featureId
          ? { ...feature, status: feature.status === 'enabled' ? 'upgrade' : 'enabled' }
          : feature
      )
    );
  };

  const isFeatureEnabled = (featureId: string) => {
    const feature = features.find(f => f.id === featureId);
    return feature ? feature.status === 'enabled' : false;
  };

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