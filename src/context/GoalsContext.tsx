import { createContext, useContext, useState, ReactNode } from 'react';
import { Goal, dummyGoals } from '@/data/goals';

interface GoalsContextType {
  goals: Goal[];
  addGoal: (newGoal: Omit<Goal, 'id' | 'completions' | 'collaborators' | 'description' | 'tags'>) => void;
  updateGoal: (updatedGoal: Goal) => void;
  deleteGoal: (goalId: string) => void;
  getGoalById: (id: string) => Goal | undefined;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export const GoalsProvider = ({ children }: { children: ReactNode }) => {
  const [goals, setGoals] = useState<Goal[]>(dummyGoals);

  const addGoal = (newGoalData: Omit<Goal, 'id' | 'completions' | 'collaborators' | 'description' | 'tags'>) => {
    const newGoal: Goal = {
      description: '',
      tags: [],
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

  const deleteGoal = (goalId: string) => {
    setGoals(prevGoals => prevGoals.filter(g => g.id !== goalId));
  };

  const getGoalById = (id: string) => {
    return goals.find(g => g.id === id);
  };

  return (
    <GoalsContext.Provider value={{ goals, addGoal, updateGoal, deleteGoal, getGoalById }}>
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