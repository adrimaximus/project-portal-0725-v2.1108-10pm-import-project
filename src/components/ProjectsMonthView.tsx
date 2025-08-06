import { Calendar, momentLocalizer, EventProps } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './ProjectsMonthView.css'; // Custom styles
import { Project } from '@/data/projects';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: Project;
}

const getStatusProgressClass = (status: Project['status']) => {
  switch (status) {
    case 'On Track':
    case 'Completed':
    case 'Done':
    case 'Billed':
      return '[&>div]:bg-green-500';
    case 'At Risk':
    case 'On Hold':
      return '[&>div]:bg-yellow-500';
    case 'Off Track':
    case 'Cancelled':
      return '[&>div]:bg-red-500';
    case 'In Progress':
    case 'Requested':
      return '[&>div]:bg-blue-500';
    default:
      return '[&>div]:bg-gray-500';
  }
};

const CustomEvent = ({ event }: EventProps<CalendarEvent>) => {
  const project = event.resource;

  return (
    <div className="bg-background rounded-md shadow-sm h-full w-full flex flex-col justify-between cursor-pointer border border-border/60 hover:border-primary/50 transition-all p-2">
      <div className="flex flex-col justify-between h-full">
        <div>
          <Progress value={project.progress} className={cn("h-1 mb-1.5", getStatusProgressClass(project.status))} />
          <p className="text-xs font-medium text-foreground leading-tight truncate">{project.name}</p>
        </div>
        <div className="flex -space-x-2 justify-end mt-1">
          {project.assignedTo.slice(0, 3).map((user) => (
            <Avatar key={user.id} className="h-5 w-5 border-2 border-background">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.initials}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>
    </div>
  );
};

interface ProjectsMonthViewProps {
  projects: Project[];
}

const ProjectsMonthView = ({ projects }: ProjectsMonthViewProps) => {
  const navigate = useNavigate();

  const events: CalendarEvent[] = projects
    .filter(p => p.startDate && p.dueDate)
    .map((project) => {
      const startDate = moment(project.startDate).startOf('day').toDate();
      const endDate = moment(project.dueDate).endOf('day').toDate();

      return {
        title: project.name,
        start: startDate,
        end: endDate,
        allDay: true,
        resource: project,
      };
    });

  const handleSelectEvent = (event: CalendarEvent) => {
    navigate(`/projects/${event.resource.id}`);
  };

  return (
    <div className="h-[70vh]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectEvent={handleSelectEvent}
        components={{
          event: CustomEvent,
        }}
        eventPropGetter={() => ({
          className: 'rbc-event-custom'
        })}
        views={['month']}
        defaultView="month"
      />
    </div>
  );
};

export default ProjectsMonthView;