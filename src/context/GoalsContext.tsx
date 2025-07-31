import { createContext, useContext, useState, ReactNode } from 'react';
import { Goal, dummyGoals } from '@/data/goals';

interface GoalsContextType {
  goals: Goal[];
  addGoal: (newGoal: Omit<Goal, 'id' | 'completions' | 'collaborators'>) => void;
  updateGoal: (updatedGoal: Goal) => void;
  getGoalById: (id: string) => Goal | undefined;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export const GoalsProvider = ({ children }: { children: ReactNode }) => {
  const [goals, setGoals] = useState<Goal[]>(dummyGoals);

  const addGoal = (newGoalData: Omit<Goal, 'id' | 'completions' | 'collaborators'>) => {
    const newGoal: Goal = {
      ...newGoalData,
      id: `goal-${Date.now()}`,
      completions: [],
      collaborators: [],
    };
    setGoals(prevGoals => [...prevGoals, newGoal]);
  };

  const updateGoal = (updatedGoal: Goal) => {
    setGoals(prevGoals => prevGoals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };

  const getGoalById = (id: string) => {
    return goals.find(g => g.id === id);
  };

  return (
    <GoalsContext.Provider value={{ goals, addGoal, updateGoal, getGoalById }}>
      {children}
    </GoalsContext.Provider>
  );
};

export const useGoals = () => {
  const context = useContext(GoalsContext);
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
};