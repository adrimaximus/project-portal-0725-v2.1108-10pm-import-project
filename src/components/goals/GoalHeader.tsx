import { Goal } from '@/data/goals';
import { User } from '@/data/users';
import { Button } from '@/components/ui/button';
import { getIconComponent } from '@/data/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar as CalendarIcon, Edit, UserPlus } from 'lucide-react';

interface GoalHeaderProps {
  goal: Goal;
}

const GoalHeader = ({ goal }: GoalHeaderProps) => {
  const IconComponent = getIconComponent(goal.icon);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${goal.color}20` }}
        >
          <IconComponent className="h-8 w-8" style={{ color: goal.color }} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{goal.title}</h1>
          <p className="text-muted-foreground">{goal.frequency}</p>
        </div>
        <div className="flex -space-x-2">
          {goal.collaborators?.map((user: User) => (
            <Avatar key={user.id} className="h-8 w-8 border-2 border-background">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.initials}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline">
          <CalendarIcon className="mr-2 h-4 w-4" />
          Pick a date range
        </Button>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edit Goal
        </Button>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite
        </Button>
      </div>
    </div>
  );
};

export default GoalHeader;