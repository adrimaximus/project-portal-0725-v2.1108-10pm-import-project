import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface DemoContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('demoMode');
      return stored === 'true';
    } catch (error) {
      console.error("Failed to read demoMode from localStorage", error);
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('demoMode', String(isDemoMode));
    } catch (error) {
      console.error("Failed to save demoMode to localStorage", error);
    }
  }, [isDemoMode]);

  const toggleDemoMode = () => {
    setIsDemoMode(prev => !prev);
  };

  return (
    <DemoContext.Provider value={{ isDemoMode, toggleDemoMode }}>
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