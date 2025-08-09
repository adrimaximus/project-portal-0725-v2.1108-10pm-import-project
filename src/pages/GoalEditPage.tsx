import { useParams, useNavigate } from 'react-router-dom';
import { useGoals } from '@/context/GoalsContext';
import PortalLayout from '@/components/PortalLayout';
import { GoalForm, GoalFormValues } from '@/components/goals/GoalForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { User } from '@/types';
import { Goal } from '@/data/goals';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const GoalEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { goals, updateGoal, addGoal } = useGoals();
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (data) {
        const users = data.map(profile => ({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'No name',
          avatar: profile.avatar_url,
          email: profile.email,
          initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'NN',
          first_name: profile.first_name,
          last_name: profile.last_name,
        }));
        setAllUsers(users);
      }
    };
    fetchUsers();
  }, []);

  const isNew = id === 'new';
  const goal = isNew ? undefined : goals.find(g => g.id === id);

  if (!isNew && !goal) {
    return <PortalLayout><div>Goal not found</div></PortalLayout>;
  }

  const handleSubmit = (values: GoalFormValues) => {
    const { collaborators: collaboratorIds, ...rest } = values;
    const collaborators = collaboratorIds
      .map(id => allUsers.find(u => u.id === id))
      .filter((u): u is User => !!u);
    
    const submissionData = { 
      ...rest, 
      collaborators,
      tags: [], // Placeholder
      specificDays: [], // Placeholder
    };

    if (isNew) {
      addGoal(submissionData as Omit<Goal, 'id' | 'completions'>);
      toast.success('Goal created successfully!');
    } else {
      updateGoal({ ...goal, ...submissionData, id: goal!.id });
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