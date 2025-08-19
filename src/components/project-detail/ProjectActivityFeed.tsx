import { Activity } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { getActivityIcon } from "@/data/activityIcons";

const renderActivityDescription = (description: string) => {
  const mentionRegex = /(\/\[[^\]]+\]\([^)]+\)|@\[[^\]]+\]\([^)]+\))/g;
  const parts = description.split(mentionRegex);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;

        const projectMentionMatch = /^\/\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        if (projectMentionMatch) {
          const projectName = projectMentionMatch[1];
          const projectId = projectMentionMatch[2];
          return (
            <a
              key={`project-${projectId}-${index}`}
              href={`/projects/${projectId}`}
              className="text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {projectName}
            </a>
          );
        }

        const userMentionMatch = /^@\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        if (userMentionMatch) {
          const userName = userMentionMatch[1];
          return (
            <span key={`user-${userName}-${index}`} className="font-semibold text-primary">
              @{userName}
            </span>
          );
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
                  <span className="h-10 w-10 min-h-10 min-w-10 rounded-full bg-muted flex items-center justify-center ring-8 ring-background">
                    {getActivityIcon(activity.type, "h-4 w-4 text-muted-foreground")}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">{activity.user.name}</span>{" "}
                    {renderActivityDescription(activity.details?.description || "")}
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