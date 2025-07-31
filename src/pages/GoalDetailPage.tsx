import { useParams, useNavigate } from 'react-router-dom';
import { useGoals } from '@/context/GoalsContext';
import PortalLayout from '@/components/PortalLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoalDetail from '@/components/goals/GoalDetail';
import GoalCollaborationManager from '@/components/goals/GoalCollaborationManager';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Goal } from '@/data/goals';

const GoalDetailPage = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const { goals, updateGoal } = useGoals();
  const navigate = useNavigate();

  const goal = goals.find(g => g.id === goalId);

  if (!goal) {
    return (
      <PortalLayout>
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold mb-4">Goal Not Found</h2>
          <p className="text-muted-foreground mb-6">The goal you are looking for does not exist or has been deleted.</p>
          <Button onClick={() => navigate('/goals')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Goals
          </Button>
        </div>
      </PortalLayout>
    );
  }

  const handleUpdate = (updatedGoal: Goal) => {
    updateGoal(updatedGoal);
  };

  const handleClose = () => {
    navigate('/goals');
  };

  return (
    <PortalLayout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={handleClose} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
            <h1 className="text-3xl font-bold">{goal.title}</h1>
            <p className="text-muted-foreground">Manage your goal details and collaborators.</p>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full max-w-3xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-4">
            <GoalDetail goal={goal} onUpdate={handleUpdate} onClose={handleClose} />
        </TabsContent>
        <TabsContent value="collaborators" className="mt-4">
            <GoalCollaborationManager goal={goal} onUpdate={handleUpdate} onClose={handleClose} />
        </TabsContent>
      </Tabs>
    </PortalLayout>
  );
};

export default GoalDetailPage;