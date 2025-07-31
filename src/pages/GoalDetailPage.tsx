import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { Goal, GoalCompletion } from '@/data/goals';
import GoalDetail from '@/components/goals/GoalDetail';
import CompletionCalendar from '@/components/goals/CompletionCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGoals } from '@/context/GoalsContext';
import { format } from 'date-fns';

const GoalDetailPage = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { getGoalById, updateGoal, deleteGoal, goals } = useGoals();

  const [goal, setGoal] = useState<Goal | undefined>(undefined);

  useEffect(() => {
    if (goalId) {
      setGoal(getGoalById(goalId));
    }
  }, [goalId, getGoalById, goals]);

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
    updateGoal(updatedGoal);
  };

  const handleDeleteGoal = (id: string) => {
    deleteGoal(id);
    navigate('/goals');
  };

  const handleToggleCompletion = (dateToToggle: Date) => {
    if (!goal) return;
    const dateString = format(dateToToggle, 'yyyy-MM-dd');
    
    const existingCompletionIndex = goal.completions.findIndex(c => c.date === dateString);
    
    let newCompletions: GoalCompletion[];

    if (existingCompletionIndex > -1) {
        newCompletions = goal.completions.map((c, index) => 
            index === existingCompletionIndex ? { ...c, completed: !c.completed } : c
        );
    } else {
        newCompletions = [...goal.completions, { date: dateString, completed: true }];
    }

    const updatedGoal = {
      ...goal,
      completions: newCompletions,
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
                  completions={goal.completions}
                  color={goal.color}
                  onToggleCompletion={handleToggleCompletion}
                  frequency={goal.frequency}
                  specificDays={goal.specificDays}
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