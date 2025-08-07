import { Project } from '@/data/projects';
import { GoogleCalendarEvent } from '@/data/google-calendar';
import { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  parseISO, 
  addMonths, 
  subMonths, 
  isToday,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  differenceInDays,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
  addDays
} from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { gapi } from 'gapi-script';
import { toast } from 'sonner';

type CalendarItem = (Project | GoogleCalendarEvent) & { lane?: number };

const getProjectColorClasses = (item: CalendarItem): string => {
  if ('isGoogleEvent' in item && item.isGoogleEvent) {
    return 'bg-purple-100 border-l-purple-500 text-purple-800 dark:bg-purple-900/30 dark:border-l-purple-500 dark:text-purple-200';
  }
  const status = (item as Project).status;
  switch (status) {
    case 'On Track': case 'Completed': case 'Done': case 'Billed': return 'bg-green-100 border-l-green-500 text-green-800 dark:bg-green-900/30 dark:border-l-green-500 dark:text-green-200';
    case 'At Risk': case 'On Hold': return 'bg-yellow-100 border-l-yellow-500 text-yellow-800 dark:bg-yellow-900/30 dark:border-l-yellow-500 dark:text-yellow-200';
    case 'Off Track': case 'Cancelled': return 'bg-red-100 border-l-red-500 text-red-800 dark:bg-red-900/30 dark:border-l-red-500 dark:text-red-200';
    case 'In Progress': case 'Requested': return 'bg-blue-100 border-l-blue-500 text-blue-800 dark:bg-blue-900/30 dark:border-l-blue-500 dark:text-blue-200';
    default: return 'bg-gray-100 border-l-gray-500 text-gray-800 dark:bg-gray-900/30 dark:border-l-gray-500 dark:text-gray-200';
  }
};

interface ProjectsMonthViewProps {
  projects: Project[];
}

const MAX_VISIBLE_LANES = 2;

const ProjectsMonthView = ({ projects }: ProjectsMonthViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isGcalConnected, setIsGcalConnected] = useState(false);
  const [gcalEvents, setGcalEvents] = useState<GoogleCalendarEvent[]>([]);

  useEffect(() => {
    const initGapiAndFetchEvents = async () => {
      const gcalConnected = localStorage.getItem('gcal_connected') === 'true';
      const accessToken = localStorage.getItem('gcal_access_token');
      const clientId = localStorage.getItem('gcal_clientId');

      if (gcalConnected && accessToken && clientId) {
        setIsGcalConnected(true);
        
        try {
          await new Promise<void>((resolve) => gapi.load('client', resolve));
          await gapi.client.init({
            apiKey: undefined, // We use OAuth token, not API key
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
              timeZone: item.start.timeZone || 'UTC',
            },
            end: {
              dateTime: item.end.dateTime || item.end.date,
              timeZone: item.end.timeZone || 'UTC',
            },
            creator: { email: item.creator?.email || 'Unknown' },
            attendees: item.attendees,
            isGoogleEvent: true,
          }));
          setGcalEvents(events);
        } catch (error: any) {
          console.error("Error fetching Google Calendar events:", error);
          if (error.result?.error?.code === 401 || error.result?.error?.code === 403) {
            localStorage.removeItem('gcal_connected');
            localStorage.removeItem('gcal_access_token');
            setIsGcalConnected(false);
            setGcalEvents([]);
            toast.error("Google session expired. Please reconnect in settings.");
          }
        }
      } else {
        setIsGcalConnected(false);
        setGcalEvents([]);
      }
    };

    initGapiAndFetchEvents();
  }, [currentDate]);

  const { weeks, weeklyLayouts, moreByDay } = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(endOfMonth(currentDate));
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    const combinedItems: CalendarItem[] = [...projects, ...gcalEvents];

    const activeItems = combinedItems
        .filter(p => {
            const startDate = 'isGoogleEvent' in p ? p.start.dateTime : p.startDate;
            const dueDate = 'isGoogleEvent' in p ? p.end.dateTime : p.dueDate;
            if (!startDate || !dueDate) return false;
            const projectStart = startOfDay(parseISO(startDate));
            const projectEnd = endOfDay(parseISO(dueDate));
            return projectStart <= calendarEnd && projectEnd >= calendarStart;
        })
        .sort((a, b) => {
            const startA = startOfDay(parseISO('isGoogleEvent' in a ? a.start.dateTime : a.startDate!));
            const startB = startOfDay(parseISO('isGoogleEvent' in b ? b.start.dateTime : b.startDate!));
            const durationA = differenceInDays(parseISO('isGoogleEvent' in a ? a.end.dateTime : a.dueDate!), startA);
            const durationB = differenceInDays(parseISO('isGoogleEvent' in b ? b.end.dateTime : b.dueDate!), startB);
            if (durationA !== durationB) return durationB - durationA;
            return startA.getTime() - startB.getTime();
        });

    const laneMatrix: (string | null)[][] = Array.from({ length: 10 }, () => Array(days.length).fill(null));

    for (const item of activeItems) {
        const startDate = 'isGoogleEvent' in item ? item.start.dateTime : item.startDate!;
        const dueDate = 'isGoogleEvent' in item ? item.end.dateTime : item.dueDate!;
        const projectStart = startOfDay(parseISO(startDate));
        const projectEnd = endOfDay(parseISO(dueDate));

        const startIndex = Math.max(0, differenceInDays(projectStart, calendarStart));
        const endIndex = Math.min(days.length - 1, differenceInDays(projectEnd, calendarStart));

        let assignedLane = -1;
        for (let l = 0; l < laneMatrix.length; l++) {
            let isLaneFree = true;
            for (let d = startIndex; d <= endIndex; d++) {
                if (d < laneMatrix[l].length && laneMatrix[l][d]) {
                    isLaneFree = false;
                    break;
                }
            }
            if (isLaneFree) {
                assignedLane = l;
                break;
            }
        }

        if (assignedLane !== -1) {
            for (let d = startIndex; d <= endIndex; d++) {
                if (d < laneMatrix[assignedLane].length) {
                    laneMatrix[assignedLane][d] = item.id;
                }
            }
            item.lane = assignedLane;
        }
    }

    const weeklyLayouts = weeks.map(() => []);
    const processedInLayout = new Set<string>();

    activeItems.forEach(item => {
        if (item.lane === undefined || item.lane >= MAX_VISIBLE_LANES || processedInLayout.has(item.id)) {
            return;
        }
        processedInLayout.add(item.id);

        const startDate = 'isGoogleEvent' in item ? item.start.dateTime : item.startDate!;
        const dueDate = 'isGoogleEvent' in item ? item.end.dateTime : item.dueDate!;
        const projectStart = startOfDay(parseISO(startDate));
        const projectEnd = endOfDay(parseISO(dueDate));

        let currentDay = projectStart;
        while (isBefore(currentDay, projectEnd) || isSameDay(currentDay, projectEnd)) {
            if (isAfter(currentDay, calendarEnd)) break;
            
            let effectiveDay = isBefore(currentDay, calendarStart) ? calendarStart : currentDay;
            
            const weekIndex = Math.floor(differenceInDays(effectiveDay, calendarStart) / 7);
            if (weekIndex < 0 || weekIndex >= weeks.length) {
                currentDay = addDays(currentDay, 1);
                continue;
            };

            const week = weeks[weekIndex];
            const weekStart = week[0];
            const weekEnd = week[6];

            const segmentStart = effectiveDay;
            const segmentEnd = isBefore(projectEnd, weekEnd) ? projectEnd : weekEnd;
            
            const startCol = differenceInDays(segmentStart, weekStart) + 1;
            const span = differenceInDays(segmentEnd, segmentStart) + 1;

            if (span > 0) {
                (weeklyLayouts[weekIndex] as any[]).push({
                    item: item,
                    startCol,
                    span,
                    isStart: isSameDay(projectStart, segmentStart),
                    isEnd: isSameDay(projectEnd, segmentEnd)
                });
            }
            
            currentDay = startOfDay(addDays(segmentEnd, 1));
        }
    });

    const moreByDay = new Map<string, CalendarItem[]>();
    days.forEach(day => {
        const dayKey = format(day, 'yyyy-MM-dd');
        const hiddenItems = new Set<CalendarItem>();
        const globalDayIndex = differenceInDays(day, calendarStart);

        for (let laneIndex = MAX_VISIBLE_LANES; laneIndex < laneMatrix.length; laneIndex++) {
            const itemId = laneMatrix[laneIndex][globalDayIndex];
            if (itemId) {
                const item = activeItems.find(p => p.id === itemId);
                if (item) hiddenItems.add(item);
            }
        }
        if (hiddenItems.size > 0) {
            moreByDay.set(dayKey, Array.from(hiddenItems).sort((a,b) => a.lane! - b.lane!));
        }
    });

    return { weeks, weeklyLayouts, moreByDay };
  }, [projects, currentDate, gcalEvents]);

  const dayHeaders = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const renderItem = (item: CalendarItem, isStart: boolean, startCol: number) => {
    const name = 'name' in item ? item.name : item.summary;
    const assignedTo = 'assignedTo' in item ? item.assignedTo : [];

    const content = (
      <div className="flex items-center gap-2 truncate">
        {'isGoogleEvent' in item && item.isGoogleEvent && <Calendar className="h-3 w-3 flex-shrink-0" />}
        <div className="flex-1 truncate">
          <p className="font-semibold truncate">{name}</p>
        </div>
        <div className="flex -space-x-2">
          {assignedTo.slice(0, 2).map(user => (
            <Avatar key={user.id} className="h-4 w-4 border border-background">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-[8px]">{user.initials}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>
    );

    if ('isGoogleEvent' in item && item.isGoogleEvent) {
      return <div>{content}</div>;
    }
    
    return <Link to={`/projects/${item.id}`}>{content}</Link>;
  };

  return (
    <div className="flex flex-col h-[85vh]">
      <div className="flex items-center justify-between mb-4 px-1 flex-shrink-0">
        <h2 className="text-xl font-semibold capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: id })}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Hari Ini</Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-sm text-muted-foreground mb-2 px-1 flex-shrink-0">
        {dayHeaders.map(day => <div key={day}>{day}</div>)}
      </div>

      <div className="flex-grow relative grid grid-cols-1 auto-rows-fr border-t border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 relative">
            {week.map((day, dayIndex) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const hiddenItems = moreByDay.get(dayKey);
              return (
                <div key={day.toString()} className={cn("p-1.5 flex flex-col border-r border-gray-200 dark:border-gray-700", dayIndex === 6 && "border-r-0")}>
                  <span className={cn(
                    "self-end flex items-center justify-center h-6 w-6 rounded-full text-sm",
                    !isSameMonth(day, currentDate) && "text-muted-foreground/50",
                    isToday(day) && "bg-primary text-primary-foreground"
                  )}>
                    {format(day, 'd')}
                  </span>
                  <div className="flex-grow mt-1 pt-[5.5rem]">
                    {hiddenItems && (
                       <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" className="h-auto w-full justify-start p-1 text-xs text-primary hover:bg-primary/10">
                            + {hiddenItems.length} lainnya
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 z-50">
                          <div className="font-semibold text-sm mb-2 px-1">
                            Acara pada {format(day, 'd MMM', { locale: id })}
                          </div>
                          <ul className="space-y-1">
                            {hiddenItems.map(item => (
                              <li key={item.id}>
                                <div className={cn("block p-2 rounded-md border-l-4", getProjectColorClasses(item))}>
                                  {renderItem(item, true, 1)}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              )
            })}
            <div className="absolute inset-0 pointer-events-none">
              {(weeklyLayouts[weekIndex] as any[]).map(({ item, startCol, span, isStart, isEnd }) => (
                <div
                  key={item.id}
                  className={cn(
                    "absolute flex items-center p-1.5 text-xs border-l-4 pointer-events-auto",
                    getProjectColorClasses(item),
                    isStart ? "rounded-l-lg" : "",
                    isEnd ? "rounded-r-lg" : "",
                  )}
                  style={{
                    top: `calc(2.25rem + ${item.lane! * 2.75}rem)`,
                    left: `calc(${(startCol - 1) / 7 * 100}% + 2px)`,
                    width: `calc(${span / 7 * 100}% - 4px)`,
                    height: '2.5rem',
                  }}
                >
                  {(isStart || startCol === 1) && renderItem(item, isStart, startCol)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsMonthView;