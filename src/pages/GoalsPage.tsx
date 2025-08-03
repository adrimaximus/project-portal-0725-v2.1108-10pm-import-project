import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useGoals } from "@/context/GoalsContext";
import GoalCard from "@/components/goals/GoalCard";
import { Link } from "react-router-dom";

const GoalsPage = () => {
  const { goals } = useGoals();

  return (
    <PortalLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground">Track your team's objectives and key results.</p>
        </div>
        <Button asChild>
          <Link to="/goals/new">
            <Plus className="mr-2 h-4 w-4" />
            New Goal
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map(goal => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </PortalLayout>
  );
};

export default GoalsPage;