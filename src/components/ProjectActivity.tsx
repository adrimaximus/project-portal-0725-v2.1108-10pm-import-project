import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dummyActivities, activityIcons, activityColors } from "@/data/activity";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';

type ProjectActivityProps = {
  projectId: string;
};

const ProjectActivity = ({ projectId }: ProjectActivityProps) => {
  const activities = dummyActivities.filter((act) => act.projectId === projectId);

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No activity for this project yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-border -translate-x-1/2"></div>

          <div className="space-y-8">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type];
              const color = activityColors[activity.type];
              return (
                <div key={activity.id} className="relative flex items-start gap-4">
                  <div className={`absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full ${color} -translate-x-1/2`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                       <Avatar className="h-6 w-6">
                        <AvatarImage src={activity.user.avatar} />
                        <AvatarFallback>{activity.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium">{activity.user.name}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{activity.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectActivity;