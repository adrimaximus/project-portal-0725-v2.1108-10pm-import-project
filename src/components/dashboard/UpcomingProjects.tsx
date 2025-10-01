import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { differenceInDays, format, isToday, isTomorrow } from 'date-fns';
import { Calendar } from 'lucide-react';

interface UpcomingProjectsProps {
  projects: Project[];
}

const UpcomingProjects = ({ projects }: UpcomingProjectsProps) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextSevenDays = new Date();
  nextSevenDays.setDate(today.getDate() + 7);
  nextSevenDays.setHours(23, 59, 59, 999);

  const upcoming = projects
    .filter(p => {
      if (!p.start_date) return false;
      const startDate = new Date(p.start_date);
      return startDate >= today && startDate <= nextSevenDays;
    })
    .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime());

  const getRelativeDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    const daysUntil = differenceInDays(date, today);
    if (daysUntil > 1 && daysUntil <= 7) {
      return `in ${daysUntil} days`;
    }
    return format(date, 'd MMM');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming in the Next 7 Days
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length > 0 ? (
          <ul className="space-y-3">
            {upcoming.map(project => (
              <li key={project.id}>
                <Link to={`/projects/${project.slug}`} className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors">
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">{project.category}</p>
                  </div>
                  <p className="text-sm font-semibold text-primary">
                    {getRelativeDate(new Date(project.start_date!))}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming projects in the next 7 days.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingProjects;