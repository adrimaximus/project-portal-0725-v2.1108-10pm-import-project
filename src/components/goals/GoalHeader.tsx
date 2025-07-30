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
    setIsSheetOpen(false);
  };

  const getIconBackgroundColor = () => {
    const color = goal.color;
    if (color.startsWith('#')) {
      let fullHex = color;
      if (color.length === 4) {
        fullHex = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
      }
      if (fullHex.length === 7) {
        return `${fullHex}33`;
      }
    }
    return 'rgba(128, 128, 128, 0.2)';
  };

  return (
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl" style={{ backgroundColor: getIconBackgroundColor() }}>
          <goal.icon className="h-8 w-8" style={{ color: goal.color }} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{goal.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{goal.frequency}</p>
        </div>
      </div>
      
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline">
            <FilePenLine className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Goal</SheetTitle>
          </SheetHeader>
          <GoalDetail goal={goal} onUpdate={handleUpdate} onClose={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default GoalHeader;