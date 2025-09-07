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
import GoalIcon from "./GoalIcon";
import { getProgress } from "@/lib/progress";

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

const GoalCard = ({ goal, onEdit, onDelete }: GoalCardProps) => {
  const { percentage, current, target } = getProgress(goal);

  return (
    <Card className="flex flex-col group">
      <CardHeader>
        <div className="flex justify-between items-start">
          <Link to={`/goals/${goal.slug}`} className="flex items-center gap-3 group/link flex-1 min-w-0">
            <GoalIcon goal={goal} className="h-10 w-10 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold group-hover/link:underline truncate">{goal.title}</CardTitle>
              <p className="text-sm text-muted-foreground truncate">{goal.description}</p>
            </div>
          </Link>
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(goal)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => onDelete(goal.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        {goal.tags && goal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {goal.tags.slice(0, 3).map(tag => (
              <Badge key={tag.id} variant="outline" className="text-xs" style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}>
                {tag.name}
              </Badge>
            ))}
            {goal.tags.length > 3 && <Badge variant="outline" className="text-xs">+{goal.tags.length - 3}</Badge>}
          </div>
        )}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-muted-foreground">Progress</span>
            <span className="text-xs font-semibold">{current} / {target || '∞'}</span>
          </div>
          <Progress value={percentage} indicatorStyle={{ backgroundColor: goal.color }} />
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