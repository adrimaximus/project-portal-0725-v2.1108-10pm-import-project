import { Goal } from '@/data/goals';
import GoalIcon from './GoalIcon';

interface GoalHeaderProps {
  goal: Goal;
}

const GoalHeader = ({ goal }: GoalHeaderProps) => {
  return (
    <div className="flex items-start gap-4">
      <GoalIcon goal={goal} className="h-16 w-16" />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{goal.title}</h1>
        <p className="text-muted-foreground mt-1">{goal.description}</p>
      </div>
    </div>
  );
};

export default GoalHeader;