import { Project } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getProjectStatusStyles, generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Link } from 'react-router-dom';

const ProjectCard = ({ project }: { project: Project }) => {
  const statusStyles = getProjectStatusStyles(project.status);
  return (
    <Link to={`/projects/${project.slug}`}>
      <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
        <CardHeader>
          <CardTitle className="truncate">{project.name}</CardTitle>
          <Badge variant="outline" className={statusStyles.tw}>{project.status}</Badge>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground h-10 line-clamp-2">{project.description}</p>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} />
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex -space-x-2">
            {project.assignedTo.slice(0, 3).map(user => (
              <Avatar key={user.id} className="h-8 w-8 border-2 border-card">
                <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
              </Avatar>
            ))}
            {project.assignedTo.length > 3 && (
              <Avatar className="h-8 w-8 border-2 border-card">
                <AvatarFallback>+{project.assignedTo.length - 3}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ProjectCard;