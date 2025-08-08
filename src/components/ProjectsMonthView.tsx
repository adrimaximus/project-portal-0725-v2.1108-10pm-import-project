import { useMemo } from "react";
import { Link } from "react-router-dom";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import idLocale from '@fullcalendar/core/locales/id';
import { EventContentArg } from '@fullcalendar/core';
import { Project } from "@/data/projects";
import { getStatusColor } from "@/lib/statusUtils";

interface ProjectsMonthViewProps {
  projects: Project[];
  refreshKey?: number;
}

const ProjectsMonthView = ({ projects }: ProjectsMonthViewProps) => {
  const calendarEvents = useMemo(() => projects
    .filter(p => p.dueDate) // Hanya tampilkan proyek yang memiliki tanggal jatuh tempo
    .map(project => ({
      id: project.id,
      title: project.name,
      start: project.startDate || project.dueDate, // Gunakan tanggal mulai jika ada, jika tidak, gunakan tanggal jatuh tempo
      end: project.dueDate,
      allDay: true,
      extendedProps: {
        status: project.status,
        id: project.id
      },
      backgroundColor: getStatusColor(project.status),
      borderColor: getStatusColor(project.status),
    })), [projects]);

  const renderEventContent = (eventInfo: EventContentArg) => {
    return (
      <Link to={`/projects/${eventInfo.event.extendedProps.id}`} className="fc-event-main-frame w-full h-full block text-white p-1 overflow-hidden">
        <div className="fc-event-title fc-sticky">{eventInfo.event.title}</div>
      </Link>
    );
  };

  return (
    <div className="calendar-container">
      <style>{`
        .fc-event { cursor: pointer; border-width: 1px; }
        .fc-daygrid-day.fc-day-today { background-color: rgba(59, 130, 246, 0.1); }
        .fc-toolbar-title { font-size: 1.25rem; font-weight: 600; }
        .fc .fc-button { background-color: #f4f4f5; border-color: #e4e4e7; color: #18181b; }
        .fc .fc-button:hover { background-color: #e4e4e7; }
        .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active { background-color: #3b82f6; border-color: #3b82f6; color: white; }
      `}</style>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: ''
        }}
        events={calendarEvents}
        eventContent={renderEventContent}
        locale={idLocale}
        buttonText={{ today: 'Hari Ini' }}
        height="auto"
      />
    </div>
  );
};

export default ProjectsMonthView;