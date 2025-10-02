import { Activity } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { History } from "lucide-react";
import ActivityIcon from "./ActivityIcon";

interface ProjectActivityFeedProps {
  activities: Activity[];
}

const ProjectActivityFeed = ({ activities }: ProjectActivityFeedProps) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <History className="mx-auto h-12 w-12" />
        <p className="mt-4">No activity yet.</p>
      </div>
    );
  }

  const formatDescription = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\\"/g, "") // Remove escaped quotes
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-card-foreground">$1</strong>')
      .replace(/`(.*?)`/g, '<code class="bg-muted text-muted-foreground font-mono text-xs px-1 py-0.5 rounded">$1</code>');
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, activityIdx) => {
          const userName = activity.user?.name || "System";
          const descriptionHtml = { __html: formatDescription(activity.details.description) };

          return (
            <li key={activity.id}>
              <div className="relative pb-8">
                {activityIdx !== activities.length - 1 ? (
                  <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
                ) : null}
                <div className="relative flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <span className="h-8 w-8 rounded-full bg-background border flex items-center justify-center ring-8 ring-background">
                      <ActivityIcon type={activity.type} />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm text-muted-foreground break-all">
                        <span className="font-semibold text-card-foreground">{userName}</span>{' '}
                        <span dangerouslySetInnerHTML={descriptionHtml} />
                      </p>
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-muted-foreground">
                      <time dateTime={activity.timestamp}>
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                          locale: id,
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