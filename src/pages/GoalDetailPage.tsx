import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { dummyGoals, Goal, GoalCompletion } from '@/data/goals';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import GoalYearlyProgress from '@/components/goals/GoalYearlyProgress';
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
import { isBefore, startOfDay, parseISO, format } from 'date-fns';

const GoalDetailPage = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const goalData = dummyGoals.find(g => g.id === goalId);
    if (goalData) {
      // Simulate generating completions if they don't exist
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
          completed: Math.random() > 0.4, // Randomly mark as completed for demo
        });
      }
    }
    return completions;
  };

  const handleToggleCompletion = (date: Date) => {
    if (!goal) return;

    const dateString = format(date, 'yyyy-MM-dd');
    const existingCompletionIndex = goal.completions.findIndex(c => c.date === dateString);

    const updatedGoal = { ...goal };

    if (existingCompletionIndex > -1) {
      const existing = updatedGoal.completions[existingCompletionIndex];
      updatedGoal.completions[existingCompletionIndex] = { ...existing, completed: !existing.completed };
    } else {
      // This case handles adding a new completion for a day that wasn't pre-generated
      updatedGoal.completions.push({ date: dateString, completed: true });
    }

    // Sort completions by date descending
    updatedGoal.completions.sort((a, b) => b.date.localeCompare(a.date));

    setGoal(updatedGoal);
    toast.success(`Progress for ${format(date, 'PPP')} has been updated.`);
  };

  const handleDeleteGoal = () => {
    if (!goal) return;
    // In a real app, you would make an API call here.
    // For now, we'll just navigate away and show a toast.
    toast.success(`Goal "${goal.title}" has been deleted.`);
    navigate('/goals');
  };

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="text-center">Loading goal details...</div>
      </PortalLayout>
    );
  }

  if (!goal) {
    return (
      <PortalLayout>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Goal Not Found</h2>
          <p className="text-muted-foreground mb-4">The goal you are looking for does not exist.</p>
          <Button asChild>
            <Link to="/goals">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Goals
            </Link>
          </Button>
        </div>
      </PortalLayout>
    );
  }

  const getFrequencyText = () => {
    if (goal.frequency === 'Daily') {
      return 'Daily';
    }
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
            <Link to="/goals">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Goals
            </Link>
          </Button>

          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: `${goal.color}30`, color: goal.color }}>
                {goal.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{goal.title}</h1>
                <p className="text-muted-foreground">{goal.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link to={`/goals/edit/${goal.id}`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your goal and all of its progress data.
                    </AlertDialogDescription>
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
              <Badge key={tag} variant="outline">{tag}</Badge>
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
          goalTags={goal.tags}
        />
      </div>
    </PortalLayout>
  );
};

export default GoalDetailPage;