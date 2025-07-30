import { useState } from 'react';
import { Goal } from '@/data/goals';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import GoalDetail from './GoalDetail';
import { FilePenLine } from 'lucide-react';

interface GoalHeaderProps {
  goal: Goal;
  onUpdate: (goal: Goal) => void;
}

const GoalHeader = ({ goal, onUpdate }: GoalHeaderProps) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleUpdate = (updatedGoal: Goal) => {
    onUpdate(updatedGoal);
    setIsSheetOpen(false); // Close sheet after saving
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg" style={{ backgroundColor: `${goal.color}20` }}>
          <goal.icon className="h-8 w-8" style={{ color: goal.color }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{goal.title}</h1>
          <p className="text-muted-foreground">Track your progress and stay consistent.</p>
        </div>
      </div>
      
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline">
            <FilePenLine className="mr-2 h-4 w-4" />
            Edit Goal
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Goal</SheetTitle>
          </SheetHeader>
          <GoalDetail 
            goal={goal} 
            onUpdate={handleUpdate} 
            onClose={() => setIsSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default GoalHeader;