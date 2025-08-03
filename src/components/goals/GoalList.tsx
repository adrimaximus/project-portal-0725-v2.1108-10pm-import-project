import { Goal } from '@/data/goals';
import GoalCard from './GoalCard';

interface GoalListProps {
  goals: Goal[];
}

const GoalList = ({ goals }: GoalListProps) => {
  if (goals.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>No goals to display in this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {goals.map(goal => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
    </div>
  );
};

export default GoalList;