import { useState } from 'react';
import { initialGoals, Goal } from '@/data/goals';
import GoalCard from '@/components/goals/GoalCard';
import { Link } from 'react-router-dom';

const GoalsPage = () => {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">All Goals</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {goals.map(goal => (
          <Link to={`/goal/${goal.id}`} key={goal.id}>
            <GoalCard goal={goal} />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default GoalsPage;