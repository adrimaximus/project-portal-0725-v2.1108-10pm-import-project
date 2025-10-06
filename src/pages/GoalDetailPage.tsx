import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PortalLayout from '@/components/PortalLayout';
import { Goal, User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Edit, Share2, Trash2 } from 'lucide-react';
import GoalIcon from '@/components/goals/GoalIcon';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import GoalYearlyProgress from '@/components/goals/GoalYearlyProgress';
import GoalQuantityTracker from '@/components/goals/GoalQuantityTracker';
import GoalValueTracker from '@/components/goals/GoalValueTracker';
import GoalProgressChart from '@/components/goals/GoalProgressChart';
import GoalLogTable from '@/components/goals/GoalLogTable';
import GoalCollaborationManager from '@/components/goals/GoalCollaborationManager';
import GoalFormDialog from '@/components/goals/GoalFormDialog';
import { useState } from 'react';
import AiCoachInsight from '@/components/goals/AiCoachInsight';

const formatNumber = (num: number) => new Intl.NumberFormat().format(num);
const formatValue = (num: number, unit?: string) => unit ? `${unit}${formatNumber(num)}` : formatNumber(num);

const GoalDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: goal, isLoading, error } = useQuery({
    queryKey: ['goal', slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_goal_by_slug', { p_slug: slug });
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Goal not found');
      return data[0] as Goal;
    },
    enabled: !!slug,
  });

  const handleToggleCompletion = async (date: Date) => {
    if (!goal || goal.type !== 'habit' || !currentUser) return;
    const dateString = format(date, 'yyyy-MM-dd');
    const existingCompletion = goal.completions.find(c => format(parseISO(c.date), 'yyyy-MM-dd') === dateString);

    if (existingCompletion) {
      const { error } = await supabase.from('goal_completions').delete().eq('id', existingCompletion.id);
      if (error) toast.error(error.message);
      else toast.success('Progress undone.');
    } else {
      const { error } = await supabase.from('goal_completions').insert({
        goal_id: goal.id,
        user_id: currentUser.id,
        date: date.toISOString(),
        value: 1,
      });
      if (error) toast.error(error.message);
      else toast.success('Progress logged!');
    }
    queryClient.invalidateQueries({ queryKey: ['goal', slug] });
  };

  const handleLogQuantity = async (date: Date, value: number) => {
    if (!goal || goal.type !== 'target' || !currentUser) return;
    const { error } = await supabase.from('goal_completions').insert({
      goal_id: goal.id,
      user_id: currentUser.id,
      date: date.toISOString(),
      value: value,
    });
    if (error) toast.error(error.message);
    else toast.success('Progress logged!');
    queryClient.invalidateQueries({ queryKey: ['goal', slug] });
  };

  const handleLogValue = async (date: Date, value: number) => {
    if (!goal || goal.type !== 'target' || !currentUser) return;
    const { error } = await supabase.from('goal_completions').insert({
      goal_id: goal.id,
      user_id: currentUser.id,
      date: date.toISOString(),
      value: value,
    });
    if (error) toast.error(error.message);
    else toast.success('Progress logged!');
    queryClient.invalidateQueries({ queryKey: ['goal', slug] });
  };

  const handleDeleteGoal = async () => {
    if (!goal) return;
    if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      const { error } = await supabase.from('goals').delete().eq('id', goal.id);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Goal deleted.');
        queryClient.invalidateQueries({ queryKey: ['goals', currentUser?.id] });
        navigate('/goals');
      }
    }
  };

  if (isLoading) return <PortalLayout><div className="p-6">Loading...</div></PortalLayout>;
  if (error) return <PortalLayout><div className="p-6 text-destructive">Error: {error.message}</div></PortalLayout>;
  if (!goal) return <PortalLayout><div className="p-6">Goal not found.</div></PortalLayout>;

  const getFrequencyText = () => {
    if (goal.type === 'target' && goal.target_quantity) {
      return `${formatNumber(goal.target_quantity!)} per ${goal.target_period}`;
    }
    if (goal.type === 'target' && goal.target_value) {
      return `Target: ${formatValue(goal.target_value!, goal.unit)}`;
    }
    if (goal.type === 'habit') {
      if (goal.frequency === 'Specific days') return goal.specific_days?.join(', ');
      if (goal.frequency === 'X times per week') return `${goal.target_quantity} times per week`;
      return goal.frequency;
    }
    return 'Not set';
  };

  return (
    <PortalLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={() => navigate('/goals')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon"><Share2 className="h-4 w-4" /></Button>
            <Button variant="outline" onClick={() => setIsFormOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
            <Button variant="destructive-outline" onClick={handleDeleteGoal}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <GoalIcon goal={goal} className="h-16 w-16 text-5xl" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{goal.title}</h1>
            <p className="text-muted-foreground">{goal.description}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge style={{ backgroundColor: goal.color, color: 'white' }}>{getFrequencyText()}</Badge>
              {goal.tags.map(tag => <Badge key={tag.id} variant="secondary">{tag.name}</Badge>)}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {goal.type === 'habit' && (
              <GoalYearlyProgress goal={goal} onToggleDay={handleToggleCompletion} />
            )}
            {(goal.type === 'target') && (
              <div className="space-y-6">
                {goal.target_quantity && <GoalQuantityTracker goal={goal} onLog={handleLogQuantity} />}
                {goal.target_value && <GoalValueTracker goal={goal} onLog={handleLogValue} />}
                <GoalProgressChart goal={goal} />
              </div>
            )}
            <GoalLogTable goal={goal} />
          </div>
          <div className="space-y-6">
            <AiCoachInsight goal={goal} />
            <GoalCollaborationManager goal={goal} />
          </div>
        </div>
      </div>
      <GoalFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} goal={goal} />
    </PortalLayout>
  );
};

export default GoalDetailPage;