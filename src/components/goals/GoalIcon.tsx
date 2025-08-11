import { Goal } from '@/types';
import { getIconComponent } from '@/data/icons';

interface GoalIconProps {
  goal: Goal;
  className?: string;
}

export default function GoalIcon({ goal, className }: GoalIconProps) {
  const IconComponent = getIconComponent(goal.icon);
  return <IconComponent className={className} style={{ color: goal.color }} />;
}