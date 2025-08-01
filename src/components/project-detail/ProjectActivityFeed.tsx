import { Activity } from '@/data/projects';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';

const ProjectActivityFeed = ({ activities }: { activities: Activity[] }) => {
  if (!activities || activities.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }
  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <div key={activity.id} className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={activity.user.avatar} />
            <AvatarFallback>{activity.user.initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm">
              <span className="font-semibold">{activity.user.name}</span> {activity.action} <span className="font-semibold">{activity.target}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectActivityFeed;