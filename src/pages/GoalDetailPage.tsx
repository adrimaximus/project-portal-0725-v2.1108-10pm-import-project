import { useParams } from 'react-router-dom';
import { initialGoals, Goal } from '@/data/goals';
import GoalYearlyProgress from '@/components/goals/GoalYearlyProgress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';

const GoalDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [goals, setGoals] = useState(initialGoals);
  const goal = goals.find(g => g.id === id);

  const handleToggleCompletion = () => {
    if (!goal) return;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const updatedGoals = goals.map(g => {
      if (g.id === goal.id) {
        const isCompleted = g.completions.some(c => isSameDay(parseISO(c.date), new Date()));
        if (isCompleted) {
          return {
            ...g,
            completions: g.completions.filter(c => !isSameDay(parseISO(c.date), new Date())),
          };
        } else {
          return {
            ...g,
            completions: [...g.completions, { date: todayStr }],
          };
        }
      }
      return g;
    });
    setGoals(updatedGoals);
  };

  if (!goal) {
    return <div>Goal not found</div>;
  }

  const isCompletedToday = goal.completions.some(c => isSameDay(parseISO(c.date), new Date()));

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${goal.color}20` }}>
                <goal.icon className="h-6 w-6" style={{ color: goal.color }} />
              </div>
              <CardTitle className="text-2xl font-bold">{goal.title}</CardTitle>
            </div>
            <Button onClick={handleToggleCompletion}>
              {isCompletedToday ? 'Mark as Incomplete' : 'Mark as Complete'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <GoalYearlyProgress goal={goal} />
        </CardContent>
      </Card>
    </div>
  );
};

export default GoalDetailPage;