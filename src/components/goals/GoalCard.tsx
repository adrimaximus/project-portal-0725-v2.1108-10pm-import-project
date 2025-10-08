import { Goal } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Target, TrendingUp, Repeat } from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
}

const GoalCard = ({ goal }: GoalCardProps) => {
  const getProgress = () => {
    if (goal.type === 'target' && goal.target_value) {
      const totalValue = goal.completions.reduce((sum, c) => sum + (c.value || 0), 0);
      return (totalValue / goal.target_value) * 100;
    }
    if (goal.type === 'habit' && goal.target_quantity) {
      const completedCount = goal.completions.length;
      return (completedCount / goal.target_quantity) * 100;
    }
    return 0;
  };

  const progress = getProgress();

  const getIcon = () => {
    switch (goal.type) {
      case 'target': return <TrendingUp className="h-4 w-4" />;
      case 'habit': return <Repeat className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  return (
    <Link to={`/goals/${goal.slug}`}>
      <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: goal.color }}>
                <span className="text-2xl">{goal.icon}</span>
              </div>
              <div>
                <CardTitle className="text-lg">{goal.title}</CardTitle>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  {getIcon()}
                  <span className="capitalize">{goal.type}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{goal.description}</p>
          <div className="flex gap-1 flex-wrap">
            {goal.tags.map(tag => (
              <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>{tag.name}</Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
          <div>
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}% complete</p>
          </div>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center -space-x-2">
              <TooltipProvider>
                {goal.collaborators.slice(0, 3).map((user) => (
                  <Tooltip key={user.id}>
                    <TooltipTrigger>
                      <Avatar className="h-7 w-7 border-2 border-background">
                        <AvatarImage src={getAvatarUrl(user.avatar_url) || undefined} alt={user.name} />
                        <AvatarFallback style={{ backgroundColor: generatePastelColor(user.id) }}>{user.initials}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{user.name}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {goal.collaborators.length > 3 && (
                  <Avatar className="h-7 w-7 border-2 border-background">
                    <AvatarFallback>+{goal.collaborators.length - 3}</AvatarFallback>
                  </Avatar>
                )}
              </TooltipProvider>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default GoalCard;