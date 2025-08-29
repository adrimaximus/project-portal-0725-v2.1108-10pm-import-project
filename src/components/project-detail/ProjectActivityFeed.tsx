import { Activity } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import {
  FileText,
  MessageSquare,
  ListChecks,
  CheckCircle,
  Trash2,
  UserPlus,
  UserMinus,
  CreditCard,
  Pencil,
  FileUp,
  Ticket,
  Undo2,
  Briefcase,
  UserCog,
  Wallet,
  Calendar,
  MapPin,
} from "lucide-react";
import { generateVibrantGradient } from "@/lib/utils";

const activityIcons: { [key: string]: React.ReactNode } = {
  PROJECT_CREATED: <FileText className="h-3 w-3" />,
  COMMENT_ADDED: <MessageSquare className="h-3 w-3" />,
  TASK_CREATED: <ListChecks className="h-3 w-3" />,
  TASK_COMPLETED: <CheckCircle className="h-3 w-3" />,
  TASK_DELETED: <Trash2 className="h-3 w-3" />,
  TEAM_MEMBER_ADDED: <UserPlus className="h-3 w-3" />,
  TEAM_MEMBER_REMOVED: <UserMinus className="h-3 w-3" />,
  PAYMENT_STATUS_UPDATED: <CreditCard className="h-3 w-3" />,
  PROJECT_STATUS_UPDATED: <Pencil className="h-3 w-3" />,
  PROJECT_DETAILS_UPDATED: <Pencil className="h-3 w-3" />,
  FILE_UPLOADED: <FileUp className="h-3 w-3" />,
  TICKET_CREATED: <Ticket className="h-3 w-3" />,
  TASK_REOPENED: <Undo2 className="h-3 w-3" />,
  SERVICE_ADDED: <Briefcase className="h-3 w-3" />,
  SERVICE_REMOVED: <Briefcase className="h-3 w-3" />,
  OWNERSHIP_TRANSFERRED: <UserCog className="h-3 w-3" />,
  BUDGET_UPDATED: <Wallet className="h-3 w-3" />,
  TIMELINE_UPDATED: <Calendar className="h-3 w-3" />,
  VENUE_UPDATED: <MapPin className="h-3 w-3" />,
};

const renderActivityDescription = (description: string) => {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = description.split(mentionRegex);

  return (
    <>
      {parts.map((part, index) => {
        if (index % 3 === 1) {
          const userName = part;
          return (
            <span key={`user-${userName}-${index}`} className="font-semibold text-primary">
              @{userName}
            </span>
          );
        }
        if (index % 3 === 2) {
          return null;
        }
        return <span key={`text-${index}`}>{part}</span>;
      })}
    </>
  );
};

const ProjectActivityFeed = ({ activities }: { activities: Activity[] }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No activity yet.
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {activities.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {activityIdx !== activities.length - 1 ? (
                <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
              ) : null}
              <div className="relative flex items-start space-x-4">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activity.user.avatar_url} />
                    <AvatarFallback style={generateVibrantGradient(activity.user.id)}>{activity.user.initials}</AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-2 -right-2 h-5 w-5 rounded-full bg-muted flex items-center justify-center ring-4 ring-background">
                    {activityIcons[activity.type] || <FileText className="h-3 w-3" />}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">{activity.user.name}</span>{' '}
                    {activity.type === 'COMMENT_ADDED' ? (
                      <>
                        added a comment: "{renderActivityDescription(activity.details?.description || '')}"
                      </>
                    ) : activity.type === 'TICKET_CREATED' ? (
                      <>
                        created a ticket: "{renderActivityDescription(activity.details?.description || '')}"
                      </>
                    ) : (
                      renderActivityDescription(activity.details?.description || '')
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                      locale: id,
                    })}
                  </p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectActivityFeed;