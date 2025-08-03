import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { dummyGoals, Goal, GoalCompletion } from '@/data/goals';
import { User, dummyUsers } from '@/data/users';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import GoalYearlyProgress from '@/components/goals/GoalYearlyProgress';
import GoalCollaborationManager from '@/components/goals/GoalCollaborationManager';
import GoalIcon from '@/components/goals/GoalIcon';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { isBefore, startOfDay, format } from 'date-fns';
import GoalFormDialog from '@/components/goals/GoalFormDialog';
import GoalQuantityTracker from '@/components/goals/GoalQuantityTracker';
import GoalValueTracker from '@/components/goals/GoalValueTracker';
import { formatNumber, formatValue } from '@/lib/formatting';
import GoalProgressChart from '@/components/goals/GoalProgressChart';

const GoalDetailPage = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    const goalData = dummyGoals.find(g => g.id === goalId);
    if (goalData) {
      if (goalData.type === 'frequency' && (!goalData.completions || goalData.completions.length === 0)) {
        goalData.completions = generateInitialCompletions(goalData);
      }
      setGoal(goalData);
    }
    setIsLoading(false);
  }, [goalId]);

  const generateInitialCompletions = (g: Goal): GoalCompletion[] => {
    const completions: GoalCompletion[] = [];
    const today = startOfDay(new Date());
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const dayKeys = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    for (let d = yearStart; isBefore(d, today); d.setDate(d.getDate() + 1)) {
      const dayOfWeek = dayKeys[d.getDay()];
      const isScheduled = g.frequency === 'Daily' || (g.frequency === 'Weekly' && g.specificDays.includes(dayOfWeek));
      
      if (isScheduled) {
        completions.push({
          id: `comp-${d.getTime()}`,
          date: format(d, 'yyyy-MM-dd'),
          value: Math.random() > 0.4 ? 1 : 0,
          userId: dummyUsers[0].id,
        });
      }
    }
    return completions;
  };

  const handleToggleCompletion = (date: Date) => {
    if (!goal || goal.type !== 'frequency') return;
    const dateString = format(date, 'yyyy-MM-dd');
    const updatedGoal = { ...goal };
    const existingCompletionIndex = updatedGoal.completions.findIndex(c => c.date === dateString);

    if (existingCompletionIndex > -1) {
      const existing = updatedGoal.completions[existingCompletionIndex];
      updatedGoal.completions[existingCompletionIndex] = { ...existing, value: existing.value === 1 ? 0 : 1 };
    } else {
      updatedGoal.completions.push({ id: `comp-${date.getTime()}`, date: dateString, value: 1, userId: dummyUsers[0].id });
    }
    updatedGoal.completions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setGoal(updatedGoal);
    toast.success(`Progress for ${format(date, 'PPP')} has been updated.`);
  };

  const handleLogQuantity = (date: Date, value: number) => {
    if (!goal || goal.type !== 'quantity') return;
    const newLog: GoalCompletion = {
      id: `comp-${date.getTime()}`,
      date: new Date().toISOString(),
      value,
      userId: dummyUsers[0].id, // Assume current user is Alex
    };
    const updatedGoal = { ...goal, completions: [...goal.completions, newLog] };
    setGoal(updatedGoal);
  };

  const handleLogValue = (date: Date, value: number) => {
    if (!goal || goal.type !== 'value') return;
    const newLog: GoalCompletion = {
      id: `comp-${date.getTime()}`,
      date: new Date().toISOString(),
      value,
      userId: dummyUsers[0].id, // Assume current user is Alex
    };
    const updatedGoal = { ...goal, completions: [...goal.completions, newLog] };
    setGoal(updatedGoal);
  };

  const handleDeleteGoal = () => {
    if (!goal) return;
    toast.success(`Goal "${goal.title}" has been deleted.`);
    navigate('/goals');
  };

  const handleCollaboratorsUpdate = (updatedCollaborators: User[]) => {
    if (goal) {
      const updatedGoal = { ...goal, collaborators: updatedCollaborators };
      setGoal(updatedGoal);
    }
  };

  const handleIconUpdate = (newIconUrl: string) => {
    if (goal) {
      const updatedGoal = { ...goal, iconUrl: newIconUrl, icon: 'ImageIcon' };
      setGoal(updatedGoal);
      const goalIndex = dummyGoals.findIndex(g => g.id === goal.id);
      if (goalIndex > -1) {
        dummyGoals[goalIndex].iconUrl = newIconUrl;
        dummyGoals[goalIndex].icon = 'ImageIcon';
      }
    }
  };

  const handleGoalUpdate = (updatedGoal: Goal) => {
    const goalIndex = dummyGoals.findIndex(g => g.id === updatedGoal.id);
    if (goalIndex > -1) {
      dummyGoals[goalIndex] = updatedGoal;
    }
    setGoal(updatedGoal);
    setIsEditDialogOpen(false);
  };

  if (isLoading) {
    return <PortalLayout><div className="text-center">Loading goal details...</div></PortalLayout>;
  }

  if (!goal) {
    return (
      <PortalLayout>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Goal Not Found</h2>
          <Button asChild><Link to="/goals"><ArrowLeft className="mr-2 h-4 w-4" />Back to Goals</Link></Button>
        </div>
      </PortalLayout>
    );
  }

  const getFrequencyText = () => {
    if (goal.type === 'quantity') {
      return `${formatNumber(goal.targetQuantity!)} per ${goal.targetPeriod}`;
    }
    if (goal.type === 'value') {
      return `Target: ${formatValue(goal.targetValue!, goal.unit)}`;
    }
    if (goal.frequency === 'Daily') return 'Daily';
    if (goal.frequency === 'Weekly' && goal.specificDays.length > 0) {
      if (goal.specificDays.length === 7) return 'Daily';
      if (goal.specificDays.length === 2 && goal.specificDays.includes('Sa') && goal.specificDays.includes('Su')) return 'Weekends';
      if (goal.specificDays.length === 5 && !goal.specificDays.includes('Sa') && !goal.specificDays.includes('Su')) return 'Weekdays';
      return `Weekly on ${goal.specificDays.join(', ')}`;
    }
    return 'Weekly';
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/goals"><ArrowLeft className="mr-2 h-4 w-4" />Back to All Goals</Link>
          </Button>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <GoalIcon goal={goal} onIconUpdate={handleIconUpdate} className="h-16 w-16" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{goal.title}</h1>
                <p className="text-muted-foreground">{goal.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteGoal}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{getFrequencyText()}</Badge>
            {goal.tags.map(tag => (
              <Badge key={tag.id} variant="outline" style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}>
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>

        {goal.type === 'frequency' && (
          <GoalYearlyProgress
            goal={goal}
            onToggleCompletion={handleToggleCompletion}
          />
        )}

        {(goal.type === 'quantity' || goal.type === 'value') && (
          <div className="space-y-6">
            <GoalProgressChart goal={goal} />
            {goal.type === 'quantity' ? (
              <GoalQuantityTracker goal={goal} onLogProgress={handleLogQuantity} />
            ) : (
              <GoalValueTracker goal={goal} onLogValue={handleLogValue} />
            )}
          </div>
        )}

        <GoalCollaborationManager goal={goal} onCollaboratorsUpdate={handleCollaboratorsUpdate} />
      </div>
      
      <GoalFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onGoalUpdate={handleGoalUpdate}
        goal={goal}
      />
    </PortalLayout>
  );
};

export default GoalDetailPage;