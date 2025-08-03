import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { dummyGoals, Goal, GoalCompletion } from '@/data/goals';
import { User } from '@/data/users';
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

const GoalDetailPage = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const goalData = dummyGoals.find(g => g.id === goalId);
    if (goalData) {
      if (!goalData.completions || goalData.completions.length === 0) {
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
          date: format(d, 'yyyy-MM-dd'),
          completed: Math.random() > 0.4,
        });
      }
    }
    return completions;
  };

  const handleToggleCompletion = (date: Date) => {
    if (!goal) return;
    const dateString = format(date, 'yyyy-MM-dd');
    const updatedGoal = { ...goal };
    const existingCompletionIndex = updatedGoal.completions.findIndex(c => c.date === dateString);

    if (existingCompletionIndex > -1) {
      const existing = updatedGoal.completions[existingCompletionIndex];
      updatedGoal.completions[existingCompletionIndex] = { ...existing, completed: !existing.completed };
    } else {
      updatedGoal.completions.push({ date: dateString, completed: true });
    }
    updatedGoal.completions.sort((a, b) => b.date.localeCompare(a.date));
    setGoal(updatedGoal);
    toast.success(`Progress for ${format(date, 'PPP')} has been updated.`);
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
      const updatedGoal = { ...goal, icon: newIconUrl };
      setGoal(updatedGoal);
      
      // In a real app, this would be an API call. For now, we update the dummy data
      // to make the change persist during the user's session.
      const goalIndex = dummyGoals.findIndex(g => g.id === goal.id);
      if (goalIndex > -1) {
        dummyGoals[goalIndex].icon = newIconUrl;
      }
    }
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
              <GoalIcon goal={goal} onIconUpdate={handleIconUpdate} />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{goal.title}</h1>
                <p className="text-muted-foreground">{goal.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link to={`/goals/edit/${goal.id}`}><Edit className="h-4 w-4" /></Link>
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

        <GoalYearlyProgress
          completions={goal.completions}
          color={goal.color}
          onToggleCompletion={handleToggleCompletion}
          frequency={goal.frequency}
          specificDays={goal.specificDays}
          goalTitle={goal.title}
          goalDescription={goal.description}
          goalTags={goal.tags.map(t => t.name)}
          collaborators={goal.collaborators}
        />

        <GoalCollaborationManager goal={goal} onCollaboratorsUpdate={handleCollaboratorsUpdate} />
      </div>
    </PortalLayout>
  );
};

export default GoalDetailPage;