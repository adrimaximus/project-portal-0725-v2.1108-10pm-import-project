import { Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

interface ProjectListProps {
  projects: Project[];
}

export const ProjectList = ({ projects }: ProjectListProps) => {
  if (projects.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        No projects found that match the current filters.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link to={`/projects/${project.slug}`} key={project.id}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <Badge 
                  variant={project.status === 'Completed' ? 'default' : 'secondary'}
                  className={
                    project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    project.status === 'On Hold' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }
                >
                  {project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 h-10 overflow-hidden">
                {project.description}
              </p>
              <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
                <span>Progress</span>
                <span>{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm font-medium">Payment:</span>
                <Badge
                  variant={project.payment_status === 'Paid' ? 'default' : 'outline'}
                  className={
                    project.payment_status === 'Paid' ? 'border-green-500 text-green-700' :
                    project.payment_status === 'Unpaid' ? 'border-red-500 text-red-700' :
                    'border-gray-500 text-gray-700'
                  }
                >
                  {project.payment_status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};