import { useMemo } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow, subDays } from 'date-fns';
import { Link } from 'react-router-dom';
import ActivityIcon from './ActivityIcon';
import InteractiveText from '../InteractiveText';
import { useProfiles } from '@/hooks/useProfiles';

const RecentActivityWidget = () => {
  const { data: activities, isLoading } = useActivities();
  const { data: allUsers = [] } = useProfiles();

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
    <div className="divide-y divide-border -mx-6 -mb-6 max-h-[300px] overflow-y-auto">
      {recentActivities.map(activity => (
        <div key={activity.id} className="flex items-start gap-3 px-6 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <ActivityIcon type={activity.type} className="h-4 w-4 text-primary" />
          </div>
          <div className="text-sm flex-grow">
            <p className="text-foreground">
              <span className="font-semibold">{activity.user_name}</span>
              {' '}
              <InteractiveText text={activity.details.description} members={allUsers} />
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              <Link to={`/projects/${activity.project_slug}`} className="hover:underline text-primary font-medium">{activity.project_name}</Link>
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