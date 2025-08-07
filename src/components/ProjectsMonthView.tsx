import { Project } from '@/data/projects';
import { GoogleCalendarEvent } from '@/data/google-calendar';
import { useState, useMemo, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/id';
import { gapi } from 'gapi-script';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { startOfMonth, endOfMonth } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('id');
const localizer = momentLocalizer(moment);

const getEventStyle = (event: any) => {
  let backgroundColor = '#9ca3af'; // default gray
  if (event.resource.isGoogleEvent) {
    backgroundColor = '#8b5cf6'; // purple for gcal
  } else {
    const status = (event.resource as Project).status;
    switch (status) {
      case 'On Track': case 'Completed': case 'Done': case 'Billed': backgroundColor = '#22c55e'; break;
      case 'At Risk': case 'On Hold': backgroundColor = '#eab308'; break;
      case 'Off Track': case 'Cancelled': backgroundColor = '#ef4444'; break;
      case 'In Progress': case 'Requested': backgroundColor = '#3b82f6'; break;
    }
  }

  const style = {
    backgroundColor,
    borderRadius: '4px',
    opacity: 0.9,
    color: 'white',
    border: '0px',
    display: 'block',
  };
  return {
    style: style,
  };
};

interface ProjectsMonthViewProps {
  projects: Project[];
}

const ProjectsMonthView = ({ projects }: ProjectsMonthViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [gcalEvents, setGcalEvents] = useState<GoogleCalendarEvent[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGcalEvents = async () => {
      const gcalConnected = localStorage.getItem('gcal_connected') === 'true';
      const accessToken = localStorage.getItem('gcal_access_token');
      const clientId = localStorage.getItem('gcal_clientId');

      if (!gcalConnected || !accessToken || !clientId) {
        setGcalEvents([]);
        return;
      }

      try {
        await new Promise<void>((resolve) => gapi.load('client', resolve));
        await gapi.client.init({
          clientId: clientId,
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
        });
        
        gapi.client.setToken({ access_token: accessToken });

        const response = await gapi.client.calendar.events.list({
          'calendarId': 'primary',
          'timeMin': startOfMonth(currentDate).toISOString(),
          'timeMax': endOfMonth(currentDate).toISOString(),
          'showDeleted': false,
          'singleEvents': true,
          'maxResults': 50,
          'orderBy': 'startTime'
        });

        const events: GoogleCalendarEvent[] = response.result.items.map((item: any) => ({
          id: item.id,
          summary: item.summary,
          description: item.description,
          start: { 
            dateTime: item.start.dateTime || item.start.date, 
            timeZone: item.start.timeZone 
          },
          end: { 
            dateTime: item.end.dateTime || item.end.date, 
            timeZone: item.end.timeZone 
          },
          attendees: item.attendees,
          creator: item.creator,
          isGoogleEvent: true,
        }));
        setGcalEvents(events);
      } catch (error: any) {
        console.error("Error fetching Google Calendar events:", error);
        if (error.result?.error?.code === 401 || error.result?.error?.code === 403) {
          localStorage.removeItem('gcal_connected');
          localStorage.removeItem('gcal_access_token');
          toast.error("Sesi Google berakhir. Silakan hubungkan kembali di pengaturan.");
        }
      }
    };

    fetchGcalEvents();
  }, [currentDate]);

  const allEvents = useMemo(() => {
    const projectEvents = projects
      .filter(p => p.startDate && p.dueDate)
      .map(p => ({
        title: p.name,
        start: new Date(p.startDate!),
        end: new Date(p.dueDate!),
        allDay: true,
        resource: p,
      }));

    const calendarEvents = gcalEvents.map(e => ({
      title: e.summary,
      start: new Date(e.start.dateTime),
      end: new Date(e.end.dateTime),
      allDay: !e.start.dateTime.includes('T'),
      resource: e,
    }));

    return [...projectEvents, ...calendarEvents];
  }, [projects, gcalEvents]);

  const handleSelectEvent = (event: any) => {
    if (!event.resource.isGoogleEvent) {
      navigate(`/projects/${event.resource.id}`);
    }
  };

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  return (
    <div className="h-[85vh]">
      <Calendar
        localizer={localizer}
        events={allEvents}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views.MONTH}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        eventPropGetter={getEventStyle}
        onSelectEvent={handleSelectEvent}
        onNavigate={handleNavigate}
        date={currentDate}
        messages={{
          next: "Berikutnya",
          previous: "Sebelumnya",
          today: "Hari Ini",
          month: "Bulan",
          week: "Minggu",
          day: "Hari",
          agenda: "Agenda",
          date: "Tanggal",
          time: "Waktu",
          event: "Acara",
          noEventsInRange: "Tidak ada acara dalam rentang ini.",
          showMore: total => `+${total} lainnya`
        }}
      />
    </div>
  );
};

export default ProjectsMonthView;