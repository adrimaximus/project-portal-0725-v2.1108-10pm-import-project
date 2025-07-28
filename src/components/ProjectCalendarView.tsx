import React, { useState } from 'react';
import { Project } from '@/data/projects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { DayContent, DayContentProps } from 'react-day-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, isWithinInterval, parseISO, isSameMonth } from 'date-fns';

const ProjectBadge = ({ project }: { project: Project }) => (
  <TooltipProvider delayDuration={0}>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 bg-primary/10 text-primary-foreground px-1.5 py-0.5 rounded-md w-full overflow-hidden my-0.5">
          <Avatar className="h-4 w-4">
            <AvatarImage src={project.createdBy.avatar} alt={project.createdBy.name} />
            <AvatarFallback className="text-xs">{project.createdBy.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-primary truncate">{project.name}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{project.name}</p>
        <p className="text-xs text-muted-foreground">
          {format(parseISO(project.startDate), 'dd MMM')} - {format(parseISO(project.deadline), 'dd MMM')}
        </p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const createDayContentWithProjects = (projects: Project[]) => {
  const DayContentWithProjects = (props: DayContentProps) => {
    const { date, displayMonth } = props;

    const projectsOnThisDay = projects?.filter(p => 
      isWithinInterval(date, { start: parseISO(p.startDate), end: parseISO(p.deadline) })
    ) || [];

    return (
      <div className="relative h-full w-full flex items-start justify-center">
        <DayContent {...props} />
        {isSameMonth(date, displayMonth) && projectsOnThisDay.length > 0 && (
          <div className="absolute top-7 left-0 right-0 px-0.5 z-10 flex flex-col">
            {projectsOnThisDay.slice(0, 2).map(project => (
              <ProjectBadge key={project.id} project={project} />
            ))}
            {projectsOnThisDay.length > 2 && (
               <div className="text-xs text-center text-muted-foreground mt-1">
                  +{projectsOnThisDay.length - 2} more
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  return DayContentWithProjects;
};

interface ProjectCalendarViewProps {
  projects: Project[];
}

const ProjectCalendarView = ({ projects }: ProjectCalendarViewProps) => {
  const [month, setMonth] = useState(new Date());

  const DayContentWithProjects = createDayContentWithProjects(projects);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{format(month, 'MMMM yyyy')}</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonth(subMonths(month, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          month={month}
          onMonthChange={setMonth}
          components={{ DayContent: DayContentWithProjects }}
          className="p-0"
          classNames={{
            day: 'h-24 w-full align-top p-2 relative',
            day_today: 'bg-accent text-accent-foreground',
            head_cell: 'w-full',
          }}
        />
      </CardContent>
    </Card>
  );
};

export default ProjectCalendarView;