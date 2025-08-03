import { useState } from "react";
import { Goal, GoalCompletion } from "@/data/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/contexts/UserContext";
import { getProgress } from "@/lib/progress";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

interface GoalValueTrackerProps {
  goal: Goal;
  onAddCompletion: (value: number, notes?: string) => void;
}

export function GoalValueTracker({ goal, onAddCompletion }: GoalValueTrackerProps) {
  const [value, setValue] = useState<number | string>("");
  const { user } = useUser();

  const getPeriodDateRange = () => {
    const now = new Date();
    switch (goal.targetPeriod) {
      case 'Daily': return { start: now, end: now };
      case 'Weekly': return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'Monthly': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'Yearly': return { start: startOfYear(now), end: endOfYear(now) };
      default: return { start: now, end: now };
    }
  };

  const { start, end } = getPeriodDateRange();
  const completionsInPeriod = goal.completions.filter(c => {
    const cDate = new Date(c.date);
    return cDate >= start && cDate <= end;
  });

  const currentTotal = completionsInPeriod.reduce((sum, c) => sum + (c.value || 0), 0);
  const progress = getProgress(goal, currentTotal);
  const isOwnCompletion = (c: GoalCompletion) => !c.collaboratorId || c.collaboratorId === user.id;
  const userCompletionsInPeriod = completionsInPeriod.filter(isOwnCompletion);

  const handleAdd = () => {
    const numValue = Number(value);
    if (numValue > 0) {
      onAddCompletion(numValue);
      setValue("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Value for {format(new Date(), "MMMM do")}</CardTitle>
        <CardDescription>
          Current total this {goal.targetPeriod.toLowerCase().slice(0, -2)}: {currentTotal.toLocaleString()} {goal.unit || ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={`Enter value in ${goal.unit || ''}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd}>Add</Button>
        </div>
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">
              Period Progress ({currentTotal.toLocaleString()} / {goal.targetValue?.toLocaleString()} {goal.unit || ''})
            </span>
            <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="w-full" style={{'--progress-color': goal.color} as React.CSSProperties} />
        </div>
        <div className="mt-4">
          <h4 className="font-semibold">Your contributions this period:</h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            {userCompletionsInPeriod.map(c => (
              <li key={c.id}>
                {c.value?.toLocaleString()} {goal.unit || ''} on {format(new Date(c.date), 'MMM d')}
              </li>
            ))}
             {userCompletionsInPeriod.length === 0 && <li>No contributions yet.</li>}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}