import { useParams, Link } from 'react-router-dom';
import { dummyGoals, Goal } from '@/data/goals';
import GoalYearlyProgress from '@/components/goals/GoalYearlyProgress';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { format, parseISO } from 'date-fns';

const GoalPage = () => {
  const { id } = useParams<{ id: string }>();
  const [goals, setGoals] = useState(dummyGoals);
  const goal = goals.find(g => g.id === id);

  if (!goal) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold">Goal not found</h1>
        <Button asChild variant="link">
          <Link to="/">Go back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const handleToggleCompletion = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    setGoals(currentGoals => {
      return currentGoals.map(g => {
        if (g.id === goal.id) {
          const newCompletions = [...g.completions];
          const existingCompletionIndex = newCompletions.findIndex(c => c.date === dateStr);

          if (existingCompletionIndex > -1) {
            const existing = newCompletions[existingCompletionIndex];
            newCompletions[existingCompletionIndex] = { ...existing, completed: !existing.completed };
          } else {
            newCompletions.push({ date: dateStr, completed: true });
          }
          return { ...g, completions: newCompletions };
        }
        return g;
      });
    });
  };

  const { icon: Icon } = goal;

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Goals</Link>
        </Button>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${goal.color}20` }}>
              <Icon className="h-8 w-8" style={{ color: goal.color }} />
            </div>
            <div>
              <CardTitle className="text-2xl">{goal.title}</CardTitle>
              <CardDescription>Yearly progress overview</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <GoalYearlyProgress 
        goal={goal}
        onToggleCompletion={handleToggleCompletion}
      />
    </div>
  );
};

export default GoalPage;