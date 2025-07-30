import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { dummyGoals, Goal } from '@/data/goals';
import GoalDetail from '@/components/goals/GoalDetail';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent } from '@/components/ui/card';
import NotFound from './NotFound';

const GoalDetailPage = () => {
  const { goalId } = useParams<{ goalId: string }>();
  
  const initialGoal = dummyGoals.find(g => g.id === goalId);

  const [goal, setGoal] = useState<Goal | undefined>(initialGoal);

  const handleUpdateGoal = (updatedGoal: Goal) => {
    setGoal(updatedGoal);
    // In a real app, you would also send the update to your backend here.
  };

  if (!goal) {
    // You can render a proper 404 page here
    return <PortalLayout><NotFound /></PortalLayout>;
  }

  return (
    <PortalLayout>
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

      <div className="mt-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-0">
             <GoalDetail 
                key={goal.id}
                goal={goal} 
                onUpdate={handleUpdateGoal}
              />
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default GoalDetailPage;