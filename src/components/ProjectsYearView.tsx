import { Project } from '@/data/projects';
import { useState } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from './ui/badge';

interface ProjectsYearViewProps {
  projects: Project[];
}

const MonthProjectList = ({ month, year, projects }: { month: number, year: number, projects: Project[] }) => {
  const monthName = new Date(year, month).toLocaleString('id-ID', { month: 'long' });

  // Sort projects by start date within the month
  const sortedProjects = [...projects].sort((a, b) => new Date(a.startDate!).getDate() - new Date(b.startDate!).getDate());

  return (
    <div className="p-3 border rounded-lg flex flex-col h-full min-h-[150px]">
      <h3 className="font-semibold mb-3 text-center">{monthName}</h3>
      {sortedProjects.length > 0 ? (
        <div className="space-y-1.5 overflow-y-auto -mr-2 pr-2 flex-grow">
          {sortedProjects.map(project => (
            <Link key={project.id} to={`/projects/${project.id}`} className="block" title={project.name}>
              <Badge 
                variant="secondary" 
                className="w-full text-left font-normal truncate flex items-center justify-start h-7 border-transparent hover:bg-accent hover:text-accent-foreground"
              >
                {project.name}
              </Badge>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-xs text-muted-foreground italic">Tidak ada proyek</p>
        </div>
      )}
    </div>
  );
};

const ProjectsYearView = ({ projects }: ProjectsYearViewProps) => {
  const [year, setYear] = useState(new Date().getFullYear());

  const projectsByMonth = Array.from({ length: 12 }, () => [] as Project[]);
  projects.forEach(project => {
    if (project.startDate) {
      const projectDate = new Date(project.startDate);
      if (projectDate.getFullYear() === year) {
        const month = projectDate.getMonth();
        projectsByMonth[month].push(project);
      }
    }
  });

  return (
    <div>
      <div className="flex items-center justify-center mb-4">
        <Button variant="outline" size="icon" onClick={() => setYear(year - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold mx-4 w-24 text-center">{year}</h2>
        <Button variant="outline" size="icon" onClick={() => setYear(year + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <MonthProjectList key={i} year={year} month={i} projects={projectsByMonth[i]} />
        ))}
      </div>
    </div>
  );
};

export default ProjectsYearView;