import { Activity } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { History } from "lucide-react";
import ActivityIcon from "./ActivityIcon";
import { formatActivityDescription } from "@/lib/utils";

interface ProjectActivityFeedProps {
  activities: Activity[];
}

const ProjectActivityFeed = ({ activities }: ProjectActivityFeedProps) => {
  // Regex yang lebih kuat untuk menghapus blok lampiran, dari '**Attachments:**' hingga akhir teks.
  const attachmentsRegex = /\s*\*\*Attachments:\*\*.*$/s;

  const filteredActivities = activities
    .filter(activity => activity.type !== 'FILE_UPLOADED')
    .map(activity => {
      const relevantTypes = ['COMMENT_ADDED', 'TICKET_CREATED', 'TASK_CREATED'];
      if (relevantTypes.includes(activity.type) && activity.details.description) {
        const cleanedDescription = activity.details.description.replace(attachmentsRegex, '').trim();
        
        // Regex untuk menghapus berbagai kemungkinan awalan
        const prefixRegex = /^(commented: |created a new task & ticket: |created a new task: )/i;
        const content = cleanedDescription.replace(prefixRegex, '').replace(/\\"/g, '').trim();

        // Jika deskripsi menjadi kosong setelah menghapus lampiran dan awalan, jangan tampilkan aktivitas ini.
        if (content === '') {
          return null;
        }

        return {
          ...activity,
          details: {
            ...activity.details,
            description: cleanedDescription,
          }
        };
      }
      return activity;
    })
    .filter(Boolean) as Activity[];


  if (!filteredActivities || filteredActivities.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <History className="mx-auto h-12 w-12" />
        <p className="mt-4">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {filteredActivities.map((activity, activityIdx) => {
          const userName = activity.user?.name || "System";
          const descriptionHtml = { __html: formatActivityDescription(activity.details.description, activity.type) };

          return (
            <li key={activity.id}>
              <div className="relative pb-8">
                {activityIdx !== filteredActivities.length - 1 ? (
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
                        {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                        }) : ''}
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