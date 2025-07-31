import { Project } from '@/data/projects';
import { User } from '@/data/users';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { differenceInDays, format } from 'date-fns';

interface ProjectOverviewProps {
  project: Project;
}

const ProjectOverview = ({ project }: ProjectOverviewProps) => {
  const daysLeft = differenceInDays(new Date(project.deadline), new Date());
  const budgetProgress = (project.spent / project.budget) * 100;

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-semibold">{project.status}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Deadline</p>
            <p className="font-semibold">{format(new Date(project.deadline), "MMM d, yyyy")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Days Left</p>
            <p className="font-semibold">{daysLeft > 0 ? `${daysLeft} days` : 'Past due'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Team Size</p>
            <p className="font-semibold">{project.team.length} members</p>
          </div>
        </div>
        
        <div>
          <Label className="text-sm">Budget</Label>
          <div className="flex items-center gap-4 mt-1">
            <Progress value={budgetProgress} className="w-full" />
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              ${(project.spent / 1000).toFixed(1)}k / ${(project.budget / 1000).toFixed(1)}k
            </span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Team</p>
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2 overflow-hidden">
              {project.team.map(member => (
                <Avatar key={member.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback>{member.name[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {project.team.map(m => m.name).join(', ')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <p className={`text-sm font-medium text-muted-foreground ${className}`}>{children}</p>;
}

export default ProjectOverview;