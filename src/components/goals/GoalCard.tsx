import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Goal } from "@/data/goals";
import { getIcon } from "@/lib/getIcon";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import GoalDetailDialog from "./GoalDetailDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface GoalCardProps {
  goal: Goal;
}

const GoalCard = ({ goal }: GoalCardProps) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const Icon = getIcon(goal.icon);

  const progress = Math.floor(Math.random() * 101); // Placeholder

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-lg transition-shadow flex flex-col justify-between"
        onClick={() => setIsDetailOpen(true)}
        style={{ borderTop: `4px solid ${goal.color}` }}
      >
        <div>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${goal.color}20` }} // 20 for 12.5% opacity
              >
                <Icon className="h-6 w-6" style={{ color: goal.color }} />
              </div>
              <CardTitle className="text-lg font-semibold">{goal.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-2">
              {goal.frequency === 'Daily' ? 'Daily Goal' : `Weekly on ${goal.specificDays?.map(d => ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d]).join(', ')}`}
            </div>
            <div className="flex items-center gap-2">
              <Progress value={progress} className="h-2" />
              <span className="text-sm font-medium text-muted-foreground">{progress}%</span>
            </div>
          </CardContent>
        </div>
        <CardFooter>
          {goal.collaborators && goal.collaborators.length > 0 && (
            <div className="flex items-center">
              {goal.collaborators.map((user, index) => (
                <Avatar
                  key={user.id}
                  className={`h-8 w-8 border-2 border-background ${index > 0 ? '-ml-3' : ''}`}
                >
                  <AvatarFallback>{user.initials || user.name?.slice(0, 2) || '??'}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}
        </CardFooter>
      </Card>
      <GoalDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        goal={goal}
      />
    </>
  );
};

export default GoalCard;