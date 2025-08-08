import { Project } from "@/data/projects";
import { getStatusColor } from "@/lib/statusUtils";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

interface ProjectsYearViewProps {
  projects: Project[];
  refreshKey?: number;
}

const ProjectsYearView = ({ projects }: ProjectsYearViewProps) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  const yearProjects = projects.filter(project => {
    if (!project.dueDate) return false;
    const projectDate = new Date(project.dueDate);
    return projectDate.getFullYear() === currentYear;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const projectsByMonth: { [key: string]: Project[] } = yearProjects.reduce((acc, project) => {
    const month = new Date(project.dueDate).toLocaleString('default', { month: 'long' });
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(project);
    return acc;
  }, {} as { [key: string]: Project[] });

  const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const sortedMonths = Object.keys(projectsByMonth).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Projects for {currentYear}</h3>
      {sortedMonths.length > 0 ? (
        <div className="space-y-6">
          {sortedMonths.map(month => (
            <div key={month}>
              <h4 className="text-md font-semibold mb-3">{month}</h4>
              <div className="space-y-3">
                {projectsByMonth[month].map(project => (
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
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No projects with due dates this year.</p>
      )}
    </div>
  );
};

export default ProjectsYearView;