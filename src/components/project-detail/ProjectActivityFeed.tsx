import { Activity } from "@/types";
import { formatDistanceToNow } from "date-fns";
import {
  Briefcase,
  CheckCircle2,
  CircleOff,
  FileUp,
  MessageSquare,
  UserPlus,
  UserX,
  Wallet,
  PenSquare,
  Ticket,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getAvatarUrl } from "@/lib/utils";

const activityIcons: { [key: string]: React.ElementType } = {
  PROJECT_STATUS_UPDATED: Briefcase,
  TASK_COMPLETED: CheckCircle2,
  TASK_REOPENED: CircleOff,
  FILE_UPLOADED: FileUp,
  TEAM_MEMBER_REMOVED: UserX,
  OWNERSHIP_TRANSFERRED: UserPlus,
  PAYMENT_STATUS_UPDATED: Wallet,
  COMMENT_ADDED: MessageSquare,
  TASK_CREATED: PenSquare,
  TEAM_MEMBER_ADDED: UserPlus,
  TICKET_CREATED: Ticket,
};

const ProjectActivityFeed = ({ activities }: { activities: Activity[] }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No activity yet.
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {activities.map((activity, activityIdx) => {
          const Icon = activityIcons[activity.type] || Briefcase;
          return (
            <li key={activity.id}>
              <div className="relative pb-8">
                {activityIdx !== activities.length - 1 ? (
                  <span
                    className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-border"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex items-start space-x-3">
                  <div>
                    <div className="relative px-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary ring-8 ring-card">
                        <Icon
                          className="h-5 w-5 text-secondary-foreground"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 py-1.5">
                    <div className="text-sm text-foreground">
                      <span className="font-medium">{activity.user.name}</span>{" "}
                      {activity.details.description}
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-muted-foreground">
                      <time dateTime={activity.created_at}>
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                        })}
                      </time>
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