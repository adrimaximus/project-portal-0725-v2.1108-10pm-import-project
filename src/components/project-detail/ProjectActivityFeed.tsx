import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Activity } from "@/data/projects";
import { formatDistanceToNow } from "date-fns";
import { FileText, MessageSquare, UserPlus, Edit, CheckCircle } from 'lucide-react';

const activityIcons = {
  created: <FileText className="h-4 w-4" />,
  commented: <MessageSquare className="h-4 w-4" />,
  assigned: <UserPlus className="h-4 w-4" />,
  updated: <Edit className="h-4 w-4" />,
  completed: <CheckCircle className="h-4 w-4" />,
  uploaded: <FileText className="h-4 w-4" />,
  started: <FileText className="h-4 w-4" />,
  default: <FileText className="h-4 w-4" />,
};

interface ProjectActivityFeedProps {
  activity: Activity[];
}

export default function ProjectActivityFeed({ activity }: ProjectActivityFeedProps) {
  return (
    <div className="space-y-6">
      {activity.map((item) => (
        <div key={item.id} className="flex items-start gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            {activityIcons[item.action as keyof typeof activityIcons] || activityIcons.default}
          </div>
          <div className="flex-1">
            <p className="text-sm">
              <span className="font-semibold">{item.user.name}</span> {item.description}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}