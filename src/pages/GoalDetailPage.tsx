import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { goals as initialGoals, Goal } from '@/data/goals';
import GoalHeader from '@/components/goals/GoalHeader';
import GoalYearlyProgress from '@/components/goals/GoalYearlyProgress';
import { formatISO, startOfDay, parseISO } from 'date-fns';
import { produce } from 'immer';
import { Button } from '@/components/ui/button';

const GoalDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // In a real app, this would come from a global state or API
  const [goals, setGoals] = useState<Goal[]>(initialGoals);

  const activeGoal = goals.find(g => g.id === id);

  const handleUpdateGoal = (updatedGoal: Goal) => {
    setGoals(produce(draft => {
      const index = draft.findIndex(g => g.id === updatedGoal.id);
      if (index !== -1) {
        draft[index] = updatedGoal;
      }
    }));
  };

  const handleToggleCompletion = (date: Date) => {
    if (!activeGoal) return;

    const dateStr = formatISO(startOfDay(date));
    
    setGoals(produce(draft => {
      const goal = draft.find(g => g.id === id);
      if (goal) {
        const completionIndex = goal.completions.findIndex(c => c.date === dateStr);
        if (completionIndex > -1) {
          goal.completions[completionIndex].completed = !goal.completions[completionIndex].completed;
        } else {
          goal.completions.push({ date: dateStr, completed: true });
        }
        goal.completions.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
      }
    }));
  };

  if (!activeGoal) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Goal not found</h1>
          <Button onClick={() => navigate('/')} className="mt-4">Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <GoalHeader goal={activeGoal} onUpdate={handleUpdateGoal} />
      <div className="mt-8">
        <GoalYearlyProgress
          goal={activeGoal}
          onToggleCompletion={handleToggleCompletion}
        />
      </div>
    </div>
  );
};

export default GoalDetailPage;