import { Project } from '@/data/projects';
import { GoogleCalendarEvent } from '@/types';
import { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, parseISO, isAfter, startOfDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { gapi } from 'gapi-script';
import { toast } from 'sonner';

interface ProjectsYearViewProps {
  projects: Project[];
}

type CalendarItem = Project | (GoogleCalendarEvent & { isGoogleEvent: true });

function isGCalEvent(item: CalendarItem): item is GoogleCalendarEvent & { isGoogleEvent: true } {
    return 'isGoogleEvent' in item && item.isGoogleEvent === true;
}

const getStatusColor = (item: CalendarItem): string => {
  if (isGCalEvent(item)) {
    return '#8b5cf6'; // purple-500 for Google Calendar events
  } else {
    switch (item.status) {
      case 'On Track': case 'Completed': case 'Done': case 'Billed': return '#22c55e';
      case 'At Risk': case 'On Hold': return '#eab308';
      case 'Off Track': case 'Cancelled': return '#ef4444';
      case 'In Progress': case 'Requested': return '#3b82f6';
      default: return '#9ca3af';
    }
  }
};

const getPriorityStatusColor = (items: CalendarItem[]): string => {
    const hasGcalEvent = items.some(item => isGCalEvent(item));
    if (hasGcalEvent) {
        return '#8b5cf6'; // purple-500
    }

    const projects = items.filter(item => !isGCalEvent(item)) as Project[];
    const statuses = projects.map(p => p.status);
    if (statuses.includes('Off Track') || statuses.includes('Cancelled')) return getStatusColor({ status: 'Off Track' } as Project);
    if (statuses.includes('At Risk') || statuses.includes('On Hold')) return getStatusColor({ status: 'At Risk' } as Project);
    if (statuses.includes('In Progress') || statuses.includes('Requested')) return getStatusColor({ status: 'In Progress' } as Project);
    if (statuses.includes('On Track') || statuses.includes('Completed') || statuses.includes('Done') || statuses.includes('Billed')) return getStatusColor({ status: 'On Track' } as Project);
    return getStatusColor(items[0]);
};

const MonthCalendarCard = ({ month, year, items }: { month: number, year: number, items: CalendarItem[] }) => {
    const monthName = new Date(year, month).toLocaleString('id-ID', { month: 'long' });
    const monthStart = startOfMonth(new Date(year, month));
    const monthEnd = endOfMonth(monthStart);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const today = startOfDay(new Date());

    const itemsByDay: Map<string, CalendarItem[]> = new Map();
    daysInMonth.forEach(day => {
        const itemsOnDay = items.filter(p => {
            const startDate = isGCalEvent(p) ? p.start.dateTime : p.startDate;
            const dueDate = isGCalEvent(p) ? p.end.dateTime : p.dueDate;
            if (!startDate || !dueDate) return false;
            const itemStart = parseISO(startDate);
            const itemEnd = parseISO(dueDate);
            return isWithinInterval(day, { start: itemStart, end: itemEnd });
        });
        if (itemsOnDay.length > 0) {
            itemsByDay.set(format(day, 'yyyy-MM-dd'), itemsOnDay);
        }
    });

    const firstDayOfMonth = getDay(monthStart); // Sunday is 0

    const renderItemTooltipContent = (item: CalendarItem) => {
        const isGcal = isGCalEvent(item);
        const name = isGcal ? item.summary : item.name;
        const assignedTo = !isGcal ? item.assignedTo : [];

        const content = (
            <div className="block p-2 -m-2 rounded-md hover:bg-accent">
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: getStatusColor(item) }} />
                    <span className="text-xs font-medium truncate">{name}</span>
                </div>
                {assignedTo.length > 0 && (
                    <div className="flex items-center gap-1 pl-4">
                        {assignedTo.map((c: any) => (
                            <TooltipProvider key={c.id} delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Avatar className="h-5 w-5 border">
                                            <AvatarImage src={c.avatar} alt={c.name} />
                                            <AvatarFallback className="text-[8px]">{c.initials}</AvatarFallback>
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{c.name}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>
                )}
            </div>
        );

        return (
            <li key={item.id}>
                {isGcal ? (
                    <a href={item.htmlLink} target="_blank" rel="noopener noreferrer">{content}</a>
                ) : (
                    <Link to={`/projects/${item.id}`}>{content}</Link>
                )}
            </li>
        );
    };

    return (
        <div className="p-3 border rounded-lg">
            <h3 className="font-semibold mb-3 text-center">{monthName}</h3>
            <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                {daysInMonth.map(day => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const itemsOnDay = itemsByDay.get(dayStr);
                    const hasItem = itemsOnDay && itemsOnDay.length > 0;
                    const isFutureDay = isAfter(day, today);

                    const style: React.CSSProperties = {};
                    let classes = "w-full h-3 rounded-sm transition-colors";

                    if (isFutureDay) {
                        style.backgroundColor = 'hsl(var(--muted))';
                        style.opacity = 0.5;
                    } else if (hasItem) {
                        style.backgroundColor = getPriorityStatusColor(itemsOnDay!);
                    } else {
                        style.backgroundColor = 'transparent';
                        style.border = `1px solid hsl(var(--border))`;
                        classes += ' box-border';
                    }

                    return (
                        <TooltipProvider key={dayStr} delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className={classes} style={style} />
                                </TooltipTrigger>
                                <TooltipContent className="p-0" onMouseDown={(e) => e.stopPropagation()}>
                                    <div className="p-2">
                                        <p className="font-semibold">{format(day, 'PPP')}</p>
                                        {hasItem ? (
                                            <ul className="mt-1 space-y-1">
                                                {itemsOnDay!.map(renderItemTooltipContent)}
                                            </ul>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">Tidak ada proyek</p>
                                        )}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                })}
            </div>
        </div>
    );
};

const ProjectsYearView = ({ projects }: ProjectsYearViewProps) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [gcalEvents, setGcalEvents] = useState<GoogleCalendarEvent[]>([]);

  useEffect(() => {
    const initGapiAndFetchEvents = async () => {
      const gcalConnected = localStorage.getItem('gcal_connected') === 'true';
      const accessToken = localStorage.getItem('gcal_access_token');
      const clientId = localStorage.getItem('gcal_clientId');
      const storedIds = localStorage.getItem('gcal_calendar_ids');
      
      let calendarIds: string[] = ['primary'];
      if (storedIds) {
        try {
          const parsedIds = JSON.parse(storedIds);
          if (Array.isArray(parsedIds) && parsedIds.length > 0) {
            calendarIds = parsedIds;
          }
        } catch (e) { console.error("Failed to parse calendar IDs", e); }
      }

      if (gcalConnected && accessToken && clientId) {
        try {
          await new Promise<void>((resolve) => gapi.load('client', resolve));
          await gapi.client.init({
            apiKey: undefined,
            clientId: clientId,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
          });
          
          gapi.client.setToken({ access_token: accessToken });

          const requests = calendarIds.map(calendarId => 
            gapi.client.calendar.events.list({
              'calendarId': calendarId,
              'timeMin': new Date(year, 0, 1).toISOString(),
              'timeMax': new Date(year, 11, 31, 23, 59, 59).toISOString(),
              'showDeleted': false,
              'singleEvents': true,
              'maxResults': 250,
              'orderBy': 'startTime'
            })
          );

          const responses = await Promise.all(requests);
          const allEvents = responses.flatMap(response => response.result.items);

          const events: GoogleCalendarEvent[] = allEvents.map((item: any) => ({
            id: item.id,
            summary: item.summary,
            start: { dateTime: item.start.dateTime || item.start.date, date: item.start.date },
            end: { dateTime: item.end.dateTime || item.end.date, date: item.end.date },
            htmlLink: item.htmlLink,
          }));
          setGcalEvents(events);
        } catch (error: any) {
          console.error("Error fetching Google Calendar events:", error);
          if (error.result?.error?.code === 401 || error.result?.error?.code === 403) {
            localStorage.removeItem('gcal_connected');
            localStorage.removeItem('gcal_access_token');
            setGcalEvents([]);
            toast.error("Google session expired. Please reconnect in settings.");
          }
        }
      } else {
        setGcalEvents([]);
      }
    };
    initGapiAndFetchEvents();
  }, [year]);

  const combinedItems: CalendarItem[] = useMemo(() => [
    ...projects, 
    ...gcalEvents.map(e => ({ ...e, isGoogleEvent: true as const }))
  ], [projects, gcalEvents]);

  const itemsForYear = combinedItems.filter(p => {
    const startDate = isGCalEvent(p) ? p.start.dateTime : p.startDate;
    const dueDate = isGCalEvent(p) ? p.end.dateTime : p.dueDate;
    if (!startDate || !dueDate) return false;
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);
    const itemStart = parseISO(startDate);
    const itemEnd = parseISO(dueDate);
    return itemStart <= yearEnd && itemEnd >= yearStart;
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
          <MonthCalendarCard key={i} year={year} month={i} items={itemsForYear} />
        ))}
      </div>
    </div>
  );
};

export default ProjectsYearView;