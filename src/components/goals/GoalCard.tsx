import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Goal } from "@/types/goal";
import { Link } from "react-router-dom";
import { generatePastelColor, getAvatarUrl } from "@/lib/utils";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "../ui/button";

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

const GoalCard = ({ goal, onEdit, onDelete }: GoalCardProps) => {
  const progress = goal.target_quantity ? (goal.completions.length / goal.target_quantity) * 100 : 0;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="text-2xl" style={{ color: goal.color }}>{goal.icon}</div>
            <CardTitle className="text-lg font-semibold">
              <Link to={`/goals/${goal.slug}`} className="hover:underline">{goal.title}</Link>
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(goal)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => onDelete(goal.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {goal.description && <p className="text-sm text-muted-foreground pt-2">{goal.description}</p>}
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        {goal.tags && goal.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {goal.tags.map(tag => (
              <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-muted-foreground">Progress</span>
            <span className="text-xs font-semibold">{goal.completions.length} / {goal.target_quantity || '∞'}</span>
          </div>
          <Progress value={progress} />
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center -space-x-2">
          {goal.collaborators?.map(user => (
            <TooltipProvider key={user.id}>
              <Tooltip>
                <TooltipTrigger>
                  <Avatar className="h-8 w-8 border-2 border-card">
                    <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                    <AvatarFallback style={generatePastelColor(user.id)}>
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{user.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
};

export default GoalCard;