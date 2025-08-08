import { useMemo } from "react";
import { Link } from "react-router-dom";
import FullCalendar from '@fullcalendar/react';
import multiMonthPlugin from '@fullcalendar/multimonth';
import interactionPlugin from '@fullcalendar/interaction';
import idLocale from '@fullcalendar/core/locales/id';
import { EventContentArg } from '@fullcalendar/core';
import { Project } from "@/data/projects";
import { getStatusColor } from "@/lib/statusUtils";

interface ProjectsYearViewProps {
  projects: Project[];
  refreshKey?: number;
}

const ProjectsYearView = ({ projects }: ProjectsYearViewProps) => {
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
    // Di tampilan tahun, kita hanya menampilkan titik untuk menjaga kebersihan
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'white' }}></div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
       <style>{`
        .fc-event { cursor: pointer; border-width: 0px !important; }
        .fc-multimonth-daygrid-day.fc-day-today { background-color: rgba(59, 130, 246, 0.1); }
        .fc-toolbar-title { font-size: 1.25rem; font-weight: 600; }
        .fc .fc-button { background-color: #f4f4f5; border-color: #e4e4e7; color: #18181b; }
        .fc .fc-button:hover { background-color: #e4e4e7; }
        .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active { background-color: #3b82f6; border-color: #3b82f6; color: white; }
        .fc-multimonth-title { text-align: center; font-weight: 600; margin-top: 1em; margin-bottom: 0.5em; }
      `}</style>
      <FullCalendar
        plugins={[multiMonthPlugin, interactionPlugin]}
        initialView="multiMonthYear"
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
        multiMonthMaxColumns={3}
        eventDisplay="background" // Menampilkan acara sebagai latar belakang berwarna
      />
    </div>
  );
};

export default ProjectsYearView;