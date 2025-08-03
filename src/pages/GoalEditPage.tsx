import { useParams, useNavigate } from 'react-router-dom';
import { useGoals } from '@/context/GoalsContext';
import PortalLayout from '@/components/PortalLayout';
import { GoalForm } from '@/components/goals/GoalForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

const GoalEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { goals, updateGoal, addGoal } = useGoals();

  const isNew = id === 'new';
  const goal = isNew ? undefined : goals.find(g => g.id === id);

  if (!isNew && !goal) {
    return <PortalLayout><div>Goal not found</div></PortalLayout>;
  }

  const handleSubmit = (values: any) => {
    if (isNew) {
      addGoal(values);
      toast.success('Goal created successfully!');
    } else {
      updateGoal({ ...goal, ...values, id: goal!.id });
      toast.success('Goal updated successfully!');
    }
    navigate('/goals');
  };

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{isNew ? 'Create New Goal' : 'Edit Goal'}</CardTitle>
            <CardDescription>
              {isNew ? 'Define a new objective for your team.' : 'Update the details for this objective.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GoalForm
              goal={goal}
              onSubmit={handleSubmit}
              onCancel={() => navigate(isNew ? '/goals' : `/goals/${id}`)}
            />
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default GoalEditPage;