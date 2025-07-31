import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { dummyGoals, Goal } from '@/data/goals';
import GoalDetail from '@/components/goals/GoalDetail';
import CompletionCalendar from '@/components/goals/CompletionCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const GoalDetailPage = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  
  const [goals, setGoals] = useState(dummyGoals);
  const goal = goals.find((g) => g.id === parseInt(goalId || '', 10));

  if (!goal) {
    return (
      <PortalLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Goal not found</h1>
          <Button asChild variant="link">
            <Link to="/goals">Go back to goals</Link>
          </Button>
        </div>
      </PortalLayout>
    );
  }

  const handleUpdateGoal = (updatedGoal: Goal) => {
    setGoals(goals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };

  const handleDeleteGoal = (goalIdToDelete: number) => {
    setGoals(goals.filter(g => g.id !== goalIdToDelete));
    navigate('/goals');
  };

  const handleToggleCompletion = (date: string, completed: boolean) => {
    const updatedGoal = {
      ...goal,
      completions: {
        ...goal.completions,
        [date]: completed,
      },
    };
    handleUpdateGoal(updatedGoal);
  };

  return (
    <PortalLayout>
      <div className="space-y-8">
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/goals">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Goals
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <GoalDetail 
              goal={goal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
            />
          </div>
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Progress Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <CompletionCalendar 
                  goal={goal}
                  onToggleCompletion={handleToggleCompletion}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default GoalDetailPage;