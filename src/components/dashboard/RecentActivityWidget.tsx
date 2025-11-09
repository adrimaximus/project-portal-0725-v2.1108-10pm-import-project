import { useMemo } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarUrl, getInitials, generatePastelColor } from '@/lib/utils';
import { formatDistanceToNow, subDays } from 'date-fns';
import { Link } from 'react-router-dom';

const RecentActivityWidget = () => {
  const { data: activities, isLoading } = useActivities();

  const recentActivities = useMemo(() => {
    if (!activities) return [];
    const twentyFourHoursAgo = subDays(new Date(), 1);
    return activities.filter(activity => new Date(activity.created_at) > twentyFourHoursAgo);
  }, [activities]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!recentActivities || recentActivities.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-muted-foreground">No activity in the last 24 hours.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border -mx-6 -my-6 max-h-[300px] overflow-y-auto">
      {recentActivities.map(activity => (
        <div key={activity.id} className="flex items-start gap-3 px-6 py-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={getAvatarUrl(activity.user_avatar_url, activity.user_id)} alt={activity.user_name || ''} />
            <AvatarFallback style={generatePastelColor(activity.user_id)} className="text-xs">
              {activity.user_initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-sm flex-grow">
            <p className="text-foreground">
              <span className="font-semibold">{activity.user_name}</span>
              {' '}{activity.details.description}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              <Link to={`/projects/${activity.project_slug}`} className="hover:underline">{activity.project_name}</Link>
              {' · '}
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivityWidget;