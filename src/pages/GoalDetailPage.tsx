import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { dummyGoals, Goal } from '@/data/goals';
import GoalDetail from '@/components/goals/GoalDetail';
import GoalYearlyProgress from '@/components/goals/GoalYearlyProgress';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import NotFound from './NotFound';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pencil } from 'lucide-react';

const GoalDetailPage = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const initialGoal = dummyGoals.find(g => g.id === goalId);

  const [goal, setGoal] = useState<Goal | undefined>(initialGoal);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleUpdateGoal = (updatedGoal: Goal) => {
    setGoal(updatedGoal);
    setIsEditModalOpen(false);
    // In a real app, you would also send the update to your backend here.
  };

  if (!goal) {
    return <PortalLayout><NotFound /></PortalLayout>;
  }

  const Icon = goal.icon;

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

      <div className="mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${goal.color}20` }}>
              <Icon className="h-8 w-8" style={{ color: goal.color }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{goal.title}</h1>
              <p className="text-muted-foreground">{goal.frequency}</p>
            </div>
          </div>
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Goal</DialogTitle>
              </DialogHeader>
              <GoalDetail 
                goal={goal} 
                onUpdate={handleUpdateGoal}
                onClose={() => setIsEditModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        <GoalYearlyProgress completions={goal.completions} color={goal.color} />
      </div>
    </PortalLayout>
  );
};

export default GoalDetailPage;