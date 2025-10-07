import { Goal } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';

interface GoalCardProps {
  goal: Goal;
}

const GoalCard = ({ goal }: GoalCardProps) => {
  const progress = 50; // Placeholder

  return (
    <Link to={`/goals/${goal.slug}`}>
      <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: goal.color || '#ccc' }}
              >
                <span className="text-xl">{goal.icon}</span>
              </div>
              <div>
                <CardTitle className="text-lg">{goal.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{goal.type}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{goal.description}</p>
            <div className="flex flex-wrap gap-1 mb-4">
              {goal.tags?.map(tag => (
                <Badge key={tag.id} variant="secondary" style={{ backgroundColor: tag.color, color: '#fff' }}>{tag.name}</Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} />
            <div className="flex justify-end -space-x-2 mt-3">
              {goal.collaborators?.map(user => (
                <TooltipProvider key={user.id}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar className="h-7 w-7 border-2 border-background">
                        <AvatarImage src={getAvatarUrl(user)} alt={user.name} />
                        <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{user.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default GoalCard;