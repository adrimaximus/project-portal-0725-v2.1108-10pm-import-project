import { Project } from "@/data/projects";
import { getStatusColor } from "@/lib/statusUtils";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

interface ProjectsMonthViewProps {
  projects: Project[];
  refreshKey?: number;
}

const ProjectsMonthView = ({ projects }: ProjectsMonthViewProps) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthProjects = projects.filter(project => {
    if (!project.dueDate) return false;
    const projectDate = new Date(project.dueDate);
    return projectDate.getMonth() === currentMonth && projectDate.getFullYear() === currentYear;
  });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        Projects Due This Month ({currentDate.toLocaleString('default', { month: 'long' })})
      </h3>
      {monthProjects.length > 0 ? (
        <div className="space-y-3">
          {monthProjects.map(project => (
            <Link to={`/projects/${project.id}`} key={project.id} className="block">
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex items-center" style={{ borderLeft: `4px solid ${getStatusColor(project.status)}` }}>
                  <div className="flex-grow">
                    <p className="font-semibold">{project.name}</p>
                    <p className="text-sm text-muted-foreground">{project.status} - Due: {new Date(project.dueDate).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No projects due this month.</p>
      )}
    </div>
  );
};

export default ProjectsMonthView;