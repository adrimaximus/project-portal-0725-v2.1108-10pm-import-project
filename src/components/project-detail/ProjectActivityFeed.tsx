import { Activity, ActivityType } from '@/data/projects';
import {
  MessageSquare,
  ArrowRightCircle,
  FileUp,
  GitCommit,
  UserPlus,
  LucideIcon,
  Circle,
  Ticket,
  CheckCircle2,
  TrendingUp,
  Wallet,
  CalendarClock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as indonesianLocale } from 'date-fns/locale';

const activityIcons: Record<ActivityType, LucideIcon> = {
  comment: MessageSquare,
  ticket_created: Ticket,
  ticket_resolved: CheckCircle2,
  status_change: ArrowRightCircle,
  payment_status_change: Wallet,
  progress_update: TrendingUp,
  budget_change: Wallet,
  deadline_change: CalendarClock,
  start_date_change: CalendarClock,
  file_upload: FileUp,
  member_add: UserPlus,
  task_assign: UserPlus,
  commit: GitCommit,
};

const activityDescriptions: Record<ActivityType, string> = {
    comment: 'memberi komentar pada',
    ticket_created: 'membuat tiket baru',
    ticket_resolved: 'menyelesaikan tiket',
    status_change: 'memperbarui status proyek',
    payment_status_change: 'memperbarui status pembayaran',
    progress_update: 'memperbarui progres proyek',
    budget_change: 'memperbarui anggaran proyek',
    deadline_change: 'memperbarui tenggat waktu proyek',
    start_date_change: 'memperbarui tanggal mulai proyek',
    file_upload: 'mengunggah file',
    member_add: 'menambahkan anggota baru',
    task_assign: 'menugaskan tugas',
    commit: 'mendorong sebuah commit',
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
        const Icon = activityIcons[activity.type] || Circle;
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
                  {activity.target && <span className="font-medium text-foreground"> {activity.target}</span>}
                </p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: indonesianLocale })}
                </span>
              </div>
              <p className="text-sm mt-1 text-foreground/80">{activity.details}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectActivityFeed;