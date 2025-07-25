import { Project } from "@/data/projects";
import { services as allServices } from "@/data/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import ProjectComments, { Comment } from "@/components/ProjectComments";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProjectMainContentProps {
  project: Project;
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
}

const ProjectMainContent = ({ project, comments, setComments }: ProjectMainContentProps) => {
  const projectServices = allServices.filter(service => 
    project.services.includes(service.title)
  );

  const recentActivity = [
    { id: 1, user: { name: "Olivia Martin", avatar: "https://i.pravatar.cc/150?u=olivia" }, action: "updated the project deadline to December 15, 2024.", timestamp: "2024-07-20T10:30:00Z" },
    { id: 2, user: { name: "Jackson Lee", avatar: "https://i.pravatar.cc/150?u=jackson" }, action: "attached a new file: 'design_mockups_v2.zip'.", timestamp: "2024-07-19T15:00:00Z" },
    { id: 3, user: { name: project.assignedTo[0].name, avatar: project.assignedTo[0].avatar }, action: "changed the project status to 'In Progress'.", timestamp: "2024-07-18T09:00:00Z" },
  ];

  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="md:col-span-2 space-y-6">
      <Card>
        <CardHeader><CardTitle>Project Progress</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={65} className="w-full" />
            <p className="text-sm text-muted-foreground">65% complete</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Selected Services</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {projectServices.map((service) => (
              <div key={service.title} className="flex items-center gap-2 rounded-lg bg-muted p-2">
                <div className={cn("rounded-md p-1", service.iconColor)}>
                  <service.icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{service.title}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <ul className="space-y-6">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="flex items-start gap-4">
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                    <AvatarFallback>{activity.user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <p className="text-sm">
                      <span className="font-semibold">{activity.user.name}</span>{' '}{activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatActivityDate(activity.timestamp)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          )}
        </CardContent>
      </Card>

      <ProjectComments comments={comments} setComments={setComments} />
    </div>
  );
};

export default ProjectMainContent;