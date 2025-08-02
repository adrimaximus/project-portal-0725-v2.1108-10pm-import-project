import { Activity } from '@/data/projects';
import {
  MessageSquare,
  ArrowRightCircle,
  FileUp,
  GitCommit,
  UserPlus,
  LucideIcon,
  Circle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as indonesianLocale } from 'date-fns/locale';

const activityIcons: Record<string, LucideIcon> = {
  comment: MessageSquare,
  status_change: ArrowRightCircle,
  file_upload: FileUp,
  commit: GitCommit,
  assignment: UserPlus,
  default: Circle,
};

const activityDescriptions: Record<string, string> = {
    comment: 'memberi komentar',
    status_change: 'memperbarui status',
    file_upload: 'mengunggah file',
    commit: 'mendorong sebuah commit',
    assignment: 'menugaskan sebuah tugas',
};

const ProjectActivityFeed = ({ activities }: { activities: Activity[] }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Belum ada aktivitas untuk ditampilkan pada proyek ini.
      </div>
    );
  }

  const sortedActivities = [...activities].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-8 relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-border" aria-hidden="true" />

      {sortedActivities.map((activity) => {
        const Icon = activityIcons[activity.type] || activityIcons.default;
        const description = activityDescriptions[activity.type] || 'melakukan sebuah aktivitas';

        return (
          <div key={activity.id} className="flex items-start gap-4 relative">
            <div className="flex-shrink-0 z-10">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background border">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </span>
            </div>
            <div className="flex-1 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{activity.user.name}</span> {description}
                </p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: indonesianLocale })}
                </span>
              </div>
              <p className="text-sm mt-1">{activity.details}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectActivityFeed;