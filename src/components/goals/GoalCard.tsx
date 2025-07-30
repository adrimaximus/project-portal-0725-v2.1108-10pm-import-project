import { Goal } from '@/data/goals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import GoalProgressGrid from '@/components/goals/GoalProgressGrid';

interface GoalCardProps {
  goal: Goal;
  isSelected: boolean;
  onClick: () => void;
}

const GoalCard = ({ goal, isSelected, onClick }: GoalCardProps) => {
  const { title, icon: Icon, frequency, color, completions } = goal;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all",
        isSelected ? "ring-2 ring-primary" : "hover:bg-muted/50"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{frequency}</p>
      </CardHeader>
      <CardContent>
        <GoalProgressGrid completions={completions} color={color} />
      </CardContent>
    </Card>
  );
};

export default GoalCard;