import { Project } from '@/data/projects';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProjectsYearViewProps {
  projects: Project[];
}

const MiniCalendar = ({ year, month, projects }: { year: number, month: number, projects: Project[] }) => {
  const monthName = new Date(year, month).toLocaleString('id-ID', { month: 'long' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const projectDates = new Set(
    projects
      .filter(p => p.startDate)
      .map(p => new Date(p.startDate!).toDateString())
  );

  const days = Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} />);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isToday = date.toDateString() === new Date().toDateString();
    const hasProject = projectDates.has(date.toDateString());

    days.push(
      <div
        key={day}
        className={cn(
          "flex items-center justify-center h-6 w-6 rounded-full text-xs",
          isToday && "bg-primary text-primary-foreground",
          hasProject && !isToday && "bg-accent text-accent-foreground",
        )}
      >
        {day}
      </div>
    );
  }

  return (
    <div className="p-3 border rounded-lg">
      <h3 className="font-semibold text-center mb-2">{monthName}</h3>
      <div className="grid grid-cols-7 gap-1 text-center text-muted-foreground text-xs">
        <div>Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div>
      </div>
      <div className="grid grid-cols-7 gap-1 mt-2">
        {days}
      </div>
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
          <MiniCalendar key={i} year={year} month={i} projects={projectsByMonth[i]} />
        ))}
      </div>
    </div>
  );
};

export default ProjectsYearView;