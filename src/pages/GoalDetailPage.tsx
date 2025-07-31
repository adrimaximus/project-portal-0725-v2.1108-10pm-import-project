import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { dummyGoals, Goal } from '@/data/goals';
import GoalHeader from '@/components/goals/GoalHeader';
import YearlyProgress from '@/components/goals/YearlyProgress';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GoalDetailPage = () => {
  const { goalId = 'goal-1' } = useParams<{ goalId: string }>();
  const [goal, setGoal] = useState<Goal | null>(null);

  useEffect(() => {
    const foundGoal = dummyGoals.find(g => g.id === goalId);
    if (foundGoal) {
      setGoal(foundGoal);
    } else {
      const defaultGoal = dummyGoals[0];
      setGoal(defaultGoal);
      toast.info(`Goal with ID "${goalId}" not found. Showing default goal.`);
    }
  }, [goalId]);

  if (!goal) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading goal...</p>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          {/* Asumsi ada halaman daftar tujuan di rute '/goals' */}
          <Button asChild variant="ghost" className="mb-4 px-2">
            <Link to="/goals">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Goals
            </Link>
          </Button>
          <GoalHeader goal={goal} />
        </div>
        <YearlyProgress goal={goal} />
      </div>
    </PortalLayout>
  );
};

export default GoalDetailPage;