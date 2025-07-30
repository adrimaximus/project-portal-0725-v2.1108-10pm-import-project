import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dummyGoals, Goal, GoalCompletion } from '@/data/goals';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import GoalHeader from '@/components/goals/GoalHeader';
import GoalYearlyProgress from '@/components/goals/GoalYearlyProgress';
import { format, startOfDay } from 'date-fns';

const GoalDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>(dummyGoals);
  const [goal, setGoal] = useState<Goal | null>(null);

  useEffect(() => {
    const foundGoal = goals.find(g => g.id === id);
    if (foundGoal) {
      setGoal(foundGoal);
    }
  }, [id, goals]);

  const handleUpdateGoal = (updatedGoal: Goal) => {
    setGoals(prevGoals => {
      const newGoals = prevGoals.map(g => (g.id === updatedGoal.id ? updatedGoal : g));
      const foundGoal = newGoals.find(g => g.id === id);
      if (foundGoal) {
        setGoal(foundGoal);
      }
      return newGoals;
    });
  };

  const handleToggleCompletion = (date: Date) => {
    if (!goal) return;

    const dateString = format(date, 'yyyy-MM-dd');

    setGoal(prevGoal => {
      if (!prevGoal) return null;

      const existingCompletion = prevGoal.completions.find(c => c.date === dateString);
      let newCompletions: GoalCompletion[];

      if (existingCompletion) {
        newCompletions = prevGoal.completions.map(c =>
          c.date === dateString ? { ...c, completed: !c.completed } : c
        );
      } else {
        newCompletions = [...prevGoal.completions, { date: dateString, completed: true }];
      }

      const updatedGoal = { ...prevGoal, completions: newCompletions };
      
      setGoals(prevGoals => prevGoals.map(g => g.id === updatedGoal.id ? updatedGoal : g));

      return updatedGoal;
    });
  };

  if (!goal) {
    return (
      <div className="container mx-auto p-4">
        <p>Goal not found.</p>
        <Button variant="ghost" onClick={() => navigate('/')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Goals
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to All Goals
      </Button>

      <GoalHeader goal={goal} onUpdate={handleUpdateGoal} />

      <div className="mt-8">
        <GoalYearlyProgress
          goal={goal}
          onToggleCompletion={handleToggleCompletion}
        />
      </div>
    </div>
  );
};

export default GoalDetailPage;