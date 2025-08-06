import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Project } from '@/data/projects';

const localizer = momentLocalizer(moment);

interface ProjectsCalendarProps {
  projects: Project[];
}

const ProjectsCalendar = ({ projects }: ProjectsCalendarProps) => {
  const events = projects.map((project, index) => {
    // CATATAN: Proyek Anda tidak memiliki tanggal mulai/selesai.
    // Tanggal placeholder digunakan di sini.
    // Anda mungkin ingin menambahkan data tanggal ke proyek Anda.
    const startDate = moment().add(index * 2, 'days').toDate();
    const endDate = moment(startDate).add(3, 'days').toDate();

    return {
      title: project.name,
      start: startDate,
      end: endDate,
      allDay: true,
      resource: project,
    };
  });

  return (
    <div className="h-[70vh]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
      />
    </div>
  );
};

export default ProjectsCalendar;