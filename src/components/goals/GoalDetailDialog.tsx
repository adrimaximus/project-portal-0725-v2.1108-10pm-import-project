import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Goal } from '@/data/goals';
import { useGoals } from '@/context/GoalsContext';
import GoalDetail from './GoalDetail';
import GoalCollaborationManager from './GoalCollaborationManager';

interface GoalDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal;
}

const GoalDetailDialog = ({ open, onOpenChange, goal }: GoalDetailDialogProps) => {
  const { updateGoal } = useGoals();

  const handleUpdate = (updatedGoal: Goal) => {
    updateGoal(updatedGoal);
    onOpenChange(false); // Close dialog on save
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{goal.title}</DialogTitle>
          <DialogDescription>
            Manage your goal details and collaborators.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <GoalDetail goal={goal} onUpdate={handleUpdate} onClose={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="collaborators">
            <GoalCollaborationManager goal={goal} onUpdate={handleUpdate} onClose={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default GoalDetailDialog;