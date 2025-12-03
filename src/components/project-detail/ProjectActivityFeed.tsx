import { Activity } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { History } from "lucide-react";
import ActivityIcon from "./ActivityIcon";
import InteractiveText from '../InteractiveText';
import { useProfiles } from '@/hooks/useProfiles';

interface ProjectActivityFeedProps {
  activities: Activity[];
}

const ProjectActivityFeed = ({ activities }: ProjectActivityFeedProps) => {
  const { data: allUsers = [] } = useProfiles();
  // Regex to remove attachment block: matches '**Attachments:**' until end of string.
  const attachmentsRegex = /\s*\*\*Attachments:\*\*.*$/s;

  const filteredActivities = (activities || [])
    .map(activity => {
      const relevantTypes = ['COMMENT_ADDED', 'TICKET_CREATED', 'TASK_CREATED'];
      
      // Ensure details and description exist before processing
      if (relevantTypes.includes(activity.type) && activity.details?.description) {
        const cleanedDescription = activity.details.description.replace(attachmentsRegex, '').trim();
        
        // Regex to remove common prefixes
        const prefixRegex = /^(commented: |created a new task & ticket: |created a new task: )/i;
        // Fix: Removed extra backslash to correctly match double quotes if needed, 
        // but typically we just want to remove the prefix.
        // If we want to remove quotes around the content: .replace(/^"|"$/g, '')
        const content = cleanedDescription.replace(prefixRegex, '').replace(/"/g, '').trim();

        // If description becomes empty after cleaning (e.g. only had attachments or just prefix)
        if (content === '') {
           // Fallback text instead of hiding it, depending on context
           const fallbackText = activity.type === 'COMMENT_ADDED' 
             ? (activity.details.description.match(attachmentsRegex) ? 'Sent an attachment' : 'Posted a comment')
             : 'Created an item';

           return {
             ...activity,
             details: {
               ...activity.details,
               description: fallbackText
             }
           };
        }

        return {
          ...activity,
          details: {
            ...activity.details,
            description: cleanedDescription,
          }
        };
      }
      // Return other activity types (like FILE_UPLOADED, STATUS_UPDATED) as is
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
          const description = activity.details?.description || "Activity performed";

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
                        <InteractiveText text={description} members={allUsers} />
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