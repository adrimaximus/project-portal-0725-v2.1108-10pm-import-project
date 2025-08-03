import { Goal } from '@/data/goals';
import { getIconComponent } from '@/data/icons';
import { cn } from '@/lib/utils';

interface GoalIconProps {
  goal: Goal;
  className?: string;
}

const GoalIcon = ({ goal, className }: GoalIconProps) => {
  const IconComponent = getIconComponent(goal.icon);
  return (
    <div
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-lg',
        className
      )}
      style={{ backgroundColor: `${goal.color}20` }} // 20 for alpha
    >
      <IconComponent
        className="h-6 w-6"
        style={{ color: goal.color }}
      />
    </div>
  );
};

export default GoalIcon;