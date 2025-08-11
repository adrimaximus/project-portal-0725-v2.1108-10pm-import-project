import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Goal, GoalCompletion, User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import GoalIcon from '@/components/goals/GoalIcon';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { calculateProgress } from '@/lib/progress';
import GoalQuantityTracker from '@/components/goals/GoalQuantityTracker';
import GoalValueTracker from '@/components/goals/GoalValueTracker';
import AiCoachInsight from '@/components/goals/AiCoachInsight';
import GoalCollaborationManager from '@/components/goals/GoalCollaborationManager';
import GoalProgressChart from '@/components/goals/GoalProgressChart';
import GoalLogTable from '@/components/goals/GoalLogTable';
import GoalYearlyProgress from '@/components/goals/GoalYearlyProgress';
import GoalFormDialog from '@/components/goals/GoalFormDialog';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

export default function GoalDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchGoal = async () => {
      if (!user || !slug) return;
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_user_goals')
        .eq('slug', slug)
        .single();

      if (error) {
        toast.error("Failed to fetch goal details.");
        console.error(error);
      } else {
        setGoal(data as Goal);
      }
      setLoading(false);
    };
    fetchGoal();
  }, [slug, user]);

  const handleCompletionLogged = (completion: GoalCompletion) => {
    setGoal(prev => prev ? { ...prev, completions: [...prev.completions, completion] } : null);
  };

  const handleCollaboratorsUpdate = (updatedCollaborators: User[]) => {
    setGoal(prev => prev ? { ...prev, collaborators: updatedCollaborators } : null);
  };
  
  const handleCompletionDeleted = (completionId: string) => {
    setGoal(prev => prev ? { ...prev, completions: prev.completions.filter(c => c.id !== completionId) } : null);
  };

  const handleGoalSaved = (savedGoal: Goal) => {
    setGoal(savedGoal);
  };

  if (loading) return <PortalLayout><p>Loading...</p></PortalLayout>;
  if (!goal) return <PortalLayout><p>Goal not found.</p></PortalLayout>;

  const { percentage, currentValue } = calculateProgress(goal);

  return (
    <PortalLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <GoalIcon goal={goal} className="w-12 h-12" />
              <h1 className="text-4xl font-bold">{goal.title}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {goal.tags.map(tag => (
                <Badge key={tag.id} style={{ backgroundColor: tag.color, color: 'white' }}>
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit Goal
          </Button>
        </div>

        <p className="text-lg text-muted-foreground">{goal.description}</p>

        <div>
          <div className="flex justify-between text-lg mb-1">
            <span className="font-semibold">Overall Progress</span>
            <span>
              {goal.type === 'quantity'
                ? `${currentValue} / ${goal.target_quantity}`
                : `$${currentValue.toFixed(2)} / $${goal.target_value?.toFixed(2)}`}
            </span>
          </div>
          <Progress value={percentage} className="h-4" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <GoalProgressChart goal={goal} />
            <GoalLogTable goal={goal} onCompletionDeleted={handleCompletionDeleted} />
          </div>
          <div className="space-y-6">
            {goal.type === 'quantity' ? (
              <GoalQuantityTracker goal={goal} onCompletionLogged={handleCompletionLogged} />
            ) : (
              <GoalValueTracker goal={goal} onCompletionLogged={handleCompletionLogged} />
            )}
            <AiCoachInsight goal={goal} />
            <GoalCollaborationManager goal={goal} onCollaboratorsUpdate={handleCollaboratorsUpdate} />
          </div>
        </div>
      </div>
      <GoalFormDialog 
        open={isEditing}
        onOpenChange={setIsEditing}
        goalToEdit={goal}
        onGoalSaved={handleGoalSaved}
      />
    </PortalLayout>
  );
}