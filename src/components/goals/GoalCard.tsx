import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Goal } from '@/data/goals';
import { getIconComponent } from '@/data/icons';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface GoalCardProps {
  goal: Goal;
}

const GoalCard = ({ goal }: GoalCardProps) => {
  const IconComponent = getIconComponent(goal.icon);
  const collaborators = goal.collaborators || [];

  return (
    <Link to={`/goals/${goal.id}`} key={goal.id}>
      <Card className="hover:border-primary transition-colors">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${goal.color}20` }}>
            <IconComponent className="h-6 w-6" style={{ color: goal.color }} />
          </div>
          <CardTitle className="text-lg font-semibold">{goal.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{goal.frequency}</p>
            {collaborators.length > 0 && (
              <div className="flex -space-x-2 overflow-hidden">
                {collaborators.slice(0, 3).map(user => (
                  <Avatar key={user.id} className="h-6 w-6 border-2 border-card">
                    <AvatarFallback>{user.initials || user.name?.slice(0, 2) || '??'}</AvatarFallback>
                  </Avatar>
                ))}
                {collaborators.length > 3 && (
                  <Avatar className="h-6 w-6 border-2 border-card">
                    <AvatarFallback>+{collaborators.length - 3}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default GoalCard;