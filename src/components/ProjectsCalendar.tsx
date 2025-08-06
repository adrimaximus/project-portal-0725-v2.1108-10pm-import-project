import { Calendar, momentLocalizer, EventProps } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Project } from '@/data/projects';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: Project;
}

const getStatusColorClass = (status: Project['status']) => {
  switch (status) {
    case 'On Track':
    case 'Completed':
    case 'Done':
    case 'Billed':
      return 'bg-green-500 hover:bg-green-600';
    case 'At Risk':
    case 'On Hold':
      return 'bg-yellow-500 hover:bg-yellow-600';
    case 'Off Track':
    case 'Cancelled':
      return 'bg-red-500 hover:bg-red-600';
    case 'In Progress':
    case 'Requested':
      return 'bg-blue-500 hover:bg-blue-600';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
};

const CustomEvent = ({ event }: EventProps<CalendarEvent>) => {
  return (
    <div className={cn("text-white p-1 rounded-md text-xs h-full w-full truncate cursor-pointer", getStatusColorClass(event.resource.status))}>
      {event.title}
    </div>
  );
};

interface ProjectsCalendarProps {
  projects: Project[];
}

const ProjectsCalendar = ({ projects }: ProjectsCalendarProps) => {
  const navigate = useNavigate();

  const events: CalendarEvent[] = projects.map((project, index) => {
    // CATATAN: Proyek Anda tidak memiliki tanggal mulai/selesai.
    // Tanggal placeholder digunakan di sini.
    const duration = project.name.length % 5 + 2; // Durasi 2-6 hari
    const startDate = moment().add(index * 2, 'days').startOf('day').toDate();
    const endDate = moment(startDate).add(duration, 'days').endOf('day').toDate();

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
      />
    </div>
  );
};

export default ProjectsCalendar;