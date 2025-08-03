import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Goal, initialGoals } from '@/data/goals';

interface GoalsContextType {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'completions'>) => void;
  updateGoal: (goal: Goal) => void;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export const GoalsProvider = ({ children }: { children: ReactNode }) => {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);

  const addGoal = (goalData: Omit<Goal, 'id' | 'completions'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: `goal-${Date.now()}`,
      completions: [],
    };
    setGoals(prevGoals => [...prevGoals, newGoal]);
  };

  const updateGoal = (updatedGoal: Goal) => {
    setGoals(prevGoals =>
      prevGoals.map(goal => (goal.id === updatedGoal.id ? updatedGoal : goal))
    );
  };

  return (
    <GoalsContext.Provider value={{ goals, addGoal, updateGoal }}>
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