import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import NewGoalDialog from "@/components/goals/NewGoalDialog";
import GoalCard from "@/components/goals/GoalCard";
import { useGoals } from "@/context/GoalsContext";

const GoalsPage = () => {
  const { goals, addGoal } = useGoals();
  const [isNewGoalDialogOpen, setIsNewGoalDialogOpen] = useState(false);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Goals</h1>
        <Button onClick={() => setIsNewGoalDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Goal
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <GoalCard goal={goal} key={goal.id} />
        ))}
      </div>
      <NewGoalDialog
        open={isNewGoalDialogOpen}
        onOpenChange={setIsNewGoalDialogOpen}
        onGoalCreate={addGoal}
      />
    </>
  );
};

export default GoalsPage;