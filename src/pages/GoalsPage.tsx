import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useState, useMemo } from "react";
import NewGoalDialog from "@/components/goals/NewGoalDialog";
import GoalCard from "@/components/goals/GoalCard";
import { useGoals } from "@/context/GoalsContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const GoalsPage = () => {
  const { goals, addGoal } = useGoals();
  const [isNewGoalDialogOpen, setIsNewGoalDialogOpen] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    goals.forEach(goal => {
      if (goal.tags) {
        goal.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  }, [goals]);

  const filteredGoals = useMemo(() => {
    if (!activeTag) {
      return goals;
    }
    return goals.filter(goal => goal.tags?.includes(activeTag));
  }, [goals, activeTag]);

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Goals</h1>
        <Button onClick={() => setIsNewGoalDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Goal
        </Button>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge
            onClick={() => setActiveTag(null)}
            className={cn(
              "cursor-pointer transition-colors",
              !activeTag ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-secondary"
            )}
            variant={!activeTag ? "default" : "secondary"}
          >
            All
          </Badge>
          {allTags.map(tag => (
            <Badge
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={cn(
                "cursor-pointer transition-colors",
                activeTag === tag ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-secondary"
              )}
              variant={activeTag === tag ? "default" : "secondary"}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredGoals.map((goal) => (
          <GoalCard goal={goal} key={goal.id} />
        ))}
      </div>
      {filteredGoals.length === 0 && (
         <div className="text-center text-muted-foreground py-10 col-span-full">
          <p>No goals found.</p>
          {activeTag && <p>Try selecting a different tag or clearing the filter.</p>}
        </div>
      )}
      <NewGoalDialog
        open={isNewGoalDialogOpen}
        onOpenChange={setIsNewGoalDialogOpen}
        onGoalCreate={addGoal}
      />
    </PortalLayout>
  );
};

export default GoalsPage;