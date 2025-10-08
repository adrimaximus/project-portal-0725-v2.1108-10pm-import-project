import { Activity } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getInitials } from '@/lib/utils';

interface ProjectActivityProps {
  activities: Activity[];
}

const ProjectActivity = ({ activities }: ProjectActivityProps) => (
  <div className="space-y-4">
    <h3 className="font-semibold">Activity</h3>
    <ul className="space-y-4">
      {activities?.map((activity) => (
        <li key={activity.id} className="flex items-start gap-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={activity.user.avatar_url || ''} />
            <AvatarFallback>{getInitials(activity.user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-auto text-sm">
            <p>
              <span className="font-medium">{activity.user.name}</span> {activity.details.description}
            </p>
            <time dateTime={activity.timestamp} className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
            </time>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

export default ProjectActivity;