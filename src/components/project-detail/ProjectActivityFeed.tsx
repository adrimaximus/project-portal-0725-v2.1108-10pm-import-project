import { Activity } from "@/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface ProjectActivityFeedProps {
  activities: Activity[];
}

const ProjectActivityFeed = ({ activities }: ProjectActivityFeedProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.user.avatar} />
                  <AvatarFallback>{activity.user.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{activity.user.name}</span> {activity.action} {activity.target}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center">No recent activity.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectActivityFeed;