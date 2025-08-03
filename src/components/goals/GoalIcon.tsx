import { Goal } from '@/data/goals';
import { getIconComponent } from '@/data/icons';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

interface GoalIconProps {
  goal: Goal;
  className?: string;
}

const GoalIcon = ({ goal, className }: GoalIconProps) => {
  if (goal.iconUrl) {
    return (
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-lg overflow-hidden',
          className
        )}
        style={{ backgroundColor: `${goal.color}20` }}
      >
        <img src={goal.iconUrl} alt={goal.title} className="h-full w-full object-cover" />
      </div>
    );
  }

  const IconComponent = getIconComponent(goal.icon) || ImageIcon;
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