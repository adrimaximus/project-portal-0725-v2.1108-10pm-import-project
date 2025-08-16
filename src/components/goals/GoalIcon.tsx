import { Goal } from '@/types';
import { getIconComponent } from '@/data/icons';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

interface GoalIconProps {
  goal: Goal;
  className?: string;
}

const GoalIcon = ({ goal, className }: GoalIconProps) => {
  // Jika iconUrl ada dari ikon yang dibuat sebelumnya, tampilkan itu.
  // Jika tidak, kembali ke ikon dari pustaka.
  if (goal.icon_url) {
    return (
      <div className={cn("relative", className)}>
        <div 
          className="w-full h-full rounded-lg flex items-center justify-center text-2xl overflow-hidden" 
          style={{ backgroundColor: `${goal.color}30` }}
        >
          <img src={goal.icon_url} alt={goal.title} className="w-[85%] h-[85%] object-cover rounded-md" />
        </div>
      </div>
    );
  }

  const IconComponent = getIconComponent(goal.icon) || ImageIcon;

  return (
    <div className={cn("relative", className)}>
      <div 
        className="w-full h-full rounded-lg flex items-center justify-center text-2xl overflow-hidden" 
        style={{ backgroundColor: `${goal.color}30`, color: goal.color }}
      >
        <IconComponent className="h-[85%] w-[85%]" />
      </div>
    </div>
  );
};

export default GoalIcon;