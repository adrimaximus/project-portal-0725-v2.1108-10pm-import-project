import { Project } from '@/types';
import { GoogleCalendarEvent } from '@/types';
import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  format,
  isSameDay,
  getDay,
  isToday,
  addMonths,
  subMonths,
  isSameMonth,
} from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, getStatusStyles } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

type CombinedItem = Project | GoogleCalendarEvent;

const isGCalEvent = (item: CombinedItem): item is GoogleCalendarEvent => {
  return 'summary' in item;
};

const getItemColor = (item: CombinedItem): string => {
  if (isGCalEvent(item)) {
    return '#f97316'; // Orange for Google Calendar events
  } else {
    return getStatusStyles(item.status).hex;
  }
};

const MobileMonthView = ({ projects, gcalEvents, currentMonth }: { projects: Project[], gcalEvents: GoogleCalendarEvent[], currentMonth: Date }) => {
    const navigate = useNavigate();
    const combinedItems: CombinedItem[] = useMemo(() => [...projects, ...gcalEvents], [projects, gcalEvents]);

    const itemsInMonth = useMemo(() => combinedItems.filter(p => {
        const startDate = isGCalEvent(p) ? (p.start.dateTime || p.start.date) : p.start_date;
        if (!startDate) return false;
        return isSameMonth(new Date(startDate), currentMonth);
    }), [combinedItems, currentMonth]);

    const sortedItems = itemsInMonth.sort((a, b) => {
        const aStart = new Date(isGCalEvent(a) ? (a.start.dateTime || a.start.date!) : a.start_date);
        const bStart = new Date(isGCalEvent(b) ? (b.start.dateTime || b.start.date!) : b.start_date);
        return aStart.getTime() - bStart.getTime();
    });

    const groupedByDay = sortedItems.reduce((acc, project) => {
        const startDateStr = isGCalEvent(project) ? (project.start.dateTime || project.start.date) : project.start_date;
        if (!startDateStr) return acc;
        
        // Correctly format the date to avoid timezone shifts
        const dateKey = format(new Date(startDateStr), 'yyyy-MM-dd');

        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(project);
        return acc;
    }, {} as Record<string, CombinedItem[]>);

    if (sortedItems.length === 0) {
        return (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
                Tidak ada proyek yang dijadwalkan untuk bulan ini.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {Object.entries(groupedByDay).map(([dateStr, itemsOnDay]) => {
                // Parse the date string as local date to avoid timezone shifts
                const [year, month, day] = dateStr.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                
                const { day: dayOfWeek, dayOfMonth } = {
                    day: date.toLocaleDateString('id-ID', { weekday: 'short' }),
                    dayOfMonth: date.getDate().toString().padStart(2, '0')
                };

                return (
                    <div key={dateStr} className="flex items-start space-x-4">
                        <div className="flex flex-col items-center w-12 text-center flex-shrink-0">
                            <span className="text-sm text-muted-foreground">{dayOfWeek}</span>
                            <span className="text-xl font-bold text-primary">{dayOfMonth}</span>
                        </div>
                        <div className="flex-1 space-y-2 pt-1 min-w-0">
                            {itemsOnDay.map((item, index) => {
                                const isGcal = isGCalEvent(item);
                                const name = isGcal ? item.summary : item.name;
                                const assignedTo = !isGcal ? (item as Project).assignedTo : [];

                                const itemContent = (
                                    <div
                                        className="bg-card border border-l-4 rounded-md p-2 flex items-center justify-between hover:shadow-sm transition-shadow group"
                                        style={{ borderLeftColor: getItemColor(item) }}
                                    >
                                        <div className="flex-1 font-medium text-sm min-w-0 truncate" title={name}>{name}</div>
                                        <div className="flex items-center -space-x-2 flex-shrink-0 pl-2">
                                            {assignedTo.slice(0, 2).map((user) => (
                                                <Avatar key={user.id} className="h-6 w-6 border-2 border-card">
                                                    <AvatarImage src={user.avatar} alt={user.name} />
                                                    <AvatarFallback>{user.initials}</AvatarFallback>
                                                </Avatar>
                                            ))}
                                        </div>
                                    </div>
                                );

                                return isGcal ? (
                                    <a key={item.id} href={item.htmlLink} target="_blank" rel="noopener noreferrer">{itemContent}</a>
                                ) : (
                                    <Link to={`/projects/${(item as Project).slug}`} key={(item as Project).id}>{itemContent}</Link>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const MonthView = ({ projects, gcalEvents }: { projects: Project[], gcalEvents: GoogleCalendarEvent[] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const isMobile = useIsMobile();

  const combinedItems: CombinedItem[] = useMemo(() => [...projects, ...gcalEvents], [projects, gcalEvents]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });
  const firstDayOfMonth = (getDay(startOfMonth(currentMonth)) + 6) % 7; // Monday is 0

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CombinedItem[]>();
    daysInMonth.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const itemsOnDay = combinedItems.filter(p => {
        const startDate = isGCalEvent(p) ? (p.start.dateTime || p.start.date) : p.start_date;
        const dueDate = isGCalEvent(p) ? (p.end.dateTime || p.end.date) : p.due_date;
        if (!startDate) return false;
        const start = new Date(startDate);
        const end = dueDate ? new Date(dueDate) : start;
        return day >= start && day <= end;
      });
      if (itemsOnDay.length > 0) {
        map.set(dayKey, itemsOnDay.sort((a, b) => {
            const aStart = new Date(isGCalEvent(a) ? (a.start.dateTime || a.start.date!) : a.start_date);
            const bStart = new Date(isGCalEvent(b) ? (b.start.dateTime || b.start.date!) : b.start_date);
            return aStart.getTime() - bStart.getTime();
        }));
      }
    });
    return map;
  }, [daysInMonth, combinedItems]);

  const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  return (
    <div className="p-2 sm:p-4 bg-background rounded-lg border">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg sm:text-xl font-bold">{format(currentMonth, 'MMMM yyyy', { locale: id })}</h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isMobile ? (
        <MobileMonthView projects={projects} gcalEvents={gcalEvents} currentMonth={currentMonth} />
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground border-b pb-2">
            {weekDays.map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 grid-rows-5 gap-1 mt-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="border-r border-b" />
            ))}
            {daysInMonth.map(day => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const items = itemsByDay.get(dayKey) || [];
              return (
                <div key={day.toString()} className={cn("h-28 border-r border-b p-1 overflow-hidden", isToday(day) && "bg-blue-50")}>
                  <span className={cn("text-xs", isToday(day) && "text-primary font-bold")}>{format(day, 'd')}</span>
                  <div className="mt-1 space-y-1">
                    {items.map((item, index) => {
                      const isGcal = isGCalEvent(item);
                      const name = isGcal ? item.summary : item.name;
                      const itemContent = (
                         <div className="flex items-center gap-1 text-xs px-1 py-1 rounded" style={{ backgroundColor: `${getItemColor(item)}20` }}>
                            <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: getItemColor(item) }} />
                            <span className="font-medium truncate" style={{ color: getItemColor(item) }}>{name}</span>
                          </div>
                      );
                      return isGcal ? (
                        <a key={index} href={item.htmlLink} target="_blank" rel="noopener noreferrer">{itemContent}</a>
                      ) : (
                        <Link to={`/projects/${(item as Project).slug}`} key={index}>{itemContent}</Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default MonthView;