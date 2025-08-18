import { Goal } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import GoalIcon from './GoalIcon';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getProgress } from '@/lib/progress';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const GoalCard = ({ goal }: { goal: Goal }) => {
  const { percentage } = getProgress(goal);

  return (
    <Link to={`/goals/${goal.slug}`} className="block group">
      <Card className="transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-1 cursor-pointer">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0 p-4">
          <GoalIcon goal={goal} className="w-10 h-10 flex-shrink-0" />
          <div className="flex-grow overflow-hidden">
            <h3 className="font-bold truncate">{goal.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{goal.description}</p>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {goal.tags && goal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {goal.tags.slice(0, 3).map(tag => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-xs"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    borderColor: tag.color,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-muted-foreground tracking-wider">PROGRESS</span>
              <span className="text-sm font-bold" style={{ color: goal.color }}>{percentage.toFixed(0)}%</span>
            </div>
            <Progress value={percentage} className="h-2" indicatorStyle={{ backgroundColor: goal.color }} />
          </div>
        </CardContent>
        {goal.collaborators && goal.collaborators.length > 0 && (
          <CardFooter className="p-4 pt-0 flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider">TEAM</span>
            <div className="flex -space-x-2">
              <TooltipProvider delayDuration={100}>
                {goal.collaborators.map(user => (
                  <Tooltip key={user.id}>
                    <TooltipTrigger asChild>
                      <Avatar className="h-7 w-7 border-2 border-background">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{user.name}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
};

export default GoalCard;