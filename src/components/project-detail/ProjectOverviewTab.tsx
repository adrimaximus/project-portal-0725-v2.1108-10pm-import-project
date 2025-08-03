import { dummyUsers, User } from '@/data/users';
import { Project } from '@/data/projects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProjectOverviewTabProps {
  project: Project;
}

const ProjectOverviewTab = ({ project }: ProjectOverviewTabProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            {project.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Start Date</dt>
              <dd>{project.startDate}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Due Date</dt>
              <dd>{project.dueDate}</dd>
            </div>
             <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>{project.status}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.team.map((member: User) => (
            <div key={member.id} className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.avatar} />
                <AvatarFallback>{member.initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectOverviewTab;