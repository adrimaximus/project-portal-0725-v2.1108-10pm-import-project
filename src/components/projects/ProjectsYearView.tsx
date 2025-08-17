import { Project } from '@/types';
import { GoogleCalendarEvent } from '@/types';
import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  eachDayOfInterval,
  startOfYear,
  endOfYear,
  format,
  isSameDay,
  startOfMonth,
  getDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type CombinedItem = Project | GoogleCalendarEvent;

const isGCalEvent = (item: CombinedItem): item is GoogleCalendarEvent => {
  return 'summary' in item;
};

const getItemColor = (item: CombinedItem): string => {
  if (isGCalEvent(item)) {
    return '#f97316'; // Orange for Google Calendar events
  } else {
    switch (item.status) {
      case 'On Track': case 'Completed': case 'Done': case 'Billed': return '#22c55e'; // Green
      case 'At Risk': return '#f97316'; // Orange
      case 'Off Track': return '#ef4444'; // Red
      case 'On Hold': return '#64748b'; // Slate
      default: return '#a1a1aa'; // Zinc
    }
  }
};

const ProjectsYearView = ({ projects, gcalEvents }: { projects: Project[], gcalEvents: GoogleCalendarEvent[] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const combinedItems: CombinedItem[] = useMemo(() => [...projects, ...gcalEvents], [projects, gcalEvents]);

  const year = currentDate.getFullYear();
  const daysInYear = eachDayOfInterval({
    start: startOfYear(currentDate),
    end: endOfYear(currentDate),
  });

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CombinedItem[]>();
    daysInYear.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const itemsOnDay = combinedItems.filter(p => {
        const startDate = isGCalEvent(p) ? (p.start.dateTime || p.start.date) : p.startDate;
        const dueDate = isGCalEvent(p) ? (p.end.dateTime || p.end.date) : p.dueDate;
        if (!startDate || !dueDate) return false;
        const start = new Date(startDate);
        const end = new Date(dueDate);
        return isSameDay(day, start) || isSameDay(day, end) || (day > start && day < end);
      });
      if (itemsOnDay.length > 0) {
        map.set(dayKey, itemsOnDay);
      }
    });
    return map;
  }, [daysInYear, combinedItems]);

  const renderDayCell = (day: Date) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const items = itemsByDay.get(dayKey) || [];

    const content = (
      <div className={cn("h-full w-full flex flex-col items-center justify-center text-xs", isToday(day) && "bg-primary/10 rounded-md")}>
        <span>{format(day, 'd')}</span>
        <div className="flex mt-1">
          {items.slice(0, 2).map((item, index) => (
            <TooltipProvider key={index} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className="h-1.5 w-1.5 rounded-full mx-px"
                    style={{ backgroundColor: getItemColor(item) }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isGCalEvent(item) ? item.summary : item.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {items.length > 2 && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <div className="h-1.5 w-1.5 rounded-full bg-gray-300 mx-px" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{items.length - 2} more items</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    );

    if (items.length > 0) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent className="p-2">
              <div className="font-bold mb-2">{format(day, 'PPP')}</div>
              <ul className="space-y-2">
                {items.map((item, index) => {
                  const isGcal = isGCalEvent(item);
                  const name = isGcal ? item.summary : item.name;
                  const assignedTo = !isGcal ? (item as Project).assignedTo : [];
                  const itemContent = (
                    <li key={index} className="flex items-center gap-2 text-xs">
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: getItemColor(item) }} />
                      <span className="font-medium flex-1 truncate">{name}</span>
                      <div className="flex -space-x-2">
                        {assignedTo.slice(0, 2).map(user => (
                          <Avatar key={user.id} className="h-5 w-5 border-2 border-background">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.initials}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </li>
                  );
                  return isGcal ? (
                    <div key={index}>{itemContent}</div>
                  ) : (
                    <Link to={`/projects/${(item as Project).slug}`} key={index}>{itemContent}</Link>
                  );
                })}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  return (
    <div className="p-4 bg-background rounded-lg border">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 12))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-bold">{year}</h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 12))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {months.map(month => {
          const daysInMonth = eachDayOfInterval({
            start: startOfMonth(month),
            end: new Date(month.getFullYear(), month.getMonth() + 1, 0),
          });
          const firstDayOfMonth = (getDay(startOfMonth(month)) + 6) % 7;

          return (
            <div key={format(month, 'yyyy-MM')}>
              <h3 className="font-semibold text-center mb-2">{format(month, 'MMMM', { locale: id })}</h3>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
                {weekDays.map(day => <div key={day}>{day}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1 mt-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {daysInMonth.map(day => (
                  <div key={day.toString()} className="h-12 border rounded-md hover:bg-muted/50 transition-colors">
                    {renderDayCell(day)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectsYearView;