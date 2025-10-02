import { Activity } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { getAvatarUrl, generatePastelColor } from "@/lib/utils";
import { History } from "lucide-react";

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

  return (
    <div className="space-y-6">
      {activities.map((activity) => {
        const userName = activity.user?.name || "System";
        const userInitials = activity.user?.initials || "S";
        const userId = activity.user?.id || "system-activity";
        const avatarUrl = activity.user?.avatar_url;

        return (
          <div key={activity.id} className="flex items-start space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={getAvatarUrl(avatarUrl, userId)} />
              <AvatarFallback style={generatePastelColor(userId)}>
                {userId === "system-activity" ? <History className="h-5 w-5" /> : userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pt-1.5">
              <p className="text-sm text-card-foreground">
                <span className="font-medium">{userName}</span>{" "}
                {activity.details.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(activity.timestamp), {
                  addSuffix: true,
                  locale: id,
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectActivityFeed;