import { useGoals } from '@/context/GoalsContext';
import GoalCard from '@/components/goals/GoalCard';
import GoalFormDialog from '@/components/goals/GoalFormDialog';

const GoalsPage = () => {
  const { goals, addGoal, updateGoal, deleteGoal } = useGoals();

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Goals</h1>
        <GoalFormDialog onSave={addGoal} />
      </div>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {goals.map(goal => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onUpdate={updateGoal}
            onDelete={() => deleteGoal(goal.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default GoalsPage;