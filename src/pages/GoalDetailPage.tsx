import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { Goal } from '@/data/goals';
import PortalLayout from '@/components/PortalLayout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import GoalHeader from '@/components/goals/GoalHeader';
import GoalProgressChart from '@/components/goals/GoalProgressChart';
import GoalCompletions from '@/components/goals/GoalCompletions';
import { getYear, parseISO } from 'date-fns';
import AiCoachInsight from '@/components/goals/AiCoachInsight';
import { useGoals } from '@/context/GoalsContext';

const GoalDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { goals, updateGoal } = useGoals();
  const [goal, setGoal] = useState<Goal | null>(null);

  useEffect(() => {
    const foundGoal = goals.find(g => g.id === id);
    setGoal(foundGoal || null);
  }, [id, goals]);

  const handleUpdate = (updatedGoal: Goal) => {
    updateGoal(updatedGoal);
  };

  const progress = useMemo(() => {
    if (!goal || (goal.type !== 'quantity' && goal.type !== 'value')) return null;

    const target = goal.type === 'quantity' ? goal.targetQuantity : goal.targetValue;
    if (!target || goal.targetPeriod !== 'Yearly') return null;

    const currentYear = getYear(new Date());
    const totalProgress = goal.completions
      .filter(c => getYear(parseISO(c.date)) === currentYear)
      .reduce((sum, c) => sum + c.value, 0);

    return {
      percentage: Math.round((totalProgress / target) * 100),
    };
  }, [goal]);

  if (!goal) {
    return <PortalLayout><div className="text-center py-10">Goal not found.</div></PortalLayout>;
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/goals">Goals</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{goal.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <GoalHeader goal={goal} />
          <Button variant="outline" size="sm" onClick={() => navigate(`/goals/${goal.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Goal
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <GoalProgressChart goal={goal} />
          <GoalCompletions goal={goal} onUpdate={handleUpdate} />
        </div>
        
        <AiCoachInsight goal={goal} progress={progress} />

      </div>
    </PortalLayout>
  );
};

export default GoalDetailPage;