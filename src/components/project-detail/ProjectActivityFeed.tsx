import { Activity, ActivityType } from '@/data/projects';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  UploadCloud,
  ArrowRightCircle,
  MessageSquare,
  Ticket,
  UserPlus,
  UserMinus,
  ListChecks,
  FileText,
  Trash2,
  CheckCircle2,
  DollarSign,
  Pencil,
} from 'lucide-react';

const activityIcons: Record<ActivityType, React.ElementType> = {
  PROJECT_CREATED: Pencil,
  PROJECT_STATUS_UPDATED: ArrowRightCircle,
  PAYMENT_STATUS_UPDATED: DollarSign,
  PROJECT_DETAILS_UPDATED: FileText,
  TEAM_MEMBER_ADDED: UserPlus,
  TEAM_MEMBER_REMOVED: UserMinus,
  FILE_UPLOADED: UploadCloud,
  TASK_CREATED: ListChecks,
  TASK_COMPLETED: CheckCircle2,
  TASK_DELETED: Trash2,
  COMMENT_ADDED: MessageSquare,
  TICKET_CREATED: Ticket,
};

const ProjectActivityFeed = ({ activities }: { activities: Activity[] }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        No activity to show yet.
      </div>
    );
  }

  const sortedActivities = [...activities].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {sortedActivities.map((activity, index) => {
          const Icon = activityIcons[activity.type] || Pencil;
          const isLast = index === sortedActivities.length - 1;

          return (
            <li key={activity.id}>
              <div className="relative pb-8">
                {!isLast ? (
                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
                ) : null}
                <div className="relative flex items-start space-x-3">
                  <div>
                    <div className="relative px-1">
                      <div className="h-8 w-8 bg-muted rounded-full ring-8 ring-card flex items-center justify-center">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 py-1.5">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-semibold text-card-foreground">{activity.user.name}</span>
                      {' '}{activity.details.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: id })}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ProjectActivityFeed;