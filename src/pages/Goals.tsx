import { useState, useMemo } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { Plus, LayoutGrid, Table as TableIcon, Loader2 } from 'lucide-react';
import { Goal } from '@/types';
import GoalFormDialog from '@/components/goals/GoalFormDialog';
import GoalCard from '@/components/goals/GoalCard';
import { useNavigate } from 'react-router-dom';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import GoalsTableView from '@/components/goals/GoalsTableView';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGoals } from '@/hooks/useGoals';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const GoalsPage = () => {
  const [isNewGoalDialogOpen, setIsNewGoalDialogOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    const savedView = localStorage.getItem('goals_view_mode') as 'card' | 'table';
    return savedView || 'card';
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof Goal | null; direction: 'ascending' | 'descending' }>({ key: 'title', direction: 'ascending' });

  const { data: goals = [], isLoading, error } = useGoals();

  const handleDeleteGoal = async (goalId: string) => {
    const { error } = await supabase.from('goals').delete().eq('id', goalId);
    if (error) {
      toast.error("Failed to delete goal.");
    } else {
      toast.success("Goal deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  };

  const requestSort = (key: keyof Goal) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedGoals = useMemo(() => {
    let sortableItems = [...goals];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (String(aValue).toLowerCase() < String(bValue).toLowerCase()) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (String(aValue).toLowerCase() > String(bValue).toLowerCase()) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [goals, sortConfig]);

  const { specialGoals, otherGoals } = useMemo(() => {
    const specialTags = ['office', '7inked', 'betterworks.id'];
    const sGoals: Goal[] = [];
    const oGoals: Goal[] = [];

    if (sortedGoals) {
      sortedGoals.forEach(goal => {
        const hasSpecialTag = goal.tags && goal.tags.some(tag => specialTags.includes(tag.name.toLowerCase()));
        if (hasSpecialTag) {
          sGoals.push(goal);
        } else {
          oGoals.push(goal);
        }
      });
    }
    return { specialGoals: sGoals, otherGoals: oGoals };
  }, [sortedGoals]);

  const handleSuccess = (newGoal: Goal) => {
    setIsNewGoalDialogOpen(false);
    navigate(`/goals/${newGoal.slug}`);
  };

  const handleViewChange = (value: 'card' | 'table' | null) => {
    if (value) {
      setViewMode(value);
      localStorage.setItem('goals_view_mode', value);
    }
  };

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Goals</h1>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <ToggleGroup type="single" value={viewMode} onValueChange={handleViewChange}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="card" aria-label="Card view">
                    <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent><p>Card View</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="table" aria-label="Table view">
                    <TableIcon className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent><p>Table View</p></TooltipContent>
              </Tooltip>
            </ToggleGroup>
          </TooltipProvider>
          <Button onClick={() => setIsNewGoalDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Goal
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">
          <p>Error loading goals: {error.message}</p>
        </div>
      ) : viewMode === 'card' ? (
        <>
          {specialGoals.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Team Goals</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {specialGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </div>
          )}
          {otherGoals.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Personal Goals</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </div>
          )}
          {goals.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>You haven't created any goals yet.</p>
              <p>Click "New Goal" to get started!</p>
            </div>
          )}
        </>
      ) : (
        <GoalsTableView goals={sortedGoals} sortConfig={sortConfig} requestSort={requestSort} onDeleteGoal={handleDeleteGoal} />
      )}

      <GoalFormDialog
        open={isNewGoalDialogOpen}
        onOpenChange={setIsNewGoalDialogOpen}
        onSuccess={handleSuccess}
      />
    </PortalLayout>
  );
};

export default GoalsPage;