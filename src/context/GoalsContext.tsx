import { createContext, useContext, useState, ReactNode } from 'react';
import { Goal, sampleGoals } from '@/data/goals';
import { v4 as uuidv4 } from 'uuid';

interface GoalsContextType {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'completions'>) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (goalId: string) => void;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export const GoalsProvider = ({ children }: { children: ReactNode }) => {
  const [goals, setGoals] = useState<Goal[]>(sampleGoals);

  const addGoal = (goalData: Omit<Goal, 'id' | 'completions'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: uuidv4(),
      completions: [],
    };
    setGoals(prevGoals => [...prevGoals, newGoal]);
  };

  const updateGoal = (updatedGoal: Goal) => {
    setGoals(prevGoals =>
      prevGoals.map(goal => (goal.id === updatedGoal.id ? updatedGoal : goal))
    );
  };

  const deleteGoal = (goalId: string) => {
    setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
  };

  return (
    <GoalsContext.Provider value={{ goals, addGoal, updateGoal, deleteGoal }}>
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