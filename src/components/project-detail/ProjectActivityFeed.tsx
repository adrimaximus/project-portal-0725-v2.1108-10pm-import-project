import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Project, Activity } from "@/data/projects";
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, File, CheckCircle2, Info } from 'lucide-react';

interface ProjectActivityFeedProps {
  project: Project;
}

const activities: Activity[] = [
    { id: 'act-1', type: 'comment', user: { id: 'user-1', name: 'Alice Johnson', initials: 'AJ' }, timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), details: 'added a comment on "Login Bug"' },
    { id: 'act-2', type: 'file', user: { id: 'user-2', name: 'Bob Williams', initials: 'BW' }, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), details: 'uploaded "final-designs.zip"' },
    { id: 'act-3', type: 'task', user: { id: 'user-1', name: 'Alice Johnson', initials: 'AJ' }, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), details: 'completed task "Setup Database"' },
    { id: 'act-4', type: 'status', user: { id: 'user-3', name: 'Charlie Brown', initials: 'CB' }, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), details: 'changed status to "At Risk"' },
];

const ActivityIcon = ({ type }: { type: Activity['type'] }) => {
    const className = "h-4 w-4 text-muted-foreground";
    switch (type) {
        case 'comment': return <MessageSquare className={className} />;
        case 'file': return <File className={className} />;
        case 'task': return <CheckCircle2 className={className} />;
        case 'status': return <Info className={className} />;
        default: return <Info className={className} />;
    }
};

export const ProjectActivityFeed = ({ project }: ProjectActivityFeedProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {activities.map(activity => (
            <li key={activity.id} className="flex items-start gap-3">
              <div className="flex items-center gap-3">
                <ActivityIcon type={activity.type} />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                  <AvatarFallback>{activity.user.initials}</AvatarFallback>
                </Avatar>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{activity.user.name}</span> {activity.details}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};