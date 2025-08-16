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
  const { percentage, current, target } = getProgress(goal);

  return (
    <Link to={`/goals/${goal.slug}`} className="block group">
      <Card className="h-full flex flex-col transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-1 cursor-pointer">
        <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-6 pb-4">
          <GoalIcon goal={goal} className="w-16 h-16 flex-shrink-0" />
          <div className="flex-grow overflow-hidden">
            <h3 className="text-lg font-bold leading-tight truncate">{goal.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{goal.description}</p>
          </div>
        </CardHeader>
        <CardContent className="flex-grow px-6 pt-0 pb-4">
          {goal.tags && goal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {goal.tags.map(tag => (
                <Badge 
                  key={tag.id} 
                  variant="outline" 
                  className="font-normal text-xs"
                  style={{ 
                    backgroundColor: `${tag.color}20`, 
                    borderColor: `${tag.color}80`, 
                    color: tag.color 
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-4 p-6 pt-0">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-muted-foreground tracking-wider">PROGRESS</span>
              <span className="text-sm font-bold" style={{ color: goal.color }}>{percentage.toFixed(0)}%</span>
            </div>
            <Progress value={percentage} className="h-2" indicatorStyle={{ backgroundColor: goal.color }} />
            {target > 0 && (
              <p className="text-xs text-right text-muted-foreground mt-1">{current.toLocaleString()} / {target.toLocaleString()} {goal.unit || ''}</p>
            )}
          </div>
          
          {goal.collaborators && goal.collaborators.length > 0 && (
            <div className="flex items-center justify-between pt-3 border-t">
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
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
};

export default GoalCard;